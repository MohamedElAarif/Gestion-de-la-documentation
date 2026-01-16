<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Emprunt;
use App\Models\Document;
use App\Models\Membre;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

// Controller for managing Emprunts (Loans)
class EmpruntController extends Controller
{
    // Check whether a document still has open loans and flip its `disponible` flag accordingly.
    protected function refreshDocumentAvailability(?int $documentId): void
    {
        if (empty($documentId)) {
            return;
        }

        $hasActiveLoan = Emprunt::where('document_id', $documentId)
            ->whereNull('date_retour')
            ->exists();

        Document::whereKey($documentId)->update([
            'disponible' => !$hasActiveLoan,
        ]);
    }

    // Build the select/autocomplete list for documents (only items still available can be borrowed).
    protected function documentOptions(): array
    {
        return Document::select(['id', 'titre', 'description'])
            ->where('disponible', true)
            ->orderBy('titre')
            ->get()
            ->map(function ($doc) {
                $label = $doc->titre
                    ?? $doc->description
                    ?? ('Document #' . $doc->id);
                return [
                    'id' => $doc->id,
                    'label' => $label,
                ];
            })
            ->toArray();
    }

    // Build the select/autocomplete list for members (simple "Nom Prenom" labels ordered alphabetically).
    protected function membreOptions(): array
    {
        return Membre::select(['id', 'nom', 'prenom'])
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get()
            ->map(function ($membre) {
                $parts = array_filter([$membre->nom, $membre->prenom]);
                $label = trim(implode(' ', $parts)) ?: ('Membre #' . $membre->id);
                return [
                    'id' => $membre->id,
                    'label' => $label,
                ];
            })
            ->toArray();
    }

    // Accepts nearly any date-ish input (Carbon, DateTime, string) and returns a safe `Y-m-d` string.
    protected function toDateString($val): ?string
    {
        if (empty($val)) {
            return null;
        }
        if ($val instanceof \DateTimeInterface) {
            return $val->format('Y-m-d');
        }
        if (is_object($val) && method_exists($val, 'toDateString')) {
            try {
                return $val->toDateString();
            } catch (\Throwable $ex) {
                //
            }
        }
        $ts = strtotime((string) $val);
        return $ts !== false ? date('Y-m-d', $ts) : null;
    }

    // Convert an Emprunt model (with relations) into the structure the React table expects.
    protected function normalizeModelInstance($e): array
    {
        $document = $e->document ?? null;
        $documentName = '';
        if (is_object($document)) {
            $documentName = $document->titre;
        } else {
            $documentName = (string) ($document ?? '');
        }

        $emprunteur = $e->emprunteur ?? null;
        $emprunteurName = '';
        if (is_object($emprunteur)) {
            $parts = [];
            if (!empty($emprunteur->nom)) {
                $parts[] = $emprunteur->nom;
            }
            if (!empty($emprunteur->prenom)) {
                $parts[] = $emprunteur->prenom;
            }
            $emprunteurName = trim(implode(' ', $parts));
            if ($emprunteurName === '' && !empty($emprunteur->name)) {
                $emprunteurName = $emprunteur->name;
            }
        } else {
            $emprunteurName = (string) ($emprunteur ?? '');
        }

        $dateRetourReelle = $this->toDateString($e->date_retour ?? $e->date_retour_reelle ?? null);
        $status = $e->status ?? ($dateRetourReelle ? 'Retourné' : 'En cours');

        return [
            'id' => $e->id,
            'document_id' => $e->document_id ?? null,
            'emprunteur_id' => $e->emprunteur_id ?? null,
            'document' => $documentName,
            'emprunteur' => $emprunteurName,
            'date_emprunt' => $this->toDateString($e->date_emprunt),
            'date_retour_prevue' => $this->toDateString($e->date_retour_prevue),
            'date_retour_reelle' => $dateRetourReelle,
            'status' => $status,
            'en_retard' => (bool) ($e->en_retard ?? false),
            'retard_notifie' => (bool) ($e->retard_notifie ?? $e->notifie_retard ?? false),
        ];
    }

    // RENDER the page (always): used when user opens /Emprunts in browser
    public function index(Request $request)
    {
        // Always fetch the latest data; falling back to the basic query if eager-loading fails keeps the UI usable.
        try {
            $raw = Emprunt::with(['document', 'emprunteur'])->orderByDesc('created_at')->get();
        } catch (\Throwable $ex) {
            $raw = Emprunt::orderByDesc('created_at')->get();
        }

        $emprunts = $raw->map(function ($e) {
            return $this->normalizeModelInstance($e);
        })->toArray();

        // Always render frontend page for browser navigation
        return Inertia::render('EmpruntsList', [
            'allEmprunts' => $emprunts,
            'documents' => $this->documentOptions(),
            'membres' => $this->membreOptions(),
        ]);
    }

    // JSON API for client data requests
    public function indexData(Request $request): JsonResponse
    {
        try {
            $raw = Emprunt::with(['document', 'emprunteur'])->orderByDesc('created_at')->get();
        } catch (\Throwable $ex) {
            $raw = Emprunt::orderByDesc('created_at')->get();
        }

        $emprunts = $raw->map(function ($e) {
            return $this->normalizeModelInstance($e);
        })->toArray();

        return response()->json($emprunts);
    }

    public function options(Request $request): JsonResponse
    {
        return response()->json([
            'documents' => $this->documentOptions(),
            'membres' => $this->membreOptions(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'document_id' => 'nullable|exists:documents,id',
            'document_label' => 'nullable|string|max:255|required_without:document_id',
            'emprunteur_id' => 'nullable|exists:membres,id',
            'emprunteur_label' => 'nullable|string|max:255|required_without:emprunteur_id',
            'date_emprunt' => 'required|date',
            'date_retour_prevue' => 'required|date|after_or_equal:date_emprunt',
        ]);

        $documentId = $data['document_id'] ?? null;
        if (empty($documentId) && !empty($data['document_label'])) {
            $documentLabel = trim($data['document_label']);
            $normalizedTitle = Str::lower($documentLabel);
            $existingDocument = Document::whereRaw('LOWER(TRIM(titre)) = ?', [$normalizedTitle])->first();
            if ($existingDocument) {
                $documentId = $existingDocument->id;
            } else {
                // Free-text document labels generate a lightweight Document row on the fly.
                $doc = Document::create([
                    'titre' => $documentLabel,
                    'description' => "Créé depuis l'emprunt",
                    'disponible' => true,
                ]);
                $documentId = $doc->id;
            }
        }

        $membreId = $data['emprunteur_id'] ?? null;
        if (empty($membreId) && !empty($data['emprunteur_label'])) {
            $label = trim($data['emprunteur_label']);
            $parts = preg_split('/\s+/', $label, 2);
            $nom = $parts[0] ?? $label;
            $prenom = $parts[1] ?? '';

            $existingMembreQuery = Membre::whereRaw('LOWER(TRIM(nom)) = ?', [Str::lower($nom)]);
            if ($prenom !== '') {
                $existingMembreQuery->whereRaw('LOWER(TRIM(prenom)) = ?', [Str::lower($prenom)]);
            }
            $existingMembre = $existingMembreQuery->first();

            if ($existingMembre) {
                $membreId = $existingMembre->id;
            } else {
                $m = Membre::create([
                    'nom' => $nom,
                    'prenom' => $prenom,
                ]);
                $membreId = $m->id;
            }
        }

        // If a document id is provided, ensure it's available
        if (!empty($documentId)) {
            $docCheck = Document::find($documentId);
            if (!$docCheck) {
                return response()->json(['message' => 'Document introuvable'], 404);
            }
            if (!($docCheck->disponible ?? false)) {
                return response()->json(['message' => 'Document non disponible'], 422);
            }
        }

        $emprunt = Emprunt::create([
            'document_id' => $documentId,
            'emprunteur_id' => $membreId,
            'date_emprunt' => $data['date_emprunt'],
            'date_retour_prevue' => $data['date_retour_prevue'],
            'date_retour' => null,
            'en_retard' => false,
            'notifie_retard' => false,
        ]);

        // Mark the chosen document as unavailable right away so other users cannot borrow it simultaneously.
        if (!empty($documentId)) {
            try {
                $doc = Document::find($documentId);
                if ($doc) {
                    $doc->disponible = false;
                    $doc->save();
                }
            } catch (\Throwable $ex) {
                // ignore availability update errors
            }
        }

        $this->refreshDocumentAvailability($documentId);

        try {
            $emprunt->load(['document', 'emprunteur']);
        } catch (\Throwable $ex) {
            // ignore if relations don't exist
        }

        return response()->json(['message' => 'Created', 'emprunt' => $this->normalizeModelInstance($emprunt)], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'document_id' => 'nullable|exists:documents,id',
            'emprunteur_id' => 'nullable|exists:membres,id',
            'date_emprunt' => 'required|date',
            'date_retour_prevue' => 'required|date',
            'date_retour_reelle' => 'nullable|date',
            'en_retard' => 'nullable|boolean',
            'retard_notifie' => 'nullable|boolean',
        ]);

        $emprunt = Emprunt::findOrFail($id);
        $originalDocumentId = $emprunt->document_id;

        $emprunt->document_id = $data['document_id'] ?? $emprunt->document_id;
        $emprunt->emprunteur_id = $data['emprunteur_id'] ?? $emprunt->emprunteur_id;
        $emprunt->date_emprunt = $data['date_emprunt'];
        $emprunt->date_retour_prevue = $data['date_retour_prevue'];
        if (array_key_exists('date_retour_reelle', $data)) {
            $emprunt->date_retour = $data['date_retour_reelle'];
        }
        if (array_key_exists('en_retard', $data)) {
            $emprunt->en_retard = (bool) $data['en_retard'];
        }
        if (array_key_exists('retard_notifie', $data)) {
            $emprunt->notifie_retard = (bool) $data['retard_notifie'];
        }
        $emprunt->save();

        if (!empty($originalDocumentId) && $originalDocumentId !== $emprunt->document_id) {
            $this->refreshDocumentAvailability($originalDocumentId);
        }
        $this->refreshDocumentAvailability($emprunt->document_id);

        try {
            $emprunt->load(['document', 'emprunteur']);
        } catch (\Throwable $ex) {
            //
        }

        return response()->json(['message' => 'Updated', 'emprunt' => $this->normalizeModelInstance($emprunt)]);
    }

    public function destroy($id): JsonResponse
    {
        $emprunt = Emprunt::findOrFail($id);
        $documentId = $emprunt->document_id;
        $emprunt->delete();

        $this->refreshDocumentAvailability($documentId);

        return response()->json(['message' => 'Deleted']);
    }

    public function markReturned($id): JsonResponse
    {
        $emprunt = Emprunt::findOrFail($id);
        $emprunt->date_retour = now()->toDateString();
        $emprunt->en_retard = false;
        $emprunt->notifie_retard = false;
        $emprunt->save();

        $this->refreshDocumentAvailability($emprunt->document_id);

        try {
            $emprunt->load(['document', 'emprunteur']);
        } catch (\Throwable $ex) {
            //
        }

        return response()->json(['message' => 'Marked returned', 'emprunt' => $this->normalizeModelInstance($emprunt)]);
    }
}

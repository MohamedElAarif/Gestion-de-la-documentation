<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Emprunt;
use App\Models\Document;
use App\Models\Exemplaire;
use App\Models\Membre;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

// Controller for managing Emprunts (Loans)
class EmpruntController extends Controller
{
    // Check whether a document still has open loans and flip its `disponible` flag accordingly.
    protected function refreshDocumentAvailability(?int $documentId): void
    {
        if (empty($documentId)) {
            return;
        }

        $document = Document::with('exemplaires')->find($documentId);

        if (!$document) {
            return;
        }

        $hasAvailableCopies = $document->exemplaires()
            ->where('disponible', true)
            ->where('is_archived', false)
            ->exists();

        $document->forceFill([
            'disponible' => $hasAvailableCopies && !$document->is_archived,
        ])->save();
    }

    protected function reserveExemplaire(Exemplaire $exemplaire): void
    {
        $exemplaire->forceFill([
            'disponible' => false,
        ])->save();
    }

    protected function releaseExemplaires(iterable $exemplaires): void
    {
        foreach ($exemplaires as $exemplaire) {
            $exemplaire->forceFill([
                'disponible' => !$exemplaire->is_archived,
            ])->save();
        }
    }

    // Build the select/autocomplete list for documents (only items still available can be borrowed).
    protected function documentOptions(): array
    {
        return Document::select(['id', 'titre', 'description'])
            ->where('disponible', true)
            ->where('is_archived', false)
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
        $enRetard = (bool) ($e->en_retard ?? false);
        if ($enRetard && $status !== 'Retourné') {
            $status = 'En retard';
        }

        $exemplairesPayload = collect($e->exemplaires ?? [])->map(function ($ex) {
            return [
                'id' => $ex->id,
                'code_exemplaire' => $ex->code_exemplaire,
            ];
        })->values()->toArray();

        return [
            'id' => $e->id,
            'document_id' => $e->document_id ?? null,
            'emprunteur_id' => $e->emprunteur_id ?? null,
            'batch_code' => $e->batch_code ?? null,
            'document' => $documentName,
            'emprunteur' => $emprunteurName,
            'date_emprunt' => $this->toDateString($e->date_emprunt),
            'date_retour_prevue' => $this->toDateString($e->date_retour_prevue),
            'date_retour_reelle' => $dateRetourReelle,
            'status' => $status,
            'en_retard' => $enRetard,
            'retard_notifie' => (bool) ($e->retard_notifie ?? $e->notifie_retard ?? false),
            'exemplaires' => $exemplairesPayload,
        ];
    }

    // RENDER the page (always): used when user opens /Emprunts in browser
    public function index(Request $request)
    {
        // Always fetch the latest data; falling back to the basic query if eager-loading fails keeps the UI usable.
        try {
            $raw = Emprunt::with(['document', 'emprunteur', 'exemplaires'])->orderByDesc('created_at')->get();
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
            $raw = Emprunt::with(['document', 'emprunteur', 'exemplaires'])->orderByDesc('created_at')->get();
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
            'document_label' => 'nullable|string|max:255',
            'exemplaire_ids' => 'nullable|array',
            'exemplaire_ids.*' => 'integer|distinct|exists:exemplaires,id',
            'take_all_available' => 'nullable|boolean',
            'entries' => 'nullable|array',
            'entries.*.document_id' => 'nullable|exists:documents,id',
            'entries.*.document_label' => 'nullable|string|max:255',
            'entries.*.take_all_available' => 'nullable|boolean',
            'entries.*.exemplaire_ids' => 'nullable|array',
            'entries.*.exemplaire_ids.*' => 'integer|distinct|exists:exemplaires,id',
            'emprunteur_id' => 'nullable|exists:membres,id',
            'emprunteur_label' => 'nullable|string|max:255|required_without:emprunteur_id',
            'date_emprunt' => 'required|date',
            'date_retour_prevue' => 'required|date|after_or_equal:date_emprunt',
        ]);

        $entriesInput = collect($data['entries'] ?? []);
        if ($entriesInput->isEmpty()) {
            $entriesInput = collect([[
                'document_id' => $data['document_id'] ?? null,
                'document_label' => $data['document_label'] ?? null,
                'take_all_available' => $data['take_all_available'] ?? false,
                'exemplaire_ids' => $data['exemplaire_ids'] ?? [],
            ]]);
        }

        $normalizedEntries = $entriesInput
            ->map(function ($entry) {
                return [
                    'document_id' => $entry['document_id'] ?? null,
                    'document_label' => $entry['document_label'] ?? null,
                    'take_all_available' => (bool) ($entry['take_all_available'] ?? false),
                    'exemplaire_ids' => collect($entry['exemplaire_ids'] ?? [])
                        ->filter(fn ($id) => !empty($id))
                        ->map(fn ($id) => (int) $id)
                        ->unique()
                        ->values(),
                ];
            })
            ->filter(function ($entry) {
                return !empty($entry['document_id'])
                    || !empty($entry['document_label'])
                    || $entry['exemplaire_ids']->isNotEmpty();
            })
            ->values();

        if ($normalizedEntries->isEmpty()) {
            return response()->json([
                'message' => 'Ajoutez au moins un document à emprunter.',
            ], 422);
        }

        $preparedEntries = $normalizedEntries->map(function ($entry, $index) {
            $documentId = $entry['document_id'];
            $documentLabel = $entry['document_label'] ?? null;
            $takeAll = (bool) $entry['take_all_available'];
            $selectedIds = $entry['exemplaire_ids'];

            if (empty($documentId) && $selectedIds->isNotEmpty()) {
                $candidate = Exemplaire::find($selectedIds->first());
                if ($candidate) {
                    $documentId = $candidate->document_id;
                }
            }

            if (empty($documentId) && !empty($documentLabel)) {
                $label = trim($documentLabel);
                if ($label !== '') {
                    $normalizedTitle = Str::lower($label);
                    $existingDocument = Document::whereRaw('LOWER(TRIM(titre)) = ?', [$normalizedTitle])->first();
                    if ($existingDocument) {
                        $documentId = $existingDocument->id;
                    }
                }
            }

            if (empty($documentId)) {
                throw ValidationException::withMessages([
                    "entries.$index.document_id" => 'Document introuvable. Sélectionnez un document existant.',
                ]);
            }

            $document = Document::with('exemplaires')->find($documentId);
            if (!$document) {
                throw ValidationException::withMessages([
                    "entries.$index.document_id" => 'Document introuvable.',
                ]);
            }

            if ($document->is_archived) {
                throw ValidationException::withMessages([
                    "entries.$index.document_id" => 'Ce document est archivé et ne peut pas être emprunté.',
                ]);
            }

            if ($takeAll) {
                $hasAvailableCopies = Exemplaire::where('document_id', $document->id)
                    ->where('disponible', true)
                    ->where('is_archived', false)
                    ->exists();

                if (!$hasAvailableCopies) {
                    throw ValidationException::withMessages([
                        "entries.$index.exemplaires" => 'Aucun exemplaire disponible pour ce document.',
                    ]);
                }
            } else {
                if ($selectedIds->isEmpty()) {
                    throw ValidationException::withMessages([
                        "entries.$index.exemplaires" => 'Sélectionnez au moins un exemplaire disponible pour ce document.',
                    ]);
                }

                $mismatchedDocument = Exemplaire::whereIn('id', $selectedIds)
                    ->where('document_id', '!=', $document->id)
                    ->exists();

                if ($mismatchedDocument) {
                    throw ValidationException::withMessages([
                        "entries.$index.exemplaires" => 'Tous les exemplaires doivent appartenir au document sélectionné.',
                    ]);
                }

                $availableCount = Exemplaire::where('document_id', $document->id)
                    ->whereIn('id', $selectedIds)
                    ->where('disponible', true)
                    ->where('is_archived', false)
                    ->count();

                if ($availableCount !== $selectedIds->count()) {
                    throw ValidationException::withMessages([
                        "entries.$index.exemplaires" => 'Certains exemplaires sélectionnés ne sont plus disponibles.',
                    ]);
                }
            }

            return [
                'index' => $index,
                'document' => $document,
                'take_all_available' => $takeAll,
                'selected_ids' => $selectedIds,
            ];
        })->values();

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

        if (empty($membreId)) {
            return response()->json([
                'message' => 'Sélectionnez ou créez un emprunteur valide.',
            ], 422);
        }

        $createdEmprunts = collect();
        $shouldAttachBatch = Schema::hasColumn('emprunts', 'batch_code');
        $batchCode = $shouldAttachBatch ? (string) Str::uuid() : null;

        DB::transaction(function () use (&$createdEmprunts, $preparedEntries, $data, $membreId, $batchCode, $shouldAttachBatch) {
            foreach ($preparedEntries as $entry) {
                /** @var Document $document */
                $document = $entry['document'];
                $takeAll = $entry['take_all_available'];

                if ($takeAll) {
                    $selectedExemplaires = Exemplaire::where('document_id', $document->id)
                        ->where('disponible', true)
                        ->where('is_archived', false)
                        ->orderBy('code_exemplaire')
                        ->lockForUpdate()
                        ->get();

                    if ($selectedExemplaires->isEmpty()) {
                        throw ValidationException::withMessages([
                            "entries.{$entry['index']}.exemplaires" => 'Aucun exemplaire disponible pour ce document.',
                        ]);
                    }
                } else {
                    $selectedExemplaires = Exemplaire::where('document_id', $document->id)
                        ->whereIn('id', $entry['selected_ids'])
                        ->where('disponible', true)
                        ->where('is_archived', false)
                        ->orderBy('code_exemplaire')
                        ->lockForUpdate()
                        ->get();

                    if ($selectedExemplaires->count() !== $entry['selected_ids']->count()) {
                        throw ValidationException::withMessages([
                            "entries.{$entry['index']}.exemplaires" => 'Certains exemplaires sélectionnés ne sont plus disponibles, merci de rafraîchir la liste.',
                        ]);
                    }
                }

                $empruntData = [
                    'document_id' => $document->id,
                    'emprunteur_id' => $membreId,
                    'date_emprunt' => $data['date_emprunt'],
                    'date_retour_prevue' => $data['date_retour_prevue'],
                    'date_retour' => null,
                    'en_retard' => false,
                    'notifie_retard' => false,
                ];

                if ($shouldAttachBatch && $batchCode) {
                    $empruntData['batch_code'] = $batchCode;
                }

                $emprunt = Emprunt::create($empruntData);

                $emprunt->exemplaires()->sync($selectedExemplaires->pluck('id')->all());
                foreach ($selectedExemplaires as $locked) {
                    $this->reserveExemplaire($locked);
                }
                $this->refreshDocumentAvailability($document->id);

                $createdEmprunts->push($emprunt);
            }
        });

        $empruntsPayload = $createdEmprunts->map(function (Emprunt $emprunt) {
            return $this->normalizeModelInstance($emprunt->fresh(['document', 'emprunteur', 'exemplaires']));
        });

        return response()->json([
            'message' => 'Created',
            'count' => $empruntsPayload->count(),
            'emprunts' => $empruntsPayload,
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'date_emprunt' => 'required|date',
            'date_retour_prevue' => 'required|date|after_or_equal:date_emprunt',
            'date_retour_reelle' => 'nullable|date',
            'en_retard' => 'nullable|boolean',
            'retard_notifie' => 'nullable|boolean',
        ]);

        $emprunt = Emprunt::with('exemplaires')->findOrFail($id);
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

        if (!empty($data['date_retour_reelle'])) {
            $this->releaseExemplaires($emprunt->exemplaires ?? []);
        }

        $this->refreshDocumentAvailability($emprunt->document_id);

        $emprunt->load(['document', 'emprunteur', 'exemplaires']);

        return response()->json(['message' => 'Updated', 'emprunt' => $this->normalizeModelInstance($emprunt)]);
    }

    public function destroy($id): JsonResponse
    {
        $emprunt = Emprunt::with('exemplaires')->findOrFail($id);
        $documentId = $emprunt->document_id;

        $this->releaseExemplaires($emprunt->exemplaires ?? []);
        $emprunt->delete();

        $this->refreshDocumentAvailability($documentId);

        return response()->json(['message' => 'Deleted']);
    }

    public function markReturned($id): JsonResponse
    {
        $emprunt = Emprunt::with('exemplaires')->findOrFail($id);
        $emprunt->date_retour = now()->toDateString();
        $emprunt->en_retard = false;
        $emprunt->notifie_retard = false;
        $emprunt->save();

        $this->releaseExemplaires($emprunt->exemplaires ?? []);
        $this->refreshDocumentAvailability($emprunt->document_id);

        $emprunt->load(['document', 'emprunteur', 'exemplaires']);

        return response()->json(['message' => 'Marked returned', 'emprunt' => $this->normalizeModelInstance($emprunt)]);
    }
}

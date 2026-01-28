<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use App\Models\Document;
use App\Models\Exemplaire;
use App\Models\Rayonnage;
use App\Models\Type_Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class DocumentController extends Controller
{
    protected function toDateString($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        if (is_object($value) && method_exists($value, 'toDateString')) {
            try {
                return $value->toDateString();
            } catch (\Throwable $ex) {
                // Ignore parsing errors
            }
        }

        $timestamp = strtotime((string) $value);
        return $timestamp !== false ? date('Y-m-d', $timestamp) : null;
    }

    protected function normalizeDocument(Document $document): array
    {
        $document->loadMissing(['rayonnage', 'categorie.rayonnage', 'typeDocument', 'exemplaires']);

        $totalCopies = $document->exemplaires_count ?? $document->exemplaires->count();
        $availableCopies = $document->exemplaires_disponibles_count
            ?? $document->exemplaires
                ->where('disponible', true)
                ->where('is_archived', false)
                ->count();

        $exemplaires = $document->exemplaires
            ->map(function ($ex) {
                $activeLoan = $ex->emprunts->first();

                return [
                    'id' => $ex->id,
                    'code_exemplaire' => $ex->code_exemplaire,
                    'disponible' => (bool) $ex->disponible,
                    'is_archived' => (bool) $ex->is_archived,
                    'date_creation' => $this->toDateString($ex->date_creation),
                    'created_at' => $this->toDateString($ex->created_at),
                    'updated_at' => $this->toDateString($ex->updated_at),
                    'current_emprunt' => $activeLoan ? [
                        'id' => $activeLoan->id,
                        'date_emprunt' => $this->toDateString($activeLoan->date_emprunt),
                        'date_retour_prevue' => $this->toDateString($activeLoan->date_retour_prevue),
                        'en_retard' => (bool) $activeLoan->en_retard,
                        'emprunteur' => $activeLoan->emprunteur ? [
                            'id' => $activeLoan->emprunteur->id,
                            'nom' => $activeLoan->emprunteur->nom,
                            'prenom' => $activeLoan->emprunteur->prenom,
                            'email' => $activeLoan->emprunteur->email,
                            'telephone' => $activeLoan->emprunteur->telephone,
                        ] : null,
                    ] : null,
                ];
            })
            ->toArray();

        return [
            'id' => $document->id,
            'titre' => $document->titre ?? '',
            'description' => $document->description ?? '',
            'disponible' => (bool) ($document->disponible ?? false),
            'dateCreation' => $this->toDateString($document->created_at),
            'dateModification' => $this->toDateString($document->updated_at),
            'dateAchat' => $this->toDateString($document->date_achat),
            'is_archived' => (bool) ($document->is_archived ?? false),
            'rayonnage_id' => $document->rayonnage_id,
            'rayonnage' => optional($document->rayonnage)->nom
                ?? optional(optional($document->categorie)->rayonnage)->nom
                ?? '',
            'categorie_id' => $document->categorie_id,
            'categorie' => optional($document->categorie)->nom ?? '',
            'type_id' => $document->type_id,
            'type' => optional($document->typeDocument)->nom ?? '',
            'nombreExemplaires' => $totalCopies,
            'exemplairesDisponibles' => $availableCopies,
            'hasArchivedExemplaires' => $document->exemplaires->contains(fn ($ex) => (bool) $ex->is_archived),
            'exemplaires' => $exemplaires,
        ];
    }

    public function index()
    {
        try {
            $documents = Document::with([
                    'rayonnage',
                    'categorie.rayonnage',
                    'typeDocument',
                    'exemplaires' => fn ($query) => $query
                        ->orderBy('code_exemplaire')
                        ->with(['emprunts' => fn ($empruntQuery) => $empruntQuery
                            ->whereNull('date_retour')
                            ->orderByDesc('created_at')
                            ->with('emprunteur')
                        ]),
                ])
                ->withCount([
                    'exemplaires',
                    'exemplaires as exemplaires_disponibles_count' => fn ($query) => $query
                        ->where('disponible', true)
                        ->where('is_archived', false),
                ])
                ->orderByDesc('created_at')
                ->get();
        } catch (\Throwable $ex) {
            $documents = Document::with([
                    'rayonnage',
                    'categorie',
                    'typeDocument',
                    'exemplaires' => fn ($query) => $query
                        ->orderBy('code_exemplaire')
                        ->with(['emprunts' => fn ($empruntQuery) => $empruntQuery
                            ->whereNull('date_retour')
                            ->orderByDesc('created_at')
                            ->with('emprunteur')
                        ]),
                ])
                ->orderByDesc('created_at')
                ->get();
        }

        $allDocuments = $documents->map(fn ($doc) => $this->normalizeDocument($doc))->toArray();

        $rayonnages = Rayonnage::select(['id', 'nom'])
            ->orderBy('nom')
            ->get()
            ->map(fn ($ray) => ['id' => $ray->id, 'nom' => $ray->nom])
            ->toArray();

        $categories = Categorie::select(['id', 'nom', 'rayonnage_id'])
            ->orderBy('nom')
            ->get()
            ->map(fn ($cat) => ['id' => $cat->id, 'nom' => $cat->nom, 'rayonnage_id' => $cat->rayonnage_id])
            ->toArray();

        $types = Type_Document::select(['id', 'nom'])
            ->orderBy('nom')
            ->get()
            ->map(fn ($type) => ['id' => $type->id, 'nom' => $type->nom])
            ->toArray();

        return Inertia::render('DocumentsList', [
            'allDocuments' => $allDocuments,
            'rayonnages' => $rayonnages,
            'categories' => $categories,
            'types' => $types,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'date_achat' => 'nullable|date',
            'rayonnage_id' => 'required|exists:rayonnages,id',
            'categorie_id' => 'required|exists:categories,id',
            'type_id' => 'nullable|exists:type_documents,id',
            'is_archived' => 'sometimes|boolean',
            'nombre_exemplaires' => 'required|integer|min:1|max:200',
        ]);

        $nombreExemplaires = (int) $validated['nombre_exemplaires'];
        unset($validated['nombre_exemplaires']);

        $validated['type_id'] = $validated['type_id'] ?? null;
        $validated['is_archived'] = (bool) ($validated['is_archived'] ?? false);

        $document = null;

        DB::transaction(function () use (&$document, $validated, $nombreExemplaires) {
            $document = Document::create($validated + ['disponible' => true]);
            $this->syncExemplairesCount($document, $nombreExemplaires);
            $this->refreshDocumentAvailability($document);
        });

        return redirect()->route('documents')->with('success', 'Document created successfully!');
    }

    public function update(Request $request, $id)
    {
        $document = Document::findOrFail($id);

        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'date_achat' => 'nullable|date',
            'rayonnage_id' => 'required|exists:rayonnages,id',
            'categorie_id' => 'required|exists:categories,id',
            'type_id' => 'nullable|exists:type_documents,id',
            'is_archived' => 'sometimes|boolean',
            'nombre_exemplaires' => 'required|integer|min:1|max:200',
        ]);

        $nombreExemplaires = (int) $validated['nombre_exemplaires'];
        unset($validated['nombre_exemplaires']);

        $validated['type_id'] = $validated['type_id'] ?? null;
        $validated['is_archived'] = (bool) ($validated['is_archived'] ?? false);

        DB::transaction(function () use ($document, $validated, $nombreExemplaires) {
            $document->update($validated);
            $this->syncExemplairesCount($document, $nombreExemplaires);
            $this->refreshDocumentAvailability($document);
        });

        return redirect()->route('documents')->with('success', 'Document updated successfully!');
    }

    public function destroy($id)
    {
        $document = Document::findOrFail($id);

        $hasActiveLoans = $document->exemplaires()
            ->whereHas('emprunts', fn ($query) => $query->whereNull('date_retour'))
            ->exists();

        if ($hasActiveLoans) {
            throw ValidationException::withMessages([
                'document' => 'Impossible de supprimer ce document car certains exemplaires sont actuellement empruntés.',
            ]);
        }

        DB::transaction(function () use ($document) {
            $document->emprunts()->delete();
            $document->exemplaires()->delete();
            $document->delete();
        });

        return redirect()->route('documents')->with('success', 'Document deleted successfully!');
    }

    public function addExemplaire(Request $request, Document $document)
    {
        $validated = $request->validate([
            'quantity' => 'nullable|integer|min:1|max:50',
            'labels' => 'nullable|array|min:1|max:50',
            'labels.*' => 'required|string|max:100',
        ]);

        $labels = collect($validated['labels'] ?? [])
            ->map(fn ($label) => $this->normalizeExemplaireCode($label))
            ->filter()
            ->values();

        if ($labels->isEmpty() && empty($validated['quantity'])) {
            throw ValidationException::withMessages([
                'labels' => 'Ajoutez au moins un exemplaire ou indiquez une quantité.',
            ]);
        }

        $quantity = $labels->isNotEmpty() ? $labels->count() : (int) $validated['quantity'];

        DB::transaction(function () use ($document, $quantity, $labels) {
            $this->createExemplairesForDocument($document, $quantity, $labels->all());
            $this->refreshDocumentAvailability($document);
        });

        return redirect()->back()->with('success', 'Exemplaire(s) ajouté(s) avec succès.');
    }

    protected function syncExemplairesCount(Document $document, int $targetCount): void
    {
        $currentCount = $document->exemplaires()->count();

        if ($targetCount === $currentCount) {
            return;
        }

        if ($targetCount > $currentCount) {
            $this->createExemplairesForDocument($document, $targetCount - $currentCount);
            return;
        }

        $difference = $currentCount - $targetCount;

        $removable = $document->exemplaires()
            ->where('is_archived', false)
            ->where('disponible', true)
            ->whereDoesntHave('emprunts', fn ($query) => $query->whereNull('date_retour'))
            ->orderByDesc('id')
            ->take($difference)
            ->get();

        if ($removable->count() < $difference) {
            throw ValidationException::withMessages([
                'nombre_exemplaires' => 'Impossible de réduire le nombre d\'exemplaires car certains sont actuellement empruntés.',
            ]);
        }

        $removable->each->delete();
    }

    protected function createExemplairesForDocument(Document $document, int $count, array $customCodes = []): void
    {
        $payload = collect(range(1, $count))->map(function ($index) use ($customCodes) {
            $customCode = $customCodes[$index - 1] ?? null;

            return [
                'code_exemplaire' => $customCode ?: $this->generateExemplaireCode(),
                'disponible' => true,
                'is_archived' => false,
                'date_creation' => now(),
            ];
        })->all();

        $document->exemplaires()->createMany($payload);
    }

    protected function normalizeExemplaireCode(string $value): string
    {
        $normalized = strtoupper(trim($value));
        $normalized = preg_replace('/\s+/', '-', $normalized);

        return $normalized ?: $this->generateExemplaireCode();
    }

    protected function refreshDocumentAvailability(Document $document): void
    {
        $hasAvailableCopies = $document->exemplaires()
            ->where('disponible', true)
            ->where('is_archived', false)
            ->exists();

        $document->forceFill([
            'disponible' => $hasAvailableCopies && !$document->is_archived,
        ])->save();
    }

    protected function generateExemplaireCode(): string
    {
        return strtoupper('EX-' . Str::random(6));
    }

    public function destroyExemplaire(Document $document, Exemplaire $exemplaire)
    {
        if ($exemplaire->document_id !== $document->id) {
            abort(404);
        }

        $hasActiveLoan = $exemplaire->emprunts()->whereNull('date_retour')->exists();
        if ($hasActiveLoan) {
            throw ValidationException::withMessages([
                'exemplaire' => 'Impossible de supprimer cet exemplaire car il est emprunté.',
            ]);
        }

        $exemplaire->delete();
        $this->refreshDocumentAvailability($document);

        return redirect()->back()->with('success', 'Exemplaire supprimé avec succès.');
    }

    public function toggleExemplaireArchive(Request $request, Document $document, Exemplaire $exemplaire)
    {
        if ($exemplaire->document_id !== $document->id) {
            abort(404);
        }

        $validated = $request->validate([
            'archived' => ['required', 'boolean'],
        ]);

        $targetState = (bool) $validated['archived'];

        if ($targetState) {
            $hasActiveLoan = $exemplaire->emprunts()->whereNull('date_retour')->exists();
            if ($hasActiveLoan) {
                throw ValidationException::withMessages([
                    'exemplaire' => 'Impossible d\'archiver un exemplaire actuellement emprunté.',
                ]);
            }
        }

        $exemplaire->forceFill([
            'is_archived' => $targetState,
            'disponible' => $targetState ? false : true,
        ])->save();

        $this->refreshDocumentAvailability($document);

        return redirect()->back()->with('success', $targetState
            ? 'Exemplaire archivé avec succès.'
            : 'Exemplaire restauré avec succès.'
        );
    }

    public function availableExemplaires(Document $document)
    {
        $exemplaires = $document->exemplaires()
            ->where('disponible', true)
            ->where('is_archived', false)
            ->orderBy('code_exemplaire')
            ->get(['id', 'code_exemplaire']);

        return response()->json($exemplaires->map(function ($ex) {
            return [
                'id' => $ex->id,
                'code_exemplaire' => $ex->code_exemplaire,
                'label' => $ex->code_exemplaire ? ($ex->code_exemplaire . ' (#' . $ex->id . ')') : ('Exemplaire #' . $ex->id),
            ];
        })->toArray());
    }
}

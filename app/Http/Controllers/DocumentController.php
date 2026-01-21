<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use App\Models\Document;
use App\Models\Emprunt;
use App\Models\Rayonnage;
use App\Models\Type_Document;
use Illuminate\Http\Request;
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
        return [
            'id' => $document->id,
            'titre' => $document->titre ?? '',
            'description' => $document->description ?? '',
            'disponible' => (bool) ($document->disponible ?? false),
            'dateCreation' => $this->toDateString($document->created_at),
            'dateModification' => $this->toDateString($document->updated_at),
            'rayonnage_id' => $document->rayonnage_id,
            'rayonnage' => optional($document->rayonnage)->nom
                ?? optional(optional($document->categorie)->rayonnage)->nom
                ?? '',
            'categorie_id' => $document->categorie_id,
            'categorie' => optional($document->categorie)->nom ?? '',
            'type_id' => $document->type_id,
            'type' => optional($document->typeDocument)->nom ?? '',
        ];
    }

    public function index()
    {
        try {
            $documents = Document::with(['rayonnage', 'categorie.rayonnage', 'typeDocument'])
                ->orderByDesc('created_at')
                ->get();
        } catch (\Throwable $ex) {
            $documents = Document::orderByDesc('created_at')->get();
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
            'rayonnage_id' => 'required|exists:rayonnages,id',
            'categorie_id' => 'required|exists:categories,id',
            'type_id' => 'required|exists:type_documents,id',
        ]);

        Document::create($validated + ['disponible' => true]);

        return redirect()->route('documents')->with('success', 'Document created successfully!');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'rayonnage_id' => 'required|exists:rayonnages,id',
            'categorie_id' => 'required|exists:categories,id',
            'type_id' => 'required|exists:type_documents,id',
            'disponible' => 'sometimes|boolean',
        ]);

        $document = Document::findOrFail($id);
        $document->update($validated);

        return redirect()->route('documents')->with('success', 'Document updated successfully!');
    }

    public function destroy($id)
    {
        $document = Document::findOrFail($id);
        $document->emprunts()->delete();
        $document->delete();

        return redirect()->route('documents')->with('success', 'Document deleted successfully!');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use App\Models\Document;
use App\Models\Rayonnage;
use App\Models\Type_Document;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentController extends Controller
{
    
    public function index()
    {
        $allDocuments = Document::with(['categorie.rayonnage','typeDocument'])
            ->select('id', 'titre', 'description', 'disponible', 'categorie_id', 'type_id','updated_at')
            ->get();
        $mockRayonnages = Rayonnage::with(['categories'])
            ->select('id', 'nom')
            ->get();
        $mockCategories = Categorie::with(['rayonnage'])
            // ->select('id', 'nom', 'rayonnage_id')
            ->get();
        $mockTypes = Type_Document::with(['documents'])
            // ->select('id', 'nom', 'rayonnage_id')
            ->get();

        return Inertia::render('DocumentsList', [
            'allDocuments' => $allDocuments,
            'mockRayonnages' => $mockRayonnages,
            'allCategories' => $mockCategories,
            'mockTypes' => $mockTypes,
        ]);
    }
    public function store(Request $request){
        // $validated = $request->validate([
        //     'title' => 'required|max:255',
        //     'description' => 'required|max:1000',
        //     'rayonnage_id' => 'required|exists:rayonnages,id',
        //     'categorie_id' => 'required|exists:categories,id',
        //     'type_id' => 'required|exists:type_documents,id', 
        // ]);
        $document = new Document();
        $document->titre = $request->titre;
        $document->description = $request->description;
        $document->rayonnage_id = $request->rayonnage_id;
        $document->categorie_id = $request->categorie_id;
        $document->type_id = $request->type_id;
        $document->disponible = true;
        $document->save();
        // Document::create([
        //     'titre' => $validated['title'],
        //     'description' => $validated['description'],
        //     'rayonnage_id' => $validated['rayonnage_id'],
        //     'categorie_id' => $validated['categorie_id'],
        //     'type_id' => $validated['type_id'],
        //     'disponible' => true, 
        // ]);

        return redirect()->route('documents')->with('success', 'Document created successfully!');
    }
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'required|max:255',
            'description' => 'required|max:1000',
            'rayonnage_id' => 'required|exists:rayonnages,id',
            'categorie_id' => 'required|exists:categories,id',
            'type_id' => 'required|exists:type_documents,id',
        ]);

        $document = Document::findOrFail($id);
        $document->update([
            'titre' => $validated['title'],
            'description' => $validated['description'],
            'rayonnage_id' => $validated['rayonnage_id'],
            'categorie_id' => $validated['categorie_id'],
            'type_id' => $validated['type_id'],
        ]);

        return redirect()->route('documents.index')->with('success', 'Document updated successfully!');
    }

    public function destroy($id)
    {
        $document = Document::findOrFail($id);
        $document->delete();

        return redirect()->route('documents.index')->with('success', 'Document deleted successfully!');
    }
}

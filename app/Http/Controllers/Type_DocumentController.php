<?php

namespace App\Http\Controllers;

use App\Models\Type_Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Type_DocumentController extends Controller
{
    public function index()
    {
        $mockTypeDocument = Type_Document::all();

        return Inertia::render('TypeDocumentList',[
            'mockTypeDocument' => $mockTypeDocument,
        ]);
    }
    public function indexData(Request $request): JsonResponse
    {
        try {
            $raw = Type_Document::all();
        } catch (\Throwable $ex) {
            $raw = Type_Document::all();
        }

        $typeDocuments = $raw->toArray();

        return response()->json($typeDocuments);
    }
    public function store(Request $request)
    {
        $typeDocument = new Type_Document();
        $typeDocument->nom = $request->nom;
        $typeDocument->description = $request->description;
        $typeDocument->save();
        return redirect()->back()->with('success', 'Type_Document created successfully!');

    }
    public function destroy($id)
    {
        $typeDocument = Type_Document::findOrFail($id);
        $typeDocument->delete();

        return redirect()->back()->with('success', 'Type_Document deleted successfully!');
    }
    public function update(Request $request, $id)
    {
        $typeDocument = Type_Document::findOrFail($id);
        $typeDocument->update([
            'nom' => $request->nom,
            'description' => $request->description,
        ]);
        return redirect()->back()->with('success', 'Type_Document updated successfully!');
    }
}

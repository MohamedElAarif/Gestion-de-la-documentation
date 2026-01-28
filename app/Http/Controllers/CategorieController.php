<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategorieController extends Controller
{
    public function index()
    {
        $mockCategorie = Categorie::all();

        return Inertia::render('CategorieList',[
            'mockCategorie' => $mockCategorie,
        ]);
    }
    public function indexData(Request $request): JsonResponse
    {
        try {
            $raw = Categorie::all();
        } catch (\Throwable $ex) {
            $raw = Categorie::all();
        }

        $categorie = $raw->toArray();

        return response()->json($categorie);
    }
    public function store(Request $request)
    {
        $categorie = new Categorie();
        $categorie->nom = $request->nom;
        $categorie->description = $request->description;
        $categorie->rayonnage_id = 1;
        $categorie->save();
        return redirect()->back()->with('success', 'Categorie created successfully!');

    }
    public function destroy($id)
    {
        $categorie = Categorie::findOrFail($id);
        $categorie->delete();

        return redirect()->back()->with('success', 'Categorie deleted successfully!');
    }
    public function update(Request $request, $id)
    {
        $categorie = Categorie::findOrFail($id);
        $categorie->update([
            'nom' => $request->nom,
            'description' => $request->description,
            'rayonnage_id' => 1,
        ]);
        return redirect()->back()->with('success', 'Categorie updated successfully!');
    }
}

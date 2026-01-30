<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use App\Models\Rayonnage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategorieController extends Controller
{
    public function index()
    {
        $mockCategorie = Categorie::all();
        $rayonnages = Rayonnage::all();

        return Inertia::render('CategorieList',[
            'mockCategorie' => $mockCategorie,
            'rayonnages' => $rayonnages,
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
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'rayonnage_id' => 'required|exists:rayonnages,id',
        ]);

        $categorie = Categorie::create($validated);
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
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'rayonnage_id' => 'required|exists:rayonnages,id',
        ]);

        $categorie = Categorie::findOrFail($id);
        $categorie->update($validated);
        return redirect()->back()->with('success', 'Categorie updated successfully!');
    }
}

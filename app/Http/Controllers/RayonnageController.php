<?php

namespace App\Http\Controllers;

use App\Models\Rayonnage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class RayonnageController extends Controller
{
    public function index()
    {
        $mockRayonnage = Rayonnage::all();

        return Inertia::render('RayonnageList',[
            'mockRayonnage' => $mockRayonnage,
        ]);
    }
    public function indexData(Request $request): JsonResponse
    {
        try {
            $raw = Rayonnage::all();
        } catch (\Throwable $ex) {
            $raw = Rayonnage::all();
        }

        $rayonnage = $raw->toArray();

        return response()->json($rayonnage);
    }
    public function store(Request $request)
    {
        $rayonnage = new Rayonnage();
        $rayonnage->nom = $request->nom;
        $rayonnage->save();
        return redirect()->back()->with('success', 'Rayonnage created successfully!');

    }
    public function destroy($id)
    {
        $rayonnage = Rayonnage::findOrFail($id);
        $rayonnage->delete();

        return redirect()->back()->with('success', 'Rayonnage deleted successfully!');
    }
    public function update(Request $request, $id)
    {
        $rayonnage = Rayonnage::findOrFail($id);
        $rayonnage->update([
            'nom' => $request->nom,
        ]);
        return redirect()->back()->with('success', 'Rayonnage updated successfully!');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Membre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MembreController extends Controller
{
    protected function transform(Membre $membre): array
    {
        return [
            'id' => $membre->id,
            'nom' => $membre->nom,
            'prenom' => $membre->prenom,
            'cin' => $membre->CIN,
            'email' => $membre->email,
            'telephone' => $membre->telephone,
            'dateCreation' => optional($membre->created_at)->format('Y-m-d'),
            'actif' => (bool) ($membre->is_active ?? true),
        ];
    }

    public function index()
    {
        $membres = Membre::orderByDesc('created_at')
            ->get()
            ->map(fn (Membre $membre) => $this->transform($membre));

        return Inertia::render('MembreList', [
            'membres' => $membres,
        ]);
    }

    public function data(): JsonResponse
    {
        $items = Membre::orderByDesc('created_at')
            ->get()
            ->map(fn (Membre $membre) => $this->transform($membre));

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'cin' => ['required', 'string', 'max:50', 'unique:membres,CIN'],
            'email' => ['required', 'email', 'max:255', 'unique:membres,email'],
            'telephone' => ['required', 'string', 'max:50', 'unique:membres,telephone'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $membre = Membre::create([
            'nom' => $data['nom'],
            'prenom' => $data['prenom'],
            'CIN' => $data['cin'],
            'email' => $data['email'],
            'telephone' => $data['telephone'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json($this->transform($membre), 201);
    }

    public function update(Request $request, Membre $membre): JsonResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'cin' => ['required', 'string', 'max:50', Rule::unique('membres', 'CIN')->ignore($membre->id)],
            'email' => ['required', 'email', 'max:255', Rule::unique('membres', 'email')->ignore($membre->id)],
            'telephone' => ['required', 'string', 'max:50', Rule::unique('membres', 'telephone')->ignore($membre->id)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $membre->update([
            'nom' => $data['nom'],
            'prenom' => $data['prenom'],
            'CIN' => $data['cin'],
            'email' => $data['email'],
            'telephone' => $data['telephone'],
            'is_active' => $data['is_active'] ?? $membre->is_active,
        ]);

        return response()->json($this->transform($membre));
    }

    public function destroy(Membre $membre): JsonResponse
    {
        $membre->delete();

        return response()->json(['success' => true]);
    }

    public function toggleActive(Membre $membre): JsonResponse
    {
        $membre->is_active = !$membre->is_active;
        $membre->save();

        return response()->json($this->transform($membre));
    }
}

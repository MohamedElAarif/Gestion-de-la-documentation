<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentController extends Controller
{
    
    public function index()
    {
        $allDocuments = Document::with(['categorie.rayonnage','typeDocument'])
            ->select('id', 'titre', 'description', 'disponible', 'categorie_id', 'type_id','updated_at')
            ->get();

        return Inertia::render('DocumentsList', [
            'allDocuments' => $allDocuments,
        ]);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'disponible',
        'rayonnage_id',
        'categorie_id',
        'type_id',
    ];

    public function categorie()
    {
        return $this->belongsTo(Categorie::class);
    }

    public function rayonnage()
    {
        return $this->belongsTo(Rayonnage::class);
    }

    public function typeDocument()
    {
        return $this->belongsTo(Type_Document::class, 'type_id');
    }
}

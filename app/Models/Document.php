<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Emprunt;
use App\Models\Exemplaire;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'date_achat',
        'disponible',
        'is_archived',
        'rayonnage_id',
        'categorie_id',
        'type_id',
    ];

    protected $casts = [
        'date_achat' => 'date',
        'disponible' => 'boolean',
        'is_archived' => 'boolean',
    ];

    public function categorie()
    {
        return $this->belongsTo(Categorie::class);
    }

    public function typeDocument()
    {
        return $this->belongsTo(Type_Document::class, 'type_id');
    }

    public function rayonnage()
    {
        return $this->belongsTo(Rayonnage::class);
    }

    public function emprunts()
    {
        return $this->hasMany(Emprunt::class);
    }

    public function exemplaires()
    {
        return $this->hasMany(Exemplaire::class);
    }
}

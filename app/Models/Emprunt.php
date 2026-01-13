<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Emprunt extends Model
{
    protected $fillable = ['date_emprunt','date_retour_prevue','date_retour','en_retard','notifie_retard'];
    use HasFactory;

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function emprunteur()
    {
        return $this->belongsTo(Membre::class, 'emprunteur_id');
    }
}
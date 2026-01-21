<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Document;
use App\Models\Exemplaire;
use App\Models\Membre;
use App\Models\Notification;

class Emprunt extends Model
{
    use HasFactory;

    protected $fillable = [
        'date_emprunt',
        'date_retour_prevue',
        'date_retour',
        'en_retard',
        'is_archived',
        'notifie_retard',
        'document_id',
        'emprunteur_id',
    ];

    protected $casts = [
        'date_emprunt' => 'date',
        'date_retour_prevue' => 'date',
        'date_retour' => 'date',
        'en_retard' => 'boolean',
        'is_archived' => 'boolean',
        'notifie_retard' => 'boolean',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function emprunteur()
    {
        return $this->belongsTo(Membre::class, 'emprunteur_id');
    }

    public function exemplaires()
    {
        return $this->belongsToMany(Exemplaire::class, 'emprunt_exemplaire')->withTimestamps();
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class Exemplaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'code_exemplaire',
        'disponible',
        'is_archived',
        'date_creation',
    ];

    protected $casts = [
        'disponible' => 'boolean',
        'is_archived' => 'boolean',
        'date_creation' => 'date',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function emprunts()
    {
        return $this->belongsToMany(Emprunt::class, 'emprunt_exemplaire')->withTimestamps();
    }

    protected static function booted()
    {
        static::deleting(function (Exemplaire $exemplaire) {
            $hasActiveLoan = $exemplaire->emprunts()
                ->whereNull('date_retour')
                ->exists();

            if ($hasActiveLoan) {
                throw ValidationException::withMessages([
                    'exemplaire' => 'Impossible de supprimer un exemplaire actuellement emprunté.',
                ]);
            }
        });
    }
}

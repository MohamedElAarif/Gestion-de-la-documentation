<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categorie extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'description',
        'date_creation',
        'rayonnage_id',
    ];

    public function rayonnage()
    {
        return $this->belongsTo(Rayonnage::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }
}

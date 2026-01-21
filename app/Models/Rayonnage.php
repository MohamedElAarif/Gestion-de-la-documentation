<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rayonnage extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'description',
        'date_creation',
    ];

    public function categories()
    {
        return $this->hasMany(Categorie::class);
    }

    // has many meaning through relationship to get documents through categories
    public function documents()
    {
        return $this->hasManyThrough(Document::class, Categorie::class);
    }
}

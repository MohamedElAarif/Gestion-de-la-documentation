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

    protected $appends = ['dateCreation'];

    public function getDateCreationAttribute()
    {
        return $this->created_at ? $this->created_at->format('Y-m-d') : null;
    }

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

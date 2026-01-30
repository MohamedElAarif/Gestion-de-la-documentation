<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Type_Document extends Model
{
    use HasFactory;

    protected $table = 'type_documents';

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

    public function documents()
    {
        return $this->hasMany(Document::class,'type_id');
    }
}

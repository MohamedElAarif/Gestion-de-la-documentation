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

    public function documents()
    {
        return $this->hasMany(Document::class,'type_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'titre','description','disponible'];

    use HasFactory;

    public function categorie()
    {
        return $this->belongsTo(Categorie::class);
    }
    public function typeDocument()
    {
        return $this->belongsTo(Type_Document::class, 'type_id');
    }

}

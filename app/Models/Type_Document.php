<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Type_Document extends Model
{
    protected $fillable = ['nom','description'];
    protected $table = 'type_documents';
    use HasFactory;
}

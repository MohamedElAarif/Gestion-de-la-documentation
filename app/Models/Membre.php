<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Membre extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'prenom',
        'CIN',
        'email',
        'telephone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}

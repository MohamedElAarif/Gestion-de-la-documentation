<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'emprunt_id',
        'message',
        'est_lu',
    ];

    protected $casts = [
        'est_lu' => 'boolean',
    ];

    public function emprunt()
    {
        return $this->belongsTo(Emprunt::class);
    }
}

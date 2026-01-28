<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('emprunt_exemplaire', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emprunt_id')->constrained('emprunts')->cascadeOnDelete();
            $table->foreignId('exemplaire_id')->constrained('exemplaires')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['emprunt_id', 'exemplaire_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emprunt_exemplaire');
    }
};

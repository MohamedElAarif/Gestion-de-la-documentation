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
        Schema::create('emprunts', function (Blueprint $table) {
            $table->id();
            $table->date('date_emprunt');
            $table->date('date_retour_prevue');
            $table->date('date_retour')->nullable();
            $table->boolean('en_retard')->default(false);
            $table->boolean('is_archived')->default(false);
            $table->boolean('notifie_retard')->default(false);
            $table->foreignId('document_id')
                ->constrained()
                ->onDelete('cascade');
            $table->foreignId('emprunteur_id')
                ->constrained('membres')
                ->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emprunts');
    }
};

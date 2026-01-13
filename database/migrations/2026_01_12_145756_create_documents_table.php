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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('titre')
                ->nullable(false);
            $table->text('description')
                ->nullable();
            $table->boolean('disponible')
                ->nullable(false)
                ->default(true);
            $table->foreignId('rayonnage_id')
                ->constrained('rayonnages')
                ->cascadeOnDelete();

            $table->foreignId('categorie_id')
                ->constrained('categories')
                ->cascadeOnDelete();

            $table->foreignId('type_id')
                ->nullable()
                ->constrained('type_documents')
                ->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};

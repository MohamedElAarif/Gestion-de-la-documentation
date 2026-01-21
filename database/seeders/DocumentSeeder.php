<?php

namespace Database\Seeders;

use App\Models\Document;
use App\Models\Exemplaire;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DocumentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $documents = Document::factory()
            ->count(20)
            ->create();

        $documents->each(function (Document $document) {
            $exemplaireCount = fake()->numberBetween(2, 5);

            Exemplaire::factory()
                ->count($exemplaireCount)
                ->create([
                    'document_id' => $document->id,
                ]);

            $document->update([
                'disponible' => $document->exemplaires()->where('disponible', true)->exists(),
            ]);
        });
    }
}

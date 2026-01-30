<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Rayonnage;
use App\Models\Categorie;
use App\Models\Type_Document;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Document>
 */
class DocumentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categorie = Categorie::query()->inRandomOrder()->with('rayonnage')->first();

        if (!$categorie) {
            $rayonnage = Rayonnage::factory()->create();
            $categorie = Categorie::factory()->create([
                'rayonnage_id' => $rayonnage->id,
            ]);
        }

        $type = Type_Document::query()->inRandomOrder()->first()
            ?? Type_Document::factory()->create();

        return [
            'titre' => fake()->sentence(2),
            'description' => fake()->sentence(3),
            'date_achat' => fake()->dateTimeBetween('-10 years', 'now'),
            'disponible' => true,
            'is_archived' => fake()->boolean(5),
            'rayonnage_id' => $categorie->rayonnage_id,
            'categorie_id' => $categorie->id,
            'type_id' => $type->id,
        ];
    }
}

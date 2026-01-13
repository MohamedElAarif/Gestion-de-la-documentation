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
        return [
            'titre' => fake()->sentence(1),
            'description' => fake()->paragraph(1),
            'disponible' => fake()->boolean(70),
            'rayonnage_id' => Rayonnage::inRandomOrder()->first()->id,
            'categorie_id' => Categorie::inRandomOrder()->first()->id,
            'type_id' => Type_Document::inRandomOrder()->first()->id,
        ];
    }
}

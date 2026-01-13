<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Document;
use App\Models\Membre;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Emprunt>
 */
class EmpruntFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'date_emprunt' => fake()->date(),
            'date_retour_prevue' => fake()->date(),
            'date_retour' => fake()->date(),
            'en_retard' => fake()->boolean(10),
            'notifie_retard' => fake()->boolean(10),
            'document_id' => Document::inRandomOrder()->first()->id,
            'emprunteur_id' => Membre::inRandomOrder()->first()->id,
        ];
    }
}

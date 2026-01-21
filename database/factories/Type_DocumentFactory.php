<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Type_Document>
 */
class Type_DocumentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nom' => fake()->unique()->words(2, true),
            'description' => fake()->paragraph(),
            'date_creation' => fake()->dateTimeBetween('-5 years', 'now'),
        ];
    }
}

<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Rayonnage>
 */
class RayonnageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nom' => fake()->unique()->bothify('RAY-###'),
            'description' => fake()->paragraph(),
            'date_creation' => fake()->dateTimeBetween('-10 years', 'now'),
        ];
    }
}

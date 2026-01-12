<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Membre>
 */
class MembreFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nom' => fake()->firstName(),
            'prenom' => fake()->lastName(),
            'CIN' => fake()->unique()->regexify('[A-Z]{1,2}[0-9]{5,6}'),
            'email' => fake()->unique()->safeEmail(),
            'telephone' => fake()->unique()->phoneNumber()
        ];
    }
}

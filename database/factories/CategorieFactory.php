<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Rayonnage;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Categorie>
 */
class CategorieFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $rayonnageId = Rayonnage::query()->inRandomOrder()->value('id')
            ?? Rayonnage::factory()->create()->id;

        return [
            'nom' => fake()->unique()->words(2, true),
            'description' => fake()->sentence(3),
            'date_creation' => fake()->dateTimeBetween('-5 years', 'now'),
            'rayonnage_id' => $rayonnageId,
        ];
    }
}

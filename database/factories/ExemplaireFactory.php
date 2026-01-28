<?php

namespace Database\Factories;

use App\Models\Document;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Exemplaire>
 */
class ExemplaireFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $documentId = Document::query()->inRandomOrder()->value('id')
            ?? Document::factory()->create()->id;

        return [
            'document_id' => $documentId,
            'code_exemplaire' => Str::upper('EXP-' . fake()->unique()->bothify('??###')),
            'disponible' => true,
            'is_archived' => fake()->boolean(5),
            'date_creation' => fake()->dateTimeBetween('-5 years', 'now'),
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Emprunt;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Notification>
 */
class NotificationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $empruntId = Emprunt::query()->inRandomOrder()->value('id')
            ?? Emprunt::factory()->create()->id;

        return [
            'emprunt_id' => $empruntId,
            'message' => fake()->sentence(),
            'est_lu' => fake()->boolean(30),
        ];
    }
}

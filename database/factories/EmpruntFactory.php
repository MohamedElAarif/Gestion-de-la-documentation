<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Document;
use App\Models\Membre;
use Carbon\Carbon;

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
        $dateEmprunt = Carbon::instance(fake()->dateTimeBetween('-2 years', 'now'));
        $loanDuration = fake()->numberBetween(7, 30);
        $dateRetourPrevue = $dateEmprunt->copy()->addDays($loanDuration);
        $isReturned = fake()->boolean(65);
        $dateRetour = $isReturned
            ? fake()->dateTimeBetween($dateEmprunt, $dateRetourPrevue->copy()->addDays(15))
            : null;

        $isLate = $dateRetour
            ? $dateRetour > $dateRetourPrevue
            : now()->greaterThan($dateRetourPrevue);

        $documentId = Document::query()->inRandomOrder()->value('id')
            ?? Document::factory()->create()->id;
        $membreId = Membre::query()->inRandomOrder()->value('id')
            ?? Membre::factory()->create()->id;

        return [
            'date_emprunt' => $dateEmprunt->toDateString(),
            'date_retour_prevue' => $dateRetourPrevue->toDateString(),
            'date_retour' => $dateRetour?->format('Y-m-d'),
            'en_retard' => $isLate,
            'is_archived' => fake()->boolean(5),
            'notifie_retard' => false,
            'document_id' => $documentId,
            'emprunteur_id' => $membreId,
        ];
    }
}

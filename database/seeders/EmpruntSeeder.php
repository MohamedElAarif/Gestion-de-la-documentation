<?php

namespace Database\Seeders;

use App\Models\Document;
use App\Models\Emprunt;
use App\Models\Exemplaire;
use App\Models\Membre;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmpruntSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $documents = Document::with('exemplaires')->get()->filter(fn ($doc) => $doc->exemplaires->isNotEmpty());
        $membres = Membre::all();

        if ($documents->isEmpty() || $membres->isEmpty()) {
            return;
        }

        Emprunt::factory()
            ->count(15)
            ->make()
            ->each(function (Emprunt $emprunt) use ($documents, $membres) {
                $document = $documents->random();
                $membre = $membres->random();

                $emprunt->document_id = $document->id;
                $emprunt->emprunteur_id = $membre->id;
                $emprunt->save();

                $exemplaires = $document->exemplaires()
                    ->inRandomOrder()
                    ->take(fake()->numberBetween(1, min(3, $document->exemplaires->count())))
                    ->get();

                if ($exemplaires->isEmpty()) {
                    $exemplaires = collect([
                        Exemplaire::factory()->create(['document_id' => $document->id]),
                    ]);
                }

                $emprunt->exemplaires()->attach($exemplaires->pluck('id')->all());

                if (is_null($emprunt->date_retour)) {
                    Exemplaire::whereIn('id', $exemplaires->pluck('id'))->update(['disponible' => false]);
                }

                $document->update([
                    'disponible' => $document->exemplaires()->where('disponible', true)->exists(),
                ]);

                if ($emprunt->en_retard && !$emprunt->notifie_retard) {
                    $emprunt->notifications()->create([
                        'message' => "Le prêt du document {$document->titre} est en retard pour {$membre->nom} {$membre->prenom}.",
                        'est_lu' => false,
                    ]);

                    $emprunt->update(['notifie_retard' => true]);
                }
            });
    }
}

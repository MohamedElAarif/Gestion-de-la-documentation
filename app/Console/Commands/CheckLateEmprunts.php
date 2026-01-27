<?php

namespace App\Console\Commands;

use App\Models\Emprunt;
use App\Models\Notification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class CheckLateEmprunts extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'emprunts:check-retard';

    /**
     * The console command description.
     */
    protected $description = 'Marque les emprunts en retard et génère les notifications associées.';

    public function handle(): int
    {
        $now = now();

        $candidates = Emprunt::query()
            ->with(['document', 'emprunteur'])
            ->whereNull('date_retour')
            ->whereNotNull('date_retour_prevue')
            ->where('date_retour_prevue', '<', $now)
            ->get();

        $updated = 0;
        foreach ($candidates as $emprunt) {
            try {
                $notificationCreated = false;

                if (! $emprunt->en_retard) {
                    $emprunt->en_retard = true;
                }

                if (! $emprunt->notifie_retard) {
                    Notification::create([
                        'emprunt_id' => $emprunt->id,
                        'message' => sprintf(
                            "L'emprunt #%d du document %s pour %s %s est en retard depuis le %s.",
                            $emprunt->id,
                            $emprunt->document?->titre ?? 'document',
                            $emprunt->emprunteur?->prenom ?? '',
                            $emprunt->emprunteur?->nom ?? '',
                            optional($emprunt->date_retour_prevue)->format('d/m/Y') ?? 'date inconnue'
                        ),
                    ]);

                    $emprunt->notifie_retard = true;
                    $notificationCreated = true;
                }

                if ($emprunt->isDirty(['en_retard', 'notifie_retard'])) {
                    $emprunt->save();
                }

                if ($emprunt->wasChanged()) {
                    $updated++;
                }

                if ($notificationCreated) {
                    $this->info(sprintf('Notification créée pour l\'emprunt #%d', $emprunt->id));
                }
            } catch (Throwable $exception) {
                Log::error('Erreur lors de la vérification des emprunts en retard', [
                    'emprunt_id' => $emprunt->id,
                    'exception' => $exception->getMessage(),
                ]);
            }
        }

        $this->info(sprintf('Vérification terminée - %d emprunts traités', $updated));

        return Command::SUCCESS;
    }
}

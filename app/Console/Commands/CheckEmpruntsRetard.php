<?php

namespace App\Console\Commands;

use App\Models\Admin;
use App\Models\Emprunt;
use Illuminate\Console\Command;
use App\Notifications\EmpruntRetardNotification;

class CheckEmpruntsRetard extends Command
{
    /**
     * The name and signature of the console command.
    *
    * @var string
    */
    protected $signature = 'app:check-emprunts-retard';
    
    /**
     * The console command description.
    *
    * @var string
    */
    protected $description = 'Command description';
    
    /**
     * Execute the console command.
    */
    public function handle()
    {
        $$admins = Admin::all();

        $emprunts = Emprunt::whereNull('returned_at')
            ->whereDate('date_retour_prevue', '<', now())
            ->get();

        foreach ($emprunts as $emprunt) {
            foreach ($admins as $admin) {

                $exists = $admin->notifications()
                    ->where('data->emprunt_id', $emprunt->id)
                    ->whereNull('read_at')
                    ->exists();

                if (! $exists) {
                    $admin->notify(new EmpruntRetardNotification($emprunt));
                }
            }
        }
    }
}

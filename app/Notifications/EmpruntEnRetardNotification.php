<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmpruntEnRetardNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $emprunt)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable)
    {
        return [
            'type' => 'emprunt_retard',
            'emprunt_id' => $this->emprunt->id,
            'date_retour_prevue' => $this->emprunt->date_retour_prevue,
            'message' => "Emprunt #{$this->emprunt->id} est en retard",
        ];
    }
}
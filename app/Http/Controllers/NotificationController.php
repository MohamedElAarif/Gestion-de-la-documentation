<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    protected function transform(Notification $notification): array
    {
        $emprunt = $notification->emprunt;
        $documentTitle = $emprunt?->document?->titre
            ?? $emprunt?->document?->description
            ?? null;
        $emprunteur = $emprunt?->emprunteur;
        $emprunteurName = $emprunteur
            ? trim(implode(' ', array_filter([$emprunteur->prenom, $emprunteur->nom])))
            : null;

        return [
            'id' => $notification->id,
            'emprunt_id' => $notification->emprunt_id,
            'message' => $notification->message,
            'est_lu' => (bool) $notification->est_lu,
            'created_at' => optional($notification->created_at)->toIso8601String(),
            'emprunt' => $emprunt ? [
                'id' => $emprunt->id,
                'document' => $documentTitle,
                'emprunteur' => $emprunteurName,
                'date_retour_prevue' => optional($emprunt->date_retour_prevue)->format('Y-m-d'),
                'batch_code' => $emprunt->batch_code,
            ] : null,
        ];
    }

    public function index(Request $request): Response
    {
        $notifications = Notification::with(['emprunt.document', 'emprunt.emprunteur'])
            ->latest()
            ->get()
            ->map(fn (Notification $notification) => $this->transform($notification))
            ->values();

        return Inertia::render('NotificationList', [
            'notifications' => $notifications,
        ]);
    }

    public function data(): JsonResponse
    {
        $notifications = Notification::with(['emprunt.document', 'emprunt.emprunteur'])
            ->latest()
            ->get()
            ->map(fn (Notification $notification) => $this->transform($notification))
            ->values();

        return response()->json($notifications);
    }

    public function markRead(Notification $notification): JsonResponse
    {
        if (! $notification->est_lu) {
            $notification->forceFill(['est_lu' => true])->save();
        }

        return response()->json($this->transform($notification));
    }

    public function markAllRead(): JsonResponse
    {
        $updated = Notification::where('est_lu', false)->update(['est_lu' => true]);

        return response()->json([
            'updated' => $updated,
        ]);
    }

    public function destroy(Notification $notification): JsonResponse
    {
        $notification->delete();

        return response()->json([
            'deleted' => true,
        ]);
    }
}

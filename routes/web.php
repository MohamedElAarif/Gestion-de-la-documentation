<?php

use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EmpruntController;
use App\Http\Controllers\MembreController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/Documents', [DocumentController::class, 'index'])->name('documents');
Route::post('/Documents', [DocumentController::class, 'store'])->name('documents.store');
Route::put('/Documents/{id}', [DocumentController::class, 'update'])->name('documents.update');
Route::delete('/Documents/{id}', [DocumentController::class, 'destroy'])->name('documents.destroy');
Route::post('/Documents/{document}/exemplaires', [DocumentController::class, 'addExemplaire'])->name('documents.exemplaires.store');
Route::delete('/Documents/{document}/exemplaires/{exemplaire}', [DocumentController::class, 'destroyExemplaire'])->name('documents.exemplaires.destroy');
Route::patch('/Documents/{document}/exemplaires/{exemplaire}/archive', [DocumentController::class, 'toggleExemplaireArchive'])->name('documents.exemplaires.archive');
Route::get('/Documents/{document}/exemplaires/available', [DocumentController::class, 'availableExemplaires'])->name('documents.exemplaires.available');

// Route::get('/Documents', function () {
//     return Inertia::render('DocumentsList');
// })->name('home');

Route::get('/Emprunts', [EmpruntController::class, 'index'])->name('emprunts');
// API/json endpoint for frontend to fetch data
Route::get('/Emprunts/data', [EmpruntController::class, 'indexData'])->name('emprunts.data');
Route::get('/Emprunts/options', [EmpruntController::class, 'options'])->name('emprunts.options');

Route::post('/Emprunts', [EmpruntController::class, 'store'])->name('emprunts.store');
Route::put('/Emprunts/{id}', [EmpruntController::class, 'update'])->name('emprunts.update');
Route::delete('/Emprunts/{id}', [EmpruntController::class, 'destroy'])->name('emprunts.destroy');
Route::put('/Emprunts/{id}/return', [EmpruntController::class, 'markReturned'])->name('emprunts.return');

Route::get('/Membres', [MembreController::class, 'index'])->name('membres');
Route::get('/Membres/data', [MembreController::class, 'data'])->name('membres.data');
Route::post('/Membres', [MembreController::class, 'store'])->name('membres.store');
Route::put('/Membres/{membre}', [MembreController::class, 'update'])->name('membres.update');
Route::delete('/Membres/{membre}', [MembreController::class, 'destroy'])->name('membres.destroy');
Route::patch('/Membres/{membre}/toggle-active', [MembreController::class, 'toggleActive'])->name('membres.toggle');

Route::get('/Notifications', [NotificationController::class, 'index'])->name('notifications');
Route::get('/Notifications/data', [NotificationController::class, 'data'])->name('notifications.data');
Route::patch('/Notifications/mark-all-read', [NotificationController::class, 'markAllRead'])->name('notifications.markAllRead');
Route::patch('/Notifications/{notification}/mark-read', [NotificationController::class, 'markRead'])->name('notifications.markRead');
Route::delete('/Notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');




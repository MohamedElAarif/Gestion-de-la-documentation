<?php

use App\Http\Controllers\CategorieController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EmpruntController;
use App\Http\Controllers\MembreController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\RayonnageController;
use App\Http\Controllers\Type_DocumentController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (\Illuminate\Support\Facades\Auth::check()) {
        return redirect('/Documents');
    }

    return redirect('/login');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AdminAuthController::class, 'create'])->name('login');
    Route::post('/login', [AdminAuthController::class, 'store'])->name('login.store');
});

Route::post('/logout', [AdminAuthController::class, 'destroy'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function () {
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
    
    Route::get('/Settings', [ProfileController::class, 'edit'])->name('settings.edit');
    Route::put('/Settings/password', [ProfileController::class, 'updatePassword'])->name('password.update');
});

Route::get('/Rayonnages', [RayonnageController::class, 'index'])->name('rayonnages');
Route::get('/Rayonnages/data', [RayonnageController::class, 'indexData'])->name('rayonnages.indexData');
Route::post('/Rayonnages', [RayonnageController::class, 'store'])->name('rayonnages.store');
Route::put('/Rayonnages/{id}', [RayonnageController::class, 'update'])->name('rayonnages.update');
Route::delete('/Rayonnages/{id}', [RayonnageController::class, 'destroy'])->name('rayonnages.destroy');

Route::get('/Categories', [CategorieController::class, 'index'])->name('categories');
Route::get('/Categories/data', [CategorieController::class, 'indexData'])->name('categories.indexData');
Route::post('/Categories', [CategorieController::class, 'store'])->name('categories.store');
Route::put('/Categories/{id}', [CategorieController::class, 'update'])->name('categories.update');
Route::delete('/Categories/{id}', [CategorieController::class, 'destroy'])->name('categories.destroy');


Route::get('/Type Documents', [Type_DocumentController::class, 'index'])->name('type_documents');
Route::get('/Type Documents/data', [Type_DocumentController::class, 'indexData'])->name('type_documents.indexData');
Route::post('/Type Documents', [Type_DocumentController::class, 'store'])->name('type_documents.store');
Route::put('/Type Documents/{id}', [Type_DocumentController::class, 'update'])->name('type_documents.update');
Route::delete('/Type Documents/{id}', [Type_DocumentController::class, 'destroy'])->name('type_documents.destroy');




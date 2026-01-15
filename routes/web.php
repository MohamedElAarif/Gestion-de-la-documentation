<?php

use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EmpruntController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/Documents',[DocumentController::class, 'index']);

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




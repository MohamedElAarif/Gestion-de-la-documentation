<?php

use App\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/Documents',[DocumentController::class, 'index']);

// Route::get('/Documents', function () {
//     return Inertia::render('DocumentsList');
// })->name('home');

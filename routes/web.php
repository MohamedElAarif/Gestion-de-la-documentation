<?php

use App\Http\Controllers\CategorieController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EmpruntController;
use App\Http\Controllers\RayonnageController;
use App\Http\Controllers\Type_DocumentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/Documents', [DocumentController::class, 'index'])->name('documents');
Route::post('/Documents', [DocumentController::class, 'store'])->name('documents.store');
Route::put('/Documents/{id}', [DocumentController::class, 'update'])->name('documents.update');
Route::delete('/Documents/{id}', [DocumentController::class, 'destroy'])->name('documents.destroy');

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




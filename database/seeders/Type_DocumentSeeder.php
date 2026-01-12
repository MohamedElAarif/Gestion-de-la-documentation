<?php

namespace Database\Seeders;

use App\Models\Type_Document;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class Type_DocumentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Type_Document::factory()->count(10)->create();
    }
}

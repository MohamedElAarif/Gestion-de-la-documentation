<?php

namespace Database\Seeders;
use App\Models\Rayonnage;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RayonnageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Rayonnage::factory()->count(10)->create();
    }
}

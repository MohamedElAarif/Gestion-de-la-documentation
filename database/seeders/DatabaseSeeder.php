<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        if (!User::where('login', 'admin')->exists()) {
            $this->call([
                AdminUserSeeder::class,
            ]);
        }
        $this->call([
            RayonnageSeeder::class,
            Type_DocumentSeeder::class,
            CategorieSeeder::class,
            MembreSeeder::class,
            DocumentSeeder::class,
            EmpruntSeeder::class,
        ]);
    }
}

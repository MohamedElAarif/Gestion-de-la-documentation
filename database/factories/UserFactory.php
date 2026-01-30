<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition()
    {
        return [
            'login' => $this->faker->unique()->userName(),
            'password' => bcrypt('password'), // Default password
            'remember_token' => Str::random(10),
        ];
    }
}
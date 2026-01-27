<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membres', function (Blueprint $table) {
            if (!Schema::hasColumn('membres', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('telephone');
            }
        });
    }

    public function down(): void
    {
        Schema::table('membres', function (Blueprint $table) {
            if (Schema::hasColumn('membres', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};

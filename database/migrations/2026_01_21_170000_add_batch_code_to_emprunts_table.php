<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emprunts', function (Blueprint $table) {
            if (!Schema::hasColumn('emprunts', 'batch_code')) {
                $table->string('batch_code', 64)->nullable()->index()->after('emprunteur_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('emprunts', function (Blueprint $table) {
            if (Schema::hasColumn('emprunts', 'batch_code')) {
                $table->dropIndex('emprunts_batch_code_index');
                $table->dropColumn('batch_code');
            }
        });
    }
};

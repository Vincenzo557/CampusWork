<?php
// ============================================================
// Run these in order:
// php artisan migrate
// ============================================================

// -------------------------------------------------------
// database/migrations/2024_01_01_000001_create_student_profiles_table.php
// -------------------------------------------------------
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('student_id')->unique();
            $table->string('faculty');
            $table->string('course');
            $table->integer('year_of_study');
            $table->integer('max_work_hours_per_week')->default(20);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('student_profiles'); }
};

// -------------------------------------------------------
// database/migrations/2024_01_01_000002_create_business_profiles_table.php
// -------------------------------------------------------
return new class extends Migration {
    public function up(): void
    {
        Schema::create('business_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('business_name');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->string('contact_number')->nullable();
            $table->enum('status', ['pending', 'approved', 'suspended'])->default('pending');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('business_profiles'); }
};

// -------------------------------------------------------
// database/migrations/2024_01_01_000003_create_class_schedules_table.php
// -------------------------------------------------------
return new class extends Migration {
    public function up(): void
    {
        Schema::create('class_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('subject_name');
            $table->string('subject_code')->nullable();
            $table->enum('day_of_week', ['monday','tuesday','wednesday','thursday','friday','saturday']);
            $table->time('start_time');
            $table->time('end_time');
            $table->string('semester');
            $table->string('academic_year');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('class_schedules'); }
};

// -------------------------------------------------------
// database/migrations/2024_01_01_000004_create_jobs_table.php
// -------------------------------------------------------
return new class extends Migration {
    public function up(): void
    {
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('location')->nullable();
            $table->decimal('hourly_rate', 8, 2);
            $table->integer('hours_per_week');
            $table->integer('slots_available');
            $table->enum('status', ['open', 'closed', 'draft'])->default('open');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('jobs'); }
};

// -------------------------------------------------------
// database/migrations/2024_01_01_000005_create_job_schedules_table.php
// -------------------------------------------------------
return new class extends Migration {
    public function up(): void
    {
        Schema::create('job_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->enum('day_of_week', ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('job_schedules'); }
};

// -------------------------------------------------------
// database/migrations/2024_01_01_000006_create_applications_table.php
// -------------------------------------------------------
return new class extends Migration {
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted', 'rejected', 'withdrawn'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->boolean('has_conflict')->default(false);
            $table->timestamps();

            $table->unique(['student_id', 'job_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('applications'); }
};

// -------------------------------------------------------
// database/migrations/2024_01_01_000007_create_work_schedules_table.php
// -------------------------------------------------------
return new class extends Migration {
    public function up(): void
    {
        Schema::create('work_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->enum('day_of_week', ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('work_schedules'); }
};

// -------------------------------------------------------
// database/migrations/2024_01_01_000008_create_conflict_reports_table.php
// -------------------------------------------------------
return new class extends Migration {
    public function up(): void
    {
        Schema::create('conflict_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->string('conflict_type'); // 'schedule_clash' | 'over_hours_limit'
            $table->text('description');
            $table->enum('status', ['unresolved', 'resolved'])->default('unresolved');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('conflict_reports'); }
};

// -------------------------------------------------------
// database/migrations/2024_01_01_000009_create_notifications_table.php
// -------------------------------------------------------
return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->string('type')->nullable(); // 'conflict' | 'application' | 'system'
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('notifications'); }
};

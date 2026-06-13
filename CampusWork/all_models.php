<?php
// ============================================================
// Save each class in its own file under app/Models/
// ============================================================

// -------------------------------------------------------
// app/Models/User.php
// -------------------------------------------------------
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, HasRoles;

    protected $fillable = ['name', 'email', 'password'];
    protected $hidden   = ['password', 'remember_token'];
    protected $casts    = ['email_verified_at' => 'datetime', 'password' => 'hashed'];

    public function studentProfile()  { return $this->hasOne(StudentProfile::class); }
    public function businessProfile() { return $this->hasOne(BusinessProfile::class); }
    public function classSchedules()  { return $this->hasMany(ClassSchedule::class); }
    public function workSchedules()   { return $this->hasMany(WorkSchedule::class, 'student_id'); }
    public function applications()    { return $this->hasMany(Application::class, 'student_id'); }
    public function jobs()            { return $this->hasMany(Job::class, 'business_id'); }
    public function notifications()   { return $this->hasMany(Notification::class); }
}

// -------------------------------------------------------
// app/Models/StudentProfile.php
// -------------------------------------------------------
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    protected $fillable = [
        'user_id', 'student_id', 'faculty',
        'course', 'year_of_study', 'max_work_hours_per_week',
    ];

    public function user() { return $this->belongsTo(User::class); }
}

// -------------------------------------------------------
// app/Models/BusinessProfile.php
// -------------------------------------------------------
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class BusinessProfile extends Model
{
    protected $fillable = [
        'user_id', 'business_name', 'description',
        'location', 'contact_number', 'status',
    ];

    public function user() { return $this->belongsTo(User::class); }
}

// -------------------------------------------------------
// app/Models/ClassSchedule.php
// -------------------------------------------------------
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ClassSchedule extends Model
{
    protected $fillable = [
        'user_id', 'subject_name', 'subject_code',
        'day_of_week', 'start_time', 'end_time',
        'semester', 'academic_year',
    ];

    public function student() { return $this->belongsTo(User::class, 'user_id'); }
}

// -------------------------------------------------------
// app/Models/Job.php
// -------------------------------------------------------
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    protected $fillable = [
        'business_id', 'title', 'description', 'location',
        'hourly_rate', 'hours_per_week', 'slots_available', 'status',
    ];

    public function business()     { return $this->belongsTo(User::class, 'business_id'); }
    public function shifts()       { return $this->hasMany(JobSchedule::class); }
    public function applications() { return $this->hasMany(Application::class); }
    public function workSchedules(){ return $this->hasMany(WorkSchedule::class); }
}

// -------------------------------------------------------
// app/Models/JobSchedule.php
// -------------------------------------------------------
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class JobSchedule extends Model
{
    protected $fillable = ['job_id', 'day_of_week', 'start_time', 'end_time'];

    public function job() { return $this->belongsTo(Job::class); }
}

// -------------------------------------------------------
// app/Models/Application.php
// -------------------------------------------------------
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'student_id', 'job_id', 'status',
        'rejection_reason', 'has_conflict',
    ];

    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function job()     { return $this->belongsTo(Job::class); }
}

// -------------------------------------------------------
// app/Models/WorkSchedule.php
// -------------------------------------------------------
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class WorkSchedule extends Model
{
    protected $fillable = [
        'student_id', 'job_id', 'day_of_week', 'start_time', 'end_time',
    ];

    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function job()     { return $this->belongsTo(Job::class); }
}

// -------------------------------------------------------
// app/Models/ConflictReport.php
// -------------------------------------------------------
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ConflictReport extends Model
{
    protected $fillable = [
        'student_id', 'job_id', 'conflict_type',
        'description', 'status', 'resolved_at',
    ];

    protected $casts = ['resolved_at' => 'datetime'];

    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function job()     { return $this->belongsTo(Job::class); }
}

// -------------------------------------------------------
// app/Models/Notification.php
// -------------------------------------------------------
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['user_id', 'title', 'message', 'type', 'is_read'];

    public function user() { return $this->belongsTo(User::class); }
}
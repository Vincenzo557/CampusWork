<?php
// ============================================================
// 1. app/Http/Kernel.php  — register Sanctum + role middleware
// ============================================================
// Inside the $middlewareAliases (or $routeMiddleware) array, add:

'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,

// And in the 'api' middleware group, ensure this is present:
\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,

// ============================================================
// 2. config/sanctum.php — ensure stateful domains are set
// ============================================================
// In config/sanctum.php:
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,127.0.0.1')),

// ============================================================
// 3. .env additions
// ============================================================
/*
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=campuswork
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost
*/

// ============================================================
// 4. database/seeders/DatabaseSeeder.php
// ============================================================
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\BusinessProfile;
use App\Models\Job;
use App\Models\JobSchedule;
use App\Models\ClassSchedule;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        foreach (['student', 'business', 'admin'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // -------------------------------------------------------
        // Admin user
        // -------------------------------------------------------
        $admin = User::create([
            'name'     => 'Registry Admin',
            'email'    => 'admin@ug.edu.gh',
            'password' => Hash::make('password'),
        ]);
        $admin->assignRole('admin');

        // -------------------------------------------------------
        // Business users
        // -------------------------------------------------------
        $bizData = [
            ['name' => 'Café Legon',    'email' => 'cafe@legon.gh',    'biz' => 'Café Legon',    'desc' => 'Popular campus café'],
            ['name' => 'Campus Mart',   'email' => 'mart@campus.gh',   'biz' => 'Campus Mart',   'desc' => 'On-campus convenience store'],
            ['name' => 'UG Library',    'email' => 'lib@ug.edu.gh',    'biz' => 'UG Main Library','desc' => 'University library services'],
            ['name' => 'Campus Tech Hub','email' => 'tech@campus.gh', 'biz' => 'Campus Tech Hub','desc' => 'IT support and services'],
        ];

        $businesses = [];
        foreach ($bizData as $b) {
            $user = User::create([
                'name'     => $b['name'],
                'email'    => $b['email'],
                'password' => Hash::make('password'),
            ]);
            $user->assignRole('business');
            BusinessProfile::create([
                'user_id'       => $user->id,
                'business_name' => $b['biz'],
                'description'   => $b['desc'],
                'location'      => 'University of Ghana, Legon',
                'status'        => 'approved',
            ]);
            $businesses[] = $user;
        }

        // -------------------------------------------------------
        // Student users
        // -------------------------------------------------------
        $studentData = [
            ['name' => 'Kwame Asante', 'email' => 'kwame@st.ug.edu.gh', 'sid' => 'UG/2023/001', 'faculty' => 'Engineering', 'course' => 'Computer Engineering', 'year' => 2],
            ['name' => 'Ama Boateng',  'email' => 'ama@st.ug.edu.gh',   'sid' => 'UG/2022/045', 'faculty' => 'Business',     'course' => 'Business Administration', 'year' => 3],
            ['name' => 'Kofi Owusu',   'email' => 'kofi@st.ug.edu.gh',  'sid' => 'UG/2025/112', 'faculty' => 'Sciences',     'course' => 'Biology', 'year' => 1],
            ['name' => 'Efua Mensah',  'email' => 'efua@st.ug.edu.gh',  'sid' => 'UG/2021/089', 'faculty' => 'Humanities',   'course' => 'English', 'year' => 4],
        ];

        $students = [];
        foreach ($studentData as $s) {
            $user = User::create([
                'name'     => $s['name'],
                'email'    => $s['email'],
                'password' => Hash::make('password'),
            ]);
            $user->assignRole('student');
            StudentProfile::create([
                'user_id'       => $user->id,
                'student_id'    => $s['sid'],
                'faculty'       => $s['faculty'],
                'course'        => $s['course'],
                'year_of_study' => $s['year'],
                'max_work_hours_per_week' => 20,
            ]);

            // Add sample class schedules
            $classes = [
                ['subject_name' => 'Mathematics 201', 'subject_code' => 'MATH201', 'day_of_week' => 'tuesday',   'start_time' => '09:00', 'end_time' => '11:00'],
                ['subject_name' => 'Engineering 301', 'subject_code' => 'ENG301',  'day_of_week' => 'monday',    'start_time' => '11:00', 'end_time' => '13:00'],
                ['subject_name' => 'CS 204',          'subject_code' => 'CS204',   'day_of_week' => 'tuesday',   'start_time' => '13:00', 'end_time' => '15:00'],
                ['subject_name' => 'Engineering 301', 'subject_code' => 'ENG301',  'day_of_week' => 'wednesday', 'start_time' => '11:00', 'end_time' => '13:00'],
                ['subject_name' => 'Mathematics 201', 'subject_code' => 'MATH201', 'day_of_week' => 'thursday',  'start_time' => '09:00', 'end_time' => '11:00'],
            ];

            foreach ($classes as $class) {
                ClassSchedule::create([
                    'user_id'       => $user->id,
                    'semester'      => 'Semester 2',
                    'academic_year' => '2024/2025',
                    ...$class,
                ]);
            }

            $students[] = $user;
        }

        // -------------------------------------------------------
        // Sample jobs
        // -------------------------------------------------------
        $jobsData = [
            [
                'business' => $businesses[0], // Café Legon
                'title'    => 'Barista',
                'desc'     => 'Prepare and serve coffee and beverages to customers.',
                'rate'     => 15, 'hours' => 12, 'slots' => 2,
                'shifts'   => [
                    ['day' => 'monday',    'start' => '09:00', 'end' => '13:00'],
                    ['day' => 'wednesday', 'start' => '09:00', 'end' => '13:00'],
                    ['day' => 'friday',    'start' => '09:00', 'end' => '13:00'],
                ],
            ],
            [
                'business' => $businesses[1], // Campus Mart
                'title'    => 'Cashier',
                'desc'     => 'Handle customer transactions and maintain the checkout area.',
                'rate'     => 11, 'hours' => 15, 'slots' => 2,
                'shifts'   => [
                    ['day' => 'tuesday',  'start' => '17:00', 'end' => '21:00'],
                    ['day' => 'thursday', 'start' => '17:00', 'end' => '21:00'],
                    ['day' => 'saturday', 'start' => '10:00', 'end' => '15:00'],
                ],
            ],
            [
                'business' => $businesses[2], // UG Library
                'title'    => 'Library Assistant',
                'desc'     => 'Help students find resources and maintain the library catalog.',
                'rate'     => 12, 'hours' => 8, 'slots' => 1,
                'shifts'   => [
                    ['day' => 'tuesday',  'start' => '14:00', 'end' => '18:00'],
                    ['day' => 'thursday', 'start' => '14:00', 'end' => '18:00'],
                ],
            ],
            [
                'business' => $businesses[3], // Campus Tech Hub
                'title'    => 'IT Support Desk',
                'desc'     => 'Provide first-line IT support to students and staff.',
                'rate'     => 18, 'hours' => 10, 'slots' => 3,
                'shifts'   => [
                    ['day' => 'saturday', 'start' => '10:00', 'end' => '16:00'],
                    ['day' => 'sunday',   'start' => '10:00', 'end' => '14:00'],
                ],
            ],
        ];

        foreach ($jobsData as $j) {
            $job = Job::create([
                'business_id'     => $j['business']->id,
                'title'           => $j['title'],
                'description'     => $j['desc'],
                'hourly_rate'     => $j['rate'],
                'hours_per_week'  => $j['hours'],
                'slots_available' => $j['slots'],
                'status'          => 'open',
                'location'        => 'University of Ghana, Legon',
            ]);

            foreach ($j['shifts'] as $shift) {
                JobSchedule::create([
                    'job_id'      => $job->id,
                    'day_of_week' => $shift['day'],
                    'start_time'  => $shift['start'],
                    'end_time'    => $shift['end'],
                ]);
            }
        }
    }
}

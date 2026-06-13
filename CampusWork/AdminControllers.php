<?php
// ============================================================
// Save each class in its own file under
// app/Http/Controllers/Admin/
// ============================================================

// -------------------------------------------------------
// app/Http/Controllers/Admin/StudentController.php
// -------------------------------------------------------
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WorkSchedule;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    // GET /api/admin/students
    public function index(Request $request)
    {
        $students = User::role('student')
            ->with('studentProfile')
            ->withCount([
                'applications as active_jobs' => fn($q) => $q->where('status', 'accepted'),
            ])
            ->get()
            ->map(function ($student) {
                // Calculate total weekly hours across all accepted jobs
                $student->total_work_hours = WorkSchedule::where('student_id', $student->id)
                    ->join('jobs', 'work_schedules.job_id', '=', 'jobs.id')
                    ->sum('jobs.hours_per_week');

                // Conflict status
                $student->conflict_status = $this->getConflictStatus($student);

                return $student;
            });

        return response()->json(['students' => $students]);
    }

    // GET /api/admin/students/{id}
    public function show($id)
    {
        $student = User::role('student')
            ->with([
                'studentProfile',
                'classSchedules',
                'workSchedules.job.business.businessProfile',
                'applications.job.business.businessProfile',
            ])
            ->findOrFail($id);

        $student->total_work_hours = WorkSchedule::where('student_id', $id)
            ->join('jobs', 'work_schedules.job_id', '=', 'jobs.id')
            ->sum('jobs.hours_per_week');

        return response()->json(['student' => $student]);
    }

    // PUT /api/admin/students/{id}/max-hours
    public function updateMaxHours(Request $request, $id)
    {
        $request->validate([
            'max_work_hours_per_week' => 'required|integer|min:1|max:40',
        ]);

        $student = User::role('student')->findOrFail($id);
        $student->studentProfile->update([
            'max_work_hours_per_week' => $request->max_work_hours_per_week,
        ]);

        return response()->json([
            'message' => 'Maximum work hours updated.',
            'profile' => $student->studentProfile,
        ]);
    }

    // -------------------------------------------------------
    private function getConflictStatus(User $student): string
    {
        $maxHours     = $student->studentProfile->max_work_hours_per_week ?? 20;
        $totalHours   = $student->total_work_hours ?? 0;

        if ($totalHours > $maxHours) return 'over_limit';

        $hasClash = \App\Models\ConflictReport::where('student_id', $student->id)
            ->where('status', 'unresolved')
            ->where('conflict_type', 'schedule_clash')
            ->exists();

        return $hasClash ? 'conflict' : 'clear';
    }
}

// -------------------------------------------------------
// app/Http/Controllers/Admin/BusinessController.php
// -------------------------------------------------------
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    // GET /api/admin/businesses
    public function index()
    {
        $businesses = User::role('business')
            ->with('businessProfile')
            ->withCount([
                'jobs as active_jobs_count' => fn($q) => $q->where('status', 'open'),
                'jobs as total_jobs_count',
            ])
            ->get()
            ->map(function ($biz) {
                $biz->students_hired = \App\Models\Application::whereHas('job', fn($q) =>
                    $q->where('business_id', $biz->id)
                )->where('status', 'accepted')->count();
                return $biz;
            });

        return response()->json(['businesses' => $businesses]);
    }

    // PUT /api/admin/businesses/{id}/approve
    public function approve($id)
    {
        $business = User::role('business')->findOrFail($id);
        $business->businessProfile->update(['status' => 'approved']);

        Notification::create([
            'user_id' => $business->id,
            'title'   => 'Business account approved',
            'message' => 'Your business has been verified. You can now post job listings.',
            'type'    => 'system',
        ]);

        return response()->json(['message' => 'Business approved.']);
    }

    // PUT /api/admin/businesses/{id}/suspend
    public function suspend(Request $request, $id)
    {
        $request->validate(['reason' => 'nullable|string']);

        $business = User::role('business')->findOrFail($id);
        $business->businessProfile->update(['status' => 'suspended']);

        // Close all open jobs from this business
        $business->jobs()->where('status', 'open')->update(['status' => 'closed']);

        Notification::create([
            'user_id' => $business->id,
            'title'   => 'Business account suspended',
            'message' => 'Your account has been suspended. Please contact the university registry.',
            'type'    => 'system',
        ]);

        return response()->json(['message' => 'Business suspended and all jobs closed.']);
    }
}

// -------------------------------------------------------
// app/Http/Controllers/Admin/JobController.php
// -------------------------------------------------------
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\Request;

class JobController extends Controller
{
    // GET /api/admin/jobs
    public function index(Request $request)
    {
        $query = Job::with('business.businessProfile', 'shifts')
            ->withCount('applications');

        // Optional filters
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->business_id) {
            $query->where('business_id', $request->business_id);
        }

        $jobs = $query->latest()->get();

        return response()->json(['jobs' => $jobs]);
    }

    // PUT /api/admin/jobs/{id}/close
    public function close($id)
    {
        $job = Job::findOrFail($id);
        $job->update(['status' => 'closed']);

        // Notify the business
        \App\Models\Notification::create([
            'user_id' => $job->business_id,
            'title'   => 'Job listing closed by admin',
            'message' => 'Your listing "' . $job->title . '" has been closed by the university registry.',
            'type'    => 'system',
        ]);

        return response()->json(['message' => 'Job closed.']);
    }
}

// -------------------------------------------------------
// app/Http/Controllers/Admin/ConflictController.php
// -------------------------------------------------------
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConflictReport;
use App\Models\Notification;
use Illuminate\Http\Request;

class ConflictController extends Controller
{
    // GET /api/admin/conflicts
    public function index(Request $request)
    {
        $query = ConflictReport::with(
            'student.studentProfile',
            'job.business.businessProfile'
        );

        // Filter by status if provided
        if ($request->status) {
            $query->where('status', $request->status);
        }

        $conflicts = $query->latest()->get();

        return response()->json(['conflicts' => $conflicts]);
    }

    // PUT /api/admin/conflicts/{id}/resolve
    public function resolve($id)
    {
        $conflict = ConflictReport::findOrFail($id);

        $conflict->update([
            'status'      => 'resolved',
            'resolved_at' => now(),
        ]);

        return response()->json(['message' => 'Conflict marked as resolved.', 'conflict' => $conflict]);
    }

    // POST /api/admin/conflicts/{id}/notify
    public function notify(Request $request, $id)
    {
        $request->validate([
            'notify' => 'required|array',
            'notify.*' => 'in:student,business',
            'message' => 'nullable|string',
        ]);

        $conflict = ConflictReport::with('student', 'job.business')->findOrFail($id);
        $defaultMsg = 'There is a schedule conflict that requires your attention. Please contact the university registry.';
        $message = $request->message ?? $defaultMsg;

        if (in_array('student', $request->notify)) {
            Notification::create([
                'user_id' => $conflict->student_id,
                'title'   => 'Schedule conflict — action required',
                'message' => $message,
                'type'    => 'conflict',
            ]);
        }

        if (in_array('business', $request->notify)) {
            Notification::create([
                'user_id' => $conflict->job->business_id,
                'title'   => 'Student schedule conflict',
                'message' => $message,
                'type'    => 'conflict',
            ]);
        }

        return response()->json(['message' => 'Notifications sent.']);
    }
}

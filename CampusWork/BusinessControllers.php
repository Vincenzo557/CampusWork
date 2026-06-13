<?php
// ============================================================
// Save each class in its own file under
// app/Http/Controllers/Business/
// ============================================================

// -------------------------------------------------------
// app/Http/Controllers/Business/JobController.php
// -------------------------------------------------------
namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\JobSchedule;
use Illuminate\Http\Request;

class JobController extends Controller
{
    // GET /api/business/jobs
    public function index(Request $request)
    {
        $jobs = Job::with('shifts')
            ->withCount('applications')
            ->where('business_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['jobs' => $jobs]);
    }

    // POST /api/business/jobs
    public function store(Request $request)
    {
        $request->validate([
            'title'           => 'required|string|max:255',
            'description'     => 'required|string',
            'location'        => 'nullable|string',
            'hourly_rate'     => 'required|numeric|min:1',
            'hours_per_week'  => 'required|integer|min:1|max:40',
            'slots_available' => 'required|integer|min:1',
            'status'          => 'in:open,draft',
            'shifts'          => 'required|array|min:1',
            'shifts.*.day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'shifts.*.start_time'  => 'required|date_format:H:i',
            'shifts.*.end_time'    => 'required|date_format:H:i|after:shifts.*.start_time',
        ]);

        // Business must be approved before posting
        $business = $request->user()->businessProfile;
        if (!$business || $business->status !== 'approved') {
            return response()->json(['message' => 'Your business account is pending approval.'], 403);
        }

        $job = Job::create([
            'business_id'     => $request->user()->id,
            'title'           => $request->title,
            'description'     => $request->description,
            'location'        => $request->location,
            'hourly_rate'     => $request->hourly_rate,
            'hours_per_week'  => $request->hours_per_week,
            'slots_available' => $request->slots_available,
            'status'          => $request->status ?? 'open',
        ]);

        foreach ($request->shifts as $shift) {
            JobSchedule::create([
                'job_id'      => $job->id,
                'day_of_week' => $shift['day_of_week'],
                'start_time'  => $shift['start_time'],
                'end_time'    => $shift['end_time'],
            ]);
        }

        return response()->json(['job' => $job->load('shifts')], 201);
    }

    // GET /api/business/jobs/{id}
    public function show(Request $request, $id)
    {
        $job = Job::with('shifts')
            ->withCount(['applications', 'applications as pending_count' => fn($q) => $q->where('status', 'pending')])
            ->where('business_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json(['job' => $job]);
    }

    // PUT /api/business/jobs/{id}
    public function update(Request $request, $id)
    {
        $job = Job::where('business_id', $request->user()->id)->findOrFail($id);

        $request->validate([
            'title'           => 'sometimes|string|max:255',
            'description'     => 'sometimes|string',
            'location'        => 'nullable|string',
            'hourly_rate'     => 'sometimes|numeric|min:1',
            'hours_per_week'  => 'sometimes|integer|min:1|max:40',
            'slots_available' => 'sometimes|integer|min:0',
            'status'          => 'sometimes|in:open,closed,draft',
            'shifts'          => 'sometimes|array|min:1',
            'shifts.*.day_of_week' => 'required_with:shifts|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'shifts.*.start_time'  => 'required_with:shifts|date_format:H:i',
            'shifts.*.end_time'    => 'required_with:shifts|date_format:H:i',
        ]);

        $job->update($request->only('title','description','location','hourly_rate','hours_per_week','slots_available','status'));

        // Replace shifts if provided
        if ($request->has('shifts')) {
            $job->shifts()->delete();
            foreach ($request->shifts as $shift) {
                JobSchedule::create([
                    'job_id'      => $job->id,
                    'day_of_week' => $shift['day_of_week'],
                    'start_time'  => $shift['start_time'],
                    'end_time'    => $shift['end_time'],
                ]);
            }
        }

        return response()->json(['job' => $job->load('shifts')]);
    }

    // DELETE /api/business/jobs/{id}
    public function destroy(Request $request, $id)
    {
        $job = Job::where('business_id', $request->user()->id)->findOrFail($id);

        // Prevent deletion if students are actively hired
        $hasActiveHires = $job->applications()->where('status', 'accepted')->exists();
        if ($hasActiveHires) {
            return response()->json([
                'message' => 'Cannot delete a job with active hires. Close it instead.',
            ], 422);
        }

        $job->delete();
        return response()->json(['message' => 'Job listing deleted.']);
    }
}

// -------------------------------------------------------
// app/Http/Controllers/Business/ApplicationController.php
// -------------------------------------------------------
namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Job;
use App\Models\WorkSchedule;
use App\Models\Notification;
use App\Models\ConflictReport;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    // GET /api/business/jobs/{id}/applications
    public function index(Request $request, $jobId)
    {
        // Ensure job belongs to this business
        $job = Job::where('business_id', $request->user()->id)->findOrFail($jobId);

        $applications = Application::with('student.studentProfile')
            ->where('job_id', $job->id)
            ->latest()
            ->get()
            ->map(function ($app) use ($job) {
                // Attach student's full schedule for the business to see availability
                $app->student_class_schedule = $app->student->classSchedules;
                return $app;
            });

        return response()->json(['applications' => $applications]);
    }

    // PUT /api/business/applications/{id}/accept
    public function accept(Request $request, $id)
    {
        $application = $this->getOwnedApplication($request, $id);

        if ($application->status !== 'pending') {
            return response()->json(['message' => 'Only pending applications can be accepted.'], 422);
        }

        $job = $application->job;

        if ($job->slots_available < 1) {
            return response()->json(['message' => 'No slots available for this job.'], 422);
        }

        // Update application status
        $application->update(['status' => 'accepted']);

        // Reduce available slots
        $job->decrement('slots_available');

        // Create work schedule entries from job shifts
        foreach ($job->shifts as $shift) {
            WorkSchedule::create([
                'student_id'  => $application->student_id,
                'job_id'      => $job->id,
                'day_of_week' => $shift->day_of_week,
                'start_time'  => $shift->start_time,
                'end_time'    => $shift->end_time,
            ]);
        }

        // Check if accepting this pushes student over hours limit
        $this->checkHoursLimit($application->student_id, $job);

        // Notify student
        Notification::create([
            'user_id' => $application->student_id,
            'title'   => 'Application accepted!',
            'message' => 'You have been accepted for the ' . $job->title . ' position at ' .
                         optional($request->user()->businessProfile)->business_name . '.',
            'type'    => 'application',
        ]);

        return response()->json(['application' => $application->load('job', 'student.studentProfile')]);
    }

    // PUT /api/business/applications/{id}/reject
    public function reject(Request $request, $id)
    {
        $request->validate(['reason' => 'nullable|string|max:500']);

        $application = $this->getOwnedApplication($request, $id);

        if ($application->status !== 'pending') {
            return response()->json(['message' => 'Only pending applications can be rejected.'], 422);
        }

        $application->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->reason,
        ]);

        // Notify student
        Notification::create([
            'user_id' => $application->student_id,
            'title'   => 'Application update',
            'message' => 'Your application for ' . $application->job->title . ' was not successful.',
            'type'    => 'application',
        ]);

        return response()->json(['application' => $application]);
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------
    private function getOwnedApplication(Request $request, $id): Application
    {
        return Application::whereHas('job', function ($q) use ($request) {
            $q->where('business_id', $request->user()->id);
        })->with('job.shifts', 'student.studentProfile')->findOrFail($id);
    }

    private function checkHoursLimit($studentId, $acceptedJob): void
    {
        $student     = \App\Models\User::with('studentProfile')->find($studentId);
        $maxHours    = $student->studentProfile->max_work_hours_per_week ?? 20;

        $currentHours = \App\Models\WorkSchedule::where('student_id', $studentId)
            ->join('jobs', 'work_schedules.job_id', '=', 'jobs.id')
            ->sum('jobs.hours_per_week');

        if ($currentHours > $maxHours) {
            ConflictReport::create([
                'student_id'    => $studentId,
                'job_id'        => $acceptedJob->id,
                'conflict_type' => 'over_hours_limit',
                'description'   => "Student is now working {$currentHours} hrs/week, exceeding the {$maxHours} hr limit.",
            ]);

            Notification::create([
                'user_id' => $studentId,
                'title'   => 'Work hours limit exceeded',
                'message' => "You are now working {$currentHours} hours per week, which exceeds the university limit of {$maxHours} hours. Please contact the registry.",
                'type'    => 'conflict',
            ]);
        }
    }
}

// -------------------------------------------------------
// app/Http/Controllers/Business/ProfileController.php
// -------------------------------------------------------
namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    // GET /api/business/profile
    public function show(Request $request)
    {
        $profile = $request->user()->businessProfile;
        return response()->json(['profile' => $profile]);
    }

    // PUT /api/business/profile
    public function update(Request $request)
    {
        $request->validate([
            'business_name'  => 'sometimes|string|max:255',
            'description'    => 'nullable|string',
            'location'       => 'nullable|string',
            'contact_number' => 'nullable|string',
        ]);

        $profile = $request->user()->businessProfile;
        $profile->update($request->only('business_name','description','location','contact_number'));

        return response()->json(['profile' => $profile]);
    }
}

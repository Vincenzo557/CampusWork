<?php
// ============================================================
// Save each class in its own file under
// app/Http/Controllers/Student/
// ============================================================

// -------------------------------------------------------
// app/Http/Controllers/Student/ApplicationController.php
// -------------------------------------------------------
namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Job;
use App\Models\WorkSchedule;
use App\Models\ConflictReport;
use App\Models\Notification;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    // GET /api/student/applications
    public function index(Request $request)
    {
        $applications = Application::with('job.shifts', 'job.business.businessProfile')
            ->where('student_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['applications' => $applications]);
    }

    // POST /api/student/applications
    public function store(Request $request)
    {
        $request->validate(['job_id' => 'required|exists:jobs,id']);

        $student = $request->user();
        $job     = Job::with('shifts')->findOrFail($request->job_id);

        // Prevent duplicate applications
        if (Application::where('student_id', $student->id)->where('job_id', $job->id)->exists()) {
            return response()->json(['message' => 'You have already applied for this job.'], 422);
        }

        // Check job is still open
        if ($job->status !== 'open' || $job->slots_available < 1) {
            return response()->json(['message' => 'This job is no longer accepting applications.'], 422);
        }

        // Run conflict check
        $conflicts = $this->detectConflicts($student->id, $job->shifts);

        if ($conflicts['has_conflict']) {
            // Still allow application but flag it
            Notification::create([
                'user_id' => $student->id,
                'title'   => 'Schedule conflict detected',
                'message' => 'Your application for ' . $job->title . ' has a schedule clash. An admin will review.',
                'type'    => 'conflict',
            ]);
        }

        $application = Application::create([
            'student_id'   => $student->id,
            'job_id'       => $job->id,
            'status'       => 'pending',
            'has_conflict' => $conflicts['has_conflict'],
        ]);

        // Log conflict report for admin
        if ($conflicts['has_conflict']) {
            ConflictReport::create([
                'student_id'    => $student->id,
                'job_id'        => $job->id,
                'conflict_type' => 'schedule_clash',
                'description'   => $conflicts['description'],
            ]);
        }

        return response()->json(['application' => $application->load('job')], 201);
    }

    // DELETE /api/student/applications/{id}
    public function destroy(Request $request, $id)
    {
        $application = Application::where('student_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        if ($application->status !== 'pending') {
            return response()->json(['message' => 'Only pending applications can be withdrawn.'], 422);
        }

        $application->update(['status' => 'withdrawn']);

        return response()->json(['message' => 'Application withdrawn.']);
    }

    // POST /api/student/check-conflict
    public function checkConflict(Request $request)
    {
        $request->validate(['job_id' => 'required|exists:jobs,id']);

        $job    = Job::with('shifts')->findOrFail($request->job_id);
        $result = $this->detectConflicts($request->user()->id, $job->shifts);

        return response()->json($result);
    }

    // -------------------------------------------------------
    // Core conflict detection logic
    // -------------------------------------------------------
    private function detectConflicts($studentId, $shifts): array
    {
        $clashes = [];

        foreach ($shifts as $shift) {
            $clash = \App\Models\ClassSchedule::where('user_id', $studentId)
                ->where('day_of_week', $shift->day_of_week)
                ->where('start_time', '<', $shift->end_time)
                ->where('end_time', '>', $shift->start_time)
                ->first();

            if ($clash) {
                $clashes[] = [
                    'day'        => $shift->day_of_week,
                    'shift'      => $shift->start_time . ' – ' . $shift->end_time,
                    'class'      => $clash->subject_name,
                    'class_time' => $clash->start_time . ' – ' . $clash->end_time,
                ];
            }
        }

        $description = '';
        if (!empty($clashes)) {
            $parts = array_map(fn($c) =>
                ucfirst($c['day']) . ': work shift ' . $c['shift'] .
                ' clashes with ' . $c['class'] . ' (' . $c['class_time'] . ')',
                $clashes
            );
            $description = implode('; ', $parts);
        }

        return [
            'has_conflict' => !empty($clashes),
            'clashes'      => $clashes,
            'description'  => $description,
        ];
    }
}

// -------------------------------------------------------
// app/Http/Controllers/Student/ClassScheduleController.php
// -------------------------------------------------------
namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ClassSchedule;
use Illuminate\Http\Request;

class ClassScheduleController extends Controller
{
    // GET /api/student/class-schedule
    public function index(Request $request)
    {
        $schedules = ClassSchedule::where('user_id', $request->user()->id)
            ->orderByRaw("FIELD(day_of_week,'monday','tuesday','wednesday','thursday','friday','saturday')")
            ->orderBy('start_time')
            ->get();

        return response()->json(['class_schedules' => $schedules]);
    }

    // POST /api/student/class-schedule
    public function store(Request $request)
    {
        $request->validate([
            'subject_name'  => 'required|string',
            'subject_code'  => 'nullable|string',
            'day_of_week'   => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday',
            'start_time'    => 'required|date_format:H:i',
            'end_time'      => 'required|date_format:H:i|after:start_time',
            'semester'      => 'required|string',
            'academic_year' => 'required|string',
        ]);

        $schedule = ClassSchedule::create([
            ...$request->only('subject_name','subject_code','day_of_week','start_time','end_time','semester','academic_year'),
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['class_schedule' => $schedule], 201);
    }

    // PUT /api/student/class-schedule/{id}
    public function update(Request $request, $id)
    {
        $schedule = ClassSchedule::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $request->validate([
            'subject_name' => 'sometimes|string',
            'day_of_week'  => 'sometimes|in:monday,tuesday,wednesday,thursday,friday,saturday',
            'start_time'   => 'sometimes|date_format:H:i',
            'end_time'     => 'sometimes|date_format:H:i',
        ]);

        $schedule->update($request->only('subject_name','subject_code','day_of_week','start_time','end_time','semester','academic_year'));

        return response()->json(['class_schedule' => $schedule]);
    }

    // DELETE /api/student/class-schedule/{id}
    public function destroy(Request $request, $id)
    {
        ClassSchedule::where('user_id', $request->user()->id)->findOrFail($id)->delete();
        return response()->json(['message' => 'Class removed from schedule.']);
    }
}

// -------------------------------------------------------
// app/Http/Controllers/Student/WorkScheduleController.php
// -------------------------------------------------------
namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\WorkSchedule;
use App\Models\ClassSchedule;
use Illuminate\Http\Request;

class WorkScheduleController extends Controller
{
    // GET /api/student/work-schedule
    public function index(Request $request)
    {
        $schedules = WorkSchedule::with('job.business.businessProfile')
            ->where('student_id', $request->user()->id)
            ->get();

        return response()->json(['work_schedules' => $schedules]);
    }

    // GET /api/student/full-schedule  — combined for the timetable view
    public function full(Request $request)
    {
        $userId = $request->user()->id;

        $classes = ClassSchedule::where('user_id', $userId)->get()
            ->map(fn($c) => [
                'type'        => 'class',
                'label'       => $c->subject_code ?? $c->subject_name,
                'day_of_week' => $c->day_of_week,
                'start_time'  => $c->start_time,
                'end_time'    => $c->end_time,
            ]);

        $shifts = WorkSchedule::with('job.business.businessProfile')
            ->where('student_id', $userId)->get()
            ->map(fn($w) => [
                'type'        => 'work',
                'label'       => $w->job->business->businessProfile->business_name ?? $w->job->title,
                'day_of_week' => $w->day_of_week,
                'start_time'  => $w->start_time,
                'end_time'    => $w->end_time,
            ]);

        return response()->json([
            'schedule' => $classes->merge($shifts)->values(),
        ]);
    }

    // GET /api/business/work-schedules
    public function businessIndex(Request $request)
    {
        $jobIds = $request->user()->jobs()->pluck('id');

        $schedules = WorkSchedule::with('student.studentProfile', 'job')
            ->whereIn('job_id', $jobIds)
            ->get();

        return response()->json(['work_schedules' => $schedules]);
    }
}
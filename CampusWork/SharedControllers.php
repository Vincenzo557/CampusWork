<?php
// ============================================================
// app/Http/Controllers/JobController.php  (public listings)
// ============================================================
namespace App\Http\Controllers;

use App\Models\Job;
use Illuminate\Http\Request;

class JobController extends Controller
{
    // GET /api/jobs  — public, no auth required
    public function index(Request $request)
    {
        $query = Job::with('shifts', 'business.businessProfile')
            ->where('status', 'open')
            ->whereHas('business.businessProfile', fn($q) => $q->where('status', 'approved'));

        // Search by title or business name
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhereHas('business.businessProfile', fn($bq) =>
                      $bq->where('business_name', 'like', '%' . $request->search . '%')
                  );
            });
        }

        // Filter by max hours
        if ($request->hours) {
            $query->where('hours_per_week', '<=', $request->hours);
        }

        // Filter by day available
        if ($request->day) {
            $query->whereHas('shifts', fn($q) => $q->where('day_of_week', $request->day));
        }

        $jobs = $query->latest()->get();

        return response()->json(['jobs' => $jobs]);
    }

    // GET /api/jobs/{id}
    public function show($id)
    {
        $job = Job::with('shifts', 'business.businessProfile')
            ->where('status', 'open')
            ->findOrFail($id);

        return response()->json(['job' => $job]);
    }
}

// ============================================================
// app/Http/Controllers/NotificationController.php
// ============================================================
namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /api/notifications
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        $unread = $notifications->where('is_read', false)->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unread,
        ]);
    }

    // PUT /api/notifications/{id}/read
    public function markRead(Request $request, $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notification marked as read.']);
    }
}

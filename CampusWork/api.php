<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Student\ProfileController as StudentProfileController;
use App\Http\Controllers\Student\ClassScheduleController;
use App\Http\Controllers\Student\WorkScheduleController;
use App\Http\Controllers\Student\ApplicationController as StudentApplicationController;
use App\Http\Controllers\Business\ProfileController as BusinessProfileController;
use App\Http\Controllers\Business\JobController as BusinessJobController;
use App\Http\Controllers\Business\ApplicationController as BusinessApplicationController;
use App\Http\Controllers\Admin\StudentController as AdminStudentController;
use App\Http\Controllers\Admin\BusinessController as AdminBusinessController;
use App\Http\Controllers\Admin\JobController as AdminJobController;
use App\Http\Controllers\Admin\ConflictController as AdminConflictController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\JobController;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password',  [AuthController::class, 'resetPassword']);

Route::get('/jobs',      [JobController::class, 'index']);
Route::get('/jobs/{id}', [JobController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Authenticated routes (all roles)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me',  [AuthController::class, 'me']);
    Route::put('/me',  [AuthController::class, 'update']);

    Route::get('/notifications',          [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    /*
    |--------------------------------------------------------------------------
    | Student routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:student')->prefix('student')->group(function () {

        // Class schedule
        Route::get('/class-schedule',         [ClassScheduleController::class, 'index']);
        Route::post('/class-schedule',        [ClassScheduleController::class, 'store']);
        Route::put('/class-schedule/{id}',    [ClassScheduleController::class, 'update']);
        Route::delete('/class-schedule/{id}', [ClassScheduleController::class, 'destroy']);

        // Work schedule
        Route::get('/work-schedule', [WorkScheduleController::class, 'index']);
        Route::get('/full-schedule', [WorkScheduleController::class, 'full']);

        // Applications
        Route::get('/applications',       [StudentApplicationController::class, 'index']);
        Route::post('/applications',      [StudentApplicationController::class, 'store']);
        Route::delete('/applications/{id}', [StudentApplicationController::class, 'destroy']);

        // Conflict check
        Route::post('/check-conflict', [StudentApplicationController::class, 'checkConflict']);
    });

    /*
    |--------------------------------------------------------------------------
    | Business routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:business')->prefix('business')->group(function () {

        // Profile
        Route::get('/profile', [BusinessProfileController::class, 'show']);
        Route::put('/profile', [BusinessProfileController::class, 'update']);

        // Jobs
        Route::get('/jobs',         [BusinessJobController::class, 'index']);
        Route::post('/jobs',        [BusinessJobController::class, 'store']);
        Route::get('/jobs/{id}',    [BusinessJobController::class, 'show']);
        Route::put('/jobs/{id}',    [BusinessJobController::class, 'update']);
        Route::delete('/jobs/{id}', [BusinessJobController::class, 'destroy']);

        // Applicants
        Route::get('/jobs/{id}/applications',          [BusinessApplicationController::class, 'index']);
        Route::put('/applications/{id}/accept',        [BusinessApplicationController::class, 'accept']);
        Route::put('/applications/{id}/reject',        [BusinessApplicationController::class, 'reject']);

        // Work schedules
        Route::get('/work-schedules', [WorkScheduleController::class, 'businessIndex']);
    });

    /*
    |--------------------------------------------------------------------------
    | Admin routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->prefix('admin')->group(function () {

        // Students
        Route::get('/students',                       [AdminStudentController::class, 'index']);
        Route::get('/students/{id}',                  [AdminStudentController::class, 'show']);
        Route::put('/students/{id}/max-hours',        [AdminStudentController::class, 'updateMaxHours']);

        // Businesses
        Route::get('/businesses',                     [AdminBusinessController::class, 'index']);
        Route::put('/businesses/{id}/approve',        [AdminBusinessController::class, 'approve']);
        Route::put('/businesses/{id}/suspend',        [AdminBusinessController::class, 'suspend']);

        // Jobs
        Route::get('/jobs',                           [AdminJobController::class, 'index']);
        Route::put('/jobs/{id}/close',                [AdminJobController::class, 'close']);

        // Conflicts
        Route::get('/conflicts',                      [AdminConflictController::class, 'index']);
        Route::put('/conflicts/{id}/resolve',         [AdminConflictController::class, 'resolve']);
        Route::post('/conflicts/{id}/notify',         [AdminConflictController::class, 'notify']);
    });
});

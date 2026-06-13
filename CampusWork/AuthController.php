<?php
// app/Http/Controllers/Auth/AuthController.php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\BusinessProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role'     => 'required|in:student,business',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $user->assignRole($request->role);

        if ($request->role === 'student') {
            $request->validate([
                'student_id'    => 'required|unique:student_profiles',
                'faculty'       => 'required|string',
                'course'        => 'required|string',
                'year_of_study' => 'required|integer|min:1|max:8',
            ]);
            StudentProfile::create([
                'user_id'       => $user->id,
                'student_id'    => $request->student_id,
                'faculty'       => $request->faculty,
                'course'        => $request->course,
                'year_of_study' => $request->year_of_study,
            ]);
        }

        if ($request->role === 'business') {
            $request->validate([
                'business_name' => 'required|string',
            ]);
            BusinessProfile::create([
                'user_id'       => $user->id,
                'business_name' => $request->business_name,
                'description'   => $request->description,
                'location'      => $request->location,
                'contact_number'=> $request->contact_number,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user->load($request->role === 'student' ? 'studentProfile' : 'businessProfile'),
            'token' => $token,
            'role'  => $request->role,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $role  = $user->getRoleNames()->first();

        return response()->json([
            'user'  => $user,
            'token' => $token,
            'role'  => $role,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $role = $user->getRoleNames()->first();

        if ($role === 'student') {
            $user->load('studentProfile');
        } elseif ($role === 'business') {
            $user->load('businessProfile');
        }

        return response()->json(['user' => $user, 'role' => $role]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $request->validate(['name' => 'sometimes|string|max:255']);
        $user->update($request->only('name'));
        return response()->json(['user' => $user]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $status = Password::sendResetLink($request->only('email'));
        return response()->json(['message' => __($status)]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset($request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete();
            }
        );

        return response()->json(['message' => __($status)]);
    }
}

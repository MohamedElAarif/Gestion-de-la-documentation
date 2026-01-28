<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminAuthController extends Controller
{
	public function create()
	{
		return Inertia::render('Auth/Login');
	}

	public function store(Request $request)
	{
		$credentials = $request->validate([
			'email' => ['required', 'email'],
			'password' => ['required', 'string'],
			'remember' => ['sometimes', 'boolean'],
		]);

		$remember = (bool) ($credentials['remember'] ?? false);
		unset($credentials['remember']);

		if (! Auth::attempt($credentials, $remember)) {
			throw ValidationException::withMessages([
				'email' => __('These credentials do not match our records.'),
			]);
		}

		$request->session()->regenerate();

		return redirect()->intended('/Documents');
	}

	public function destroy(Request $request)
	{
		Auth::logout();

		$request->session()->invalidate();
		$request->session()->regenerateToken();

		return redirect('/login');
	}
}


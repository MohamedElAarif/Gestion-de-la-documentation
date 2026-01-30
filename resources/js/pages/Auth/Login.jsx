import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import logo from '../../assets/Logo AULSH-1.png';
import { Lock, User } from 'lucide-react';

export default function Login() {
	const { props } = usePage();
	const errors = props?.errors || {};

	const [login, setLogin] = useState('');
	const [password, setPassword] = useState('');
	const [remember, setRemember] = useState(false);
	const [processing, setProcessing] = useState(false);

	useEffect(() => {
		// If the backend shares auth.user and we're already logged in, bounce to app.
		if (props?.auth?.user) {
			router.visit('/Documents');
		}
	}, [props?.auth?.user]);

	const submit = (e) => {
		e.preventDefault();
		setProcessing(true);
		router.post(
			'/login',
			{ login, password, remember },
			{
				onFinish: () => setProcessing(false),
				preserveScroll: true,
			}
		);
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="flex flex-col items-center">
					<img
						className="h-32 w-auto mb3 drop-shadow-sm"
						src={logo}
						alt="AULSH Logo"
					/>
					{/* <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
						Système de gestion
					</h2> */}
					<p className="mt-2 text-center text-sm text-gray-600">
						Espace d'administration de la bibliothèque
					</p>
				</div>

				<div className="mt-8 bg-white py-10 px-6 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-12 border border-gray-100">
					<form className="space-y-6" onSubmit={submit}>
						<div>
							<label htmlFor="login" className="block text-sm font-semibold text-gray-700 ml-1">
								Login
							</label>
							<div className="mt-1 relative group">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#147a40] transition-colors">
									<User size={18} />
								</div>
								<input
									id="login"
									name="login"
									type="text"
									required
									autoFocus
									value={login}
									onChange={(e) => setLogin(e.target.value)}
									className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#147a40]/20 focus:border-[#147a40] transition-all sm:text-sm bg-gray-50/50"
									placeholder="login d'utilisateur"
								/>
							</div>
							{errors.login && (
								<p className="mt-2 text-sm text-red-600 animate-pulse">{errors.login}</p>
							)}
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-semibold text-gray-700 ml-1">
								Mot de passe
							</label>
							<div className="mt-1 relative group">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#147a40] transition-colors">
									<Lock size={18} />
								</div>
								<input
									id="password"
									name="password"
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#147a40]/20 focus:border-[#147a40] transition-all sm:text-sm bg-gray-50/50"
									placeholder="••••••••"
								/>
							</div>
							{errors.password && (
								<p className="mt-2 text-sm text-red-600 animate-pulse">{errors.password}</p>
							)}
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<input
									id="remember_me"
									name="remember_me"
									type="checkbox"
									checked={remember}
									onChange={(e) => setRemember(e.target.checked)}
									className="h-4 w-4 text-[#147a40] focus:ring-[#147a40] border-gray-300 rounded-md cursor-pointer"
								/>
								<label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
									Se souvenir de moi
								</label>
							</div>
						</div>

						<div>
							<button
								type="submit"
								disabled={processing}
								className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-[#147a40]/20 text-sm font-bold text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0
									${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#147a40] hover:bg-[#0f5c30] focus:outline-none focus:ring-4 focus:ring-[#147a40]/20'}`}
							>
								{processing ? (
									<span className="flex items-center gap-2">
										<svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										Connexion...
									</span>
								) : 'Se connecter'}
							</button>
						</div>
					</form>
				</div>

				<div className="mt-8 text-center">
					<p className="text-xs text-gray-400">
						&copy; {new Date().getFullYear()} Bibliothèque AULSH. Tous droits réservés.
					</p>
				</div>
			</div>
		</div>
	);
}



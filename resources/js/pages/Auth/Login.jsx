import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';

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
	}, []);

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
		<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1220' }}>
			<div
				style={{
					width: 'min(420px, 92vw)',
					background: 'rgba(255,255,255,0.06)',
					border: '1px solid rgba(255,255,255,0.12)',
					borderRadius: 16,
					padding: 24,
					color: '#e5e7eb',
					boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
				}}
			>
				<h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Connexion</h1>
				<p style={{ marginTop: 8, marginBottom: 18, color: 'rgba(229,231,235,0.75)' }}>
					Connectez-vous pour accéder à l’application.
				</p>

				<form onSubmit={submit}>
					<div style={{ display: 'grid', gap: 10 }}>
						<label style={{ display: 'grid', gap: 6 }}>
							<span style={{ fontSize: 13, color: 'rgba(229,231,235,0.8)' }}>Login</span>
							<input
								type="text"
								value={login}
								onChange={(e) => setLogin(e.target.value)}
								required
								autoFocus
								style={{
									width: '100%',
									padding: '10px 12px',
									borderRadius: 10,
									border: '1px solid rgba(255,255,255,0.18)',
									background: 'rgba(17,24,39,0.6)',
									color: '#e5e7eb',
									outline: 'none',
								}}
							/>
							{errors.login ? (
								<small style={{ color: '#fca5a5' }}>{errors.login}</small>
							) : null}
						</label>

						<label style={{ display: 'grid', gap: 6 }}>
							<span style={{ fontSize: 13, color: 'rgba(229,231,235,0.8)' }}>Mot de passe</span>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								style={{
									width: '100%',
									padding: '10px 12px',
									borderRadius: 10,
									border: '1px solid rgba(255,255,255,0.18)',
									background: 'rgba(17,24,39,0.6)',
									color: '#e5e7eb',
									outline: 'none',
								}}
							/>
							{errors.password ? (
								<small style={{ color: '#fca5a5' }}>{errors.password}</small>
							) : null}
						</label>

						<label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
							<input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
							<span style={{ fontSize: 13, color: 'rgba(229,231,235,0.85)' }}>Se souvenir de moi</span>
						</label>

						<button
							type="submit"
							disabled={processing}
							style={{
								marginTop: 10,
								width: '100%',
								padding: '10px 12px',
								borderRadius: 10,
								border: 0,
								background: processing ? 'rgba(59,130,246,0.55)' : '#3b82f6',
								color: 'white',
								fontWeight: 700,
								cursor: processing ? 'not-allowed' : 'pointer',
							}}
						>
							{processing ? 'Connexion…' : 'Se connecter'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}


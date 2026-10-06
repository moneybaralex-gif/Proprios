<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { toast } from '$lib/services/notification.svelte';
	import {
		Mail,
		LockKeyhole,
		User,
		Loader2,
		AlertCircle,
		ArrowRight,
		Eye,
		EyeOff
	} from '@lucide/svelte';
	import GoogleOnTap from '../GoogleOnTap.svelte';

	// Props optionnels pour recevoir des handlers personnalisés BetterAuth
	let {
		step,
		onSignInSuccess = () => {},
		onSignUpSuccess = () => {}
	}: {
		step?: number;
		onSignInSuccess?: () => void;
		onSignUpSuccess?: () => void;
	} = $props();

	let mode = $state<'login' | 'register'>('login');
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);
	let passType = $state<'password' | 'text'>('password');

	// Champs du Formulaire
	let name = $state('');
	let email = $state('');
	let password = $state('');

	// Validation du mot de passe (mode register uniquement)
	let hasMinLength = $derived(password.length >= 8);
	let hasUppercase = $derived(/[A-Z]/.test(password));
	let hasDigit = $derived(/\d/.test(password));
	let isRegisterPasswordValid = $derived(hasMinLength && hasUppercase && hasDigit);

	function switchTab(target: 'login' | 'register') {
		mode = target;
		errorMessage = null;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = null;

		if (!email || !password || (mode === 'register' && !name)) {
			errorMessage = 'Veuillez remplir tous les champs obligatoires.';
			return;
		}

		if (mode === 'register' && !isRegisterPasswordValid) {
			errorMessage =
				'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.';
			return;
		}

		loading = true;

		try {
			// Intégration BetterAuth Client (Exemple)
			if (mode === 'login') {
				// Exemple: await authClient.signIn.email({ email, password });
				const res = await authClient.signIn.email({
					email,
					password
				});

				if (res.error) {
					errorMessage = res.error.message || "Erreur lors de l'inscription";
					toast.ajouter("Erreur lors de l'inscription", 'error');
				} else {
					onSignUpSuccess();
					await invalidateAll();
					await goto('/');
				}
			} else {
				// Exemple: await authClient.signUp.email({ email, password, name });
				const res = await authClient.signUp.email({
					email,
					password,
					name
				});

				if (res.error) {
					errorMessage = res.error.message || 'Identifiants invalides';
					toast.ajouter('Identifiants invalides', 'error');
				} else {
					onSignInSuccess();
					await invalidateAll();
					await goto('/');
				}
			}
		} catch (error) {
			console.error('Erreur lors de la soumission du formulaire:', error);
			errorMessage = 'Une erreur est survenue lors de la tentative.';
		} finally {
			loading = false;
		}
	}

	async function handleGoogleSignIn() {
		try {
			loading = true;
			// Exmple: await authClient.signIn.social({ provider: 'google' });
			const res = await authClient.signIn.social({
				provider: 'google',
				window: true
			});

			if (res?.error) {
				errorMessage = res.error.message || 'La connexion a échoué.';
				toast.ajouter('La connexion a échoué.', 'error');
			} else {
				// Le popup s'est fermé et l'utilisateur est connecté !
				// Vous pouvez rediriger ou simplement rafraîchir la page
				goto('/');
			}
		} catch (error) {
			console.error('Erreur lors de la soumission du formulaire:', error);
			errorMessage = 'Une erreur est survenue lors de la tentative de connexion avec Google.';
			toast.ajouter(
				'Une erreur est survenue lors de la tentative de connexion avec Google.',
				'error'
			);
		} finally {
			loading = false;
		}
	}
</script>

{#if step && step >= 5}
	<GoogleOnTap onSuccess={onSignInSuccess} />
{/if}

<div class="mx-auto w-full max-w-md px-4 py-6">
	<!-- Carte Authentification Clerk/Supabase-Style -->
	<div
		class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-2xl"
	>
		<!-- Dynamic Top Shimmer -->
		<div
			class="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-emerald-400 to-transparent"
		></div>

		<!-- En-tête -->
		<div class="mb-6 space-y-2 text-center">
			<h3 class="text-2xl font-bold tracking-tight text-white">
				{mode === 'login' ? 'Connexion à Proprios' : 'Créer votre compte'}
			</h3>
			<p class="text-xs text-slate-400">
				{mode === 'login'
					? 'Accédez à votre espace sécurisé d’actifs immobiliers.'
					: 'Rejoignez la plateforme numérique de référence.'}
			</p>
		</div>

		<!-- Onglets Switcher (Clerk Style) -->
		<div class="mb-6 grid grid-cols-2 rounded-xl border border-white/5 bg-slate-950/80 p-1">
			<button
				type="button"
				onclick={() => switchTab('login')}
				class="rounded-lg py-2 text-xs font-semibold transition-all duration-300 {mode === 'login'
					? 'bg-emerald-500 text-slate-950 shadow-md'
					: 'text-slate-400 hover:text-white'}"
			>
				Connexion
			</button>
			<button
				type="button"
				onclick={() => switchTab('register')}
				class="rounded-lg py-2 text-xs font-semibold transition-all duration-300 {mode ===
				'register'
					? 'bg-emerald-500 text-slate-950 shadow-md'
					: 'text-slate-400 hover:text-white'}"
			>
				Créer un compte
			</button>
		</div>

		<!-- Message d'erreur -->
		{#if errorMessage}
			<div
				class="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400"
			>
				<AlertCircle class="h-4 w-4 shrink-0" />
				<span>{errorMessage}</span>
			</div>
		{/if}

		<!-- Bouton OAuth Google -->
		<button
			type="button"
			onclick={handleGoogleSignIn}
			disabled={loading}
			class="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-medium text-white transition-all duration-200 hover:bg-white/10 disabled:opacity-50"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24">
				<path
					fill="#4285F4"
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				/>
				<path
					fill="#34A853"
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				/>
				<path
					fill="#FBBC05"
					d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
				/>
				<path
					fill="#EA4335"
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
				/>
			</svg>
			<span>Continuer avec Google</span>
		</button>

		<div class="relative my-5 flex items-center justify-center">
			<div class="w-full border-t border-white/10"></div>
			<span class="bg-[#0f111a] px-3 font-mono text-[10px] text-slate-500 uppercase">ou</span>
		</div>

		<!-- Formulaire Email/Password -->
		<form onsubmit={handleSubmit} class="space-y-4">
			{#if mode === 'register'}
				<div>
					<label for="name" class="mb-1 block text-xs font-medium text-slate-300">Nom complet</label
					>
					<div class="relative">
						<User class="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
						<input
							id="name"
							type="text"
							bind:value={name}
							placeholder="Jean Dupont"
							required
							class="w-full rounded-xl border border-white/10 bg-slate-950/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
						/>
					</div>
				</div>
			{/if}

			<div>
				<label for="email" class="mb-1 block text-xs font-medium text-slate-300"
					>Adresse Email</label
				>
				<div class="relative">
					<Mail class="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="nom@exemple.com"
						required
						class="w-full rounded-xl border border-white/10 bg-slate-950/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
					/>
				</div>
			</div>

			<div>
				<label for="password" class="mb-1 block text-xs font-medium text-slate-300"
					>Mot de passe</label
				>
				<div class="relative">
					<LockKeyhole class="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
					<input
						id="password"
						type={passType}
						bind:value={password}
						placeholder="••••••••••••"
						required
						class="w-full rounded-xl border border-white/10 bg-slate-950/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
					/>
					<button
						onclick={() => (passType = passType === 'password' ? 'text' : 'password')}
						type="button"
						class="absolute top-2 right-3 cursor-pointer text-slate-500 hover:text-slate-200"
					>
						{#if passType === 'text'}
							<Eye size={20} />
						{:else}
							<EyeOff size={20} />
						{/if}
					</button>
				</div>

				{#if mode === 'register'}
					<ul class="mt-2 space-y-1 text-[10px]">
						<li
							class="flex items-center gap-1.5 {hasMinLength
								? 'text-emerald-400'
								: 'text-rose-400'}"
						>
							<span aria-hidden="true">{hasMinLength ? '✓' : '✕'}</span>
							<span>Au moins 8 caractères</span>
						</li>
						<li
							class="flex items-center gap-1.5 {hasUppercase
								? 'text-emerald-400'
								: 'text-rose-400'}"
						>
							<span aria-hidden="true">{hasUppercase ? '✓' : '✕'}</span>
							<span>Au moins 1 lettre majuscule</span>
						</li>
						<li class="flex items-center gap-1.5 {hasDigit ? 'text-emerald-400' : 'text-rose-400'}">
							<span aria-hidden="true">{hasDigit ? '✓' : '✕'}</span>
							<span>Au moins 1 chiffre</span>
						</li>
					</ul>
				{/if}
			</div>

			<button
				type="submit"
				disabled={loading || (mode === 'register' && !isRegisterPasswordValid)}
				class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-size-[200%_auto] px-4 py-3 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300 hover:bg-position-[right_center] active:scale-95 disabled:opacity-50"
			>
				{#if loading}
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Chargement...</span>
				{:else}
					<span>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</span>
					<ArrowRight class="h-4 w-4" />
				{/if}
			</button>
		</form>
	</div>
</div>

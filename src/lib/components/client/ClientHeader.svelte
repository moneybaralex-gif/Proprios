<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Bell, LogOut, ShieldAlert } from '@lucide/svelte';

	let dark = $state(true);

	const user = $derived(page.data.user);
	const isAdminOrEmployee = $derived(
		user?.role === 'admin' || user?.role === 'employee'
	);

	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', dark);
		}
	});

	async function signOut() {
		try {
			await authClient.signOut();
			goto('/login');
		} catch (e) {
			console.error('Erreur déconnexion:', e);
		}
	}
</script>

<header class="sticky top-0 z-40 w-full px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
	<div
		class="glass mx-auto flex max-w-3xl items-center justify-between gap-2 rounded-2xl sm:rounded-3xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-lg"
	>
		<!-- Logo -->
		<button
			type="button"
			class="flex items-center gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl"
			onclick={() => goto('/')}
			aria-label="Accueil Proprios"
		>
			<span
				class="grid size-9 sm:size-10 place-items-center rounded-xl sm:rounded-2xl bg-emerald-400 font-black text-slate-950 shadow-sm"
			>
				P
			</span>
			<span class="font-black tracking-tight text-white text-base sm:text-lg">PROPRIOS</span>
		</button>

		<!-- Actions -->
		<div class="flex items-center gap-1 sm:gap-1.5 min-w-0">
			<!-- Bouton Back-office pour Admin & Employé -->
			{#if isAdminOrEmployee}
				<button
					type="button"
					onclick={() => goto('/admin')}
					class="flex items-center gap-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 px-2.5 py-1.5 text-xs font-bold text-amber-300 transition-all hover:bg-amber-400/25 active:scale-95"
					title="Accéder au panneau d'administration"
				>
					<ShieldAlert size={16} />
					<span class="hidden md:inline">Administration</span>
				</button>
			{/if}

			<button
				type="button"
				class="icon-btn text-slate-300 hover:text-white"
				onclick={() => goto('/notifications')}
				aria-label="Notifications"
			>
				<Bell size={18} />
			</button>

			<!-- Avatar / Profil -->
			<button
				type="button"
				class="flex items-center gap-2 rounded-full bg-white/5 border border-white/5 p-1 sm:px-2.5 sm:py-1.5 transition-all hover:bg-white/10 active:scale-95"
				onclick={() => goto('/profile')}
				aria-label="Voir mon profil"
			>
				{#if user?.image}
					<img
						src={user.image}
						alt={user.name ?? 'Profil'}
						class="size-7 sm:size-8 rounded-full object-cover ring-1 ring-emerald-400/40"
					/>
				{:else}
					<span
						class="grid size-7 sm:size-8 place-items-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-300"
					>
						{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
					</span>
				{/if}
				<span class="hidden max-w-24 truncate text-xs sm:text-sm font-semibold text-slate-200 sm:block">
					{user?.name ?? 'Profil'}
				</span>
			</button>

			<button
				type="button"
				class="icon-btn hidden text-slate-300 hover:text-rose-400 sm:flex"
				onclick={signOut}
				aria-label="Déconnexion"
			>
				<LogOut size={17} />
			</button>
		</div>
	</div>
</header>
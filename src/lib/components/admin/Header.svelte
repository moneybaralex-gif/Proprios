<script lang="ts">
	import type { Snippet } from 'svelte';
	import {page} from '$app/state';
	import userImg from '$lib/assets/favicon.svg';
	import {
		Menu,
		CloudSync,
		Home,
		DollarSign,
		NotebookText,
		UserStar,
		Truck,
		ShoppingCart,
		Building2,
		Cog,
		Bolt


	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let { children }: { children: Snippet } = $props();

	let heureActuelle: string = $state('');
	let openMenu: boolean = $state(true); // true = réduit, false = étendu
	let menuElement: HTMLDivElement | undefined = $state();

	// Gestion du Header au défilement
	let scrollY = $state(0);
	let lastScrollY = 0;
	let showHeader = $state(true);
	const scrollThreshold = 100;

	$effect(() => {
		const currentScroll = scrollY;
		if (currentScroll > scrollThreshold && currentScroll > lastScrollY) {
			showHeader = false; // On cache si on descend
		} else {
			showHeader = true; // On réaffiche si on remonte ou si on est en haut
		}
		lastScrollY = currentScroll;
	});

	onMount(() => {
		const updateHeure = () => {
			const now = new Date();
			const hours = now.getHours().toString().padStart(2, '0');
			const minutes = now.getMinutes().toString().padStart(2, '0');
			heureActuelle = `${hours}:${minutes}`;
		};

		updateHeure();
		const intervalId = setInterval(updateHeure, 60000);

		return () => clearInterval(intervalId);
	});

	function handleClick(event: MouseEvent) {
		if (menuElement && !menuElement.contains(event.target as Node)) {
			openMenu = true;
		}
	}
</script>

<svelte:window onclick={handleClick} bind:scrollY={scrollY} />

<div class="relative min-h-screen w-full bg-slate-50">
	<!-- Barre latérale (Sidebar) -->
	<div
		bind:this={menuElement}
		class="fixed top-0 left-0 z-50 flex h-screen flex-col justify-between bg-linear-to-b from-cyan-950 to-cyan-900 pt-4 pb-6 px-3 transition-all duration-300 ease-in-out shadow-xl {!openMenu ? 'w-72' : 'w-20'}"
	>
		<div class="flex flex-col gap-6">
			<!-- Logo -->
			<div class="flex h-12 items-center gap-3 px-3">
				<img src="/images/logo/logoBlanc.png" alt="Logo" class="h-9 w-9 shrink-0 transition-transform duration-300 hover:rotate-6" />
				{#if !openMenu}
					<h1
						in:fly={{ x: -15, duration: 250 }}
						out:fade={{ duration: 100 }}
						class="text-xl font-bold tracking-wider text-cyan-50"
					>
						MBP<span class="text-amber-500">Admin</span>
					</h1>
				{/if}
			</div>

			<!-- Liens de navigation -->
			<nav class="flex flex-col gap-1.5">
	<!-- Correspondance exacte pour l'accueil -->
	<a 
		href="/admin" 
		class="nav-item" 
		class:active={page.url.pathname === '/admin'}
	>
		<Home class="h-5 w-5 shrink-0" />
		<span class={!openMenu ? 'block' : 'hidden'}>Tableau de bord</span>
	</a>

	<!-- Utilisation de .startsWith() pour que l'onglet reste actif même sur les sous-pages (ex: /admin/boutique/produit-1) -->
	<a 
		href="/admin/boutique" 
		class="nav-item" 
		class:active={page.url.pathname.startsWith('/admin/boutique')}
	>
		<ShoppingCart class="h-5 w-5 shrink-0" />
		<span class={!openMenu ? 'block' : 'hidden'}>Boutique</span>
	</a>

	<a 
		href="/admin/parking" 
		class="nav-item" 
		class:active={page.url.pathname.startsWith('/admin/parking')}
	>
		<Truck class="h-5 w-5 shrink-0" />
		<span class={!openMenu ? 'block' : 'hidden'}>Parking</span>
	</a>

	<a 
		href="/admin/locateurs" 
		class="nav-item" 
		class:active={page.url.pathname.startsWith('/admin/locateurs')}
	>
		<Building2 class="h-5 w-5 shrink-0" />
		<span class={!openMenu ? 'block' : 'hidden'}>Locateurs</span>
	</a>

	<a 
		href="/admin/employes" 
		class="nav-item" 
		class:active={page.url.pathname.startsWith('/admin/employes')}
	>
		<UserStar class="h-5 w-5 shrink-0" />
		<span class={!openMenu ? 'block' : 'hidden'}>Employés</span>
	</a>

	<a 
		href="/admin/rapports" 
		class="nav-item" 
		class:active={page.url.pathname.startsWith('/admin/rapports')}
	>
		<NotebookText class="h-5 w-5 shrink-0" />
		<span class={!openMenu ? 'block' : 'hidden'}>Rapport</span>
	</a>

	<a 
		href="/admin/finance" 
		class="nav-item" 
		class:active={page.url.pathname.startsWith('/admin/finance')}
	>
		<DollarSign class="h-5 w-5 shrink-0" />
		<span class={!openMenu ? 'block' : 'hidden'}>Finance</span>
	</a>

	<a 
		href="/admin/parametres" 
		class="nav-item" 
		class:active={page.url.pathname.startsWith('/admin/parametres')}
	>
		<Cog class="h-5 w-5 shrink-0" />
		<span class={!openMenu ? 'block' : 'hidden'}>Paramètres</span>
	</a>
</nav>
		</div>

		<!-- Profil Utilisateur -->
		<div class="border-t border-cyan-300 pt-4">
			<div class="flex items-center justify-between px-2">
				<div class="flex items-center gap-3">
					<img src={userImg} alt="Profil" class="h-9 w-9 rounded-full border border-cyan-700/50 bg-cyan-900 object-cover" />
					{#if !openMenu}
						<div in:fade={{ duration: 200 }} class="flex flex-col">
							<div class="flex items-center gap-1.5">
								<span class="text-sm font-semibold text-white leading-none">Utilisateur</span>
								<span class="relative flex h-2 w-2">
									<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
									<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
								</span>
							</div>
							<span class="text-xs text-cyan-300 mt-0.5">Admin</span>
						</div>
					{/if}
				</div>
				{#if !openMenu}
					<button type="button" class="text-cyan-300 hover:text-white transition-colors duration-200">
						<Bolt class="h-7 w-7 transition-transform hover:rotate-45 hover:scale-105 active:scale-95 duration-300 cursor-pointer" />
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Contenu Principal -->
	<main
		class="min-h-screen transition-all duration-300 ease-in-out {!openMenu ? 'pl-72' : 'pl-20'}"
	>
		<!-- Header Dynamique au Scroll -->
		<header
			class="sticky -mb-4 top-0 z-30 flex w-full border-b border-slate-200/80 bg-white backdrop-blur-md px-6 py-3 transition-all duration-300 ease-in-out
			{showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
			{scrollY > 20 ? 'shadow-sm border-slate-200 bg-white/90' : ''}"
		>
			<div class="flex w-full items-center justify-between">
				<div class="flex items-center gap-4">
					<button
						onclick={(e) => {
							e.stopPropagation();
							openMenu = !openMenu;
						}}
						class="rounded-lg p-1.5 hover:bg-slate-200/50 transition-colors duration-200"
						aria-label="Toggle Menu"
					>
						<Menu class="h-6 w-6 text-slate-700" />
					</button>

					{#if openMenu}
						<h1
							in:fade={{ duration: 200 }}
							out:fade={{ duration: 200 }}
							class="text-xl font-bold tracking-wider text-cyan-950"
						>
							MBP<span class="text-amber-500">Admin</span>
						</h1>
					{/if}
				</div>

				<div class="flex items-center gap-5">
					<button
						class="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-all hover:bg-amber-600 active:scale-95"
					>
						<CloudSync class="h-4 w-4" />
						Sync
					</button>
					<div class="text-sm font-medium text-slate-600 bg-slate-200/50 px-3 py-1.5 rounded-lg border border-slate-200/60">
						{heureActuelle}
					</div>
				</div>
			</div>
		</header>

		<!-- Zone du rendu dynamique -->
		<div class="p-6">
			{@render children()}
		</div>
	</main>
</div>

<style>
	/* Éléments de navigation épurés et modernes */
	.nav-item {
		display: flex;
		align-items: center;
		gap: 14px;
		height: 44px;
		padding: 0 12px;
		border-radius: 8px;
		color: rgb(207, 230, 230);
		font-size: 14px;
		font-weight: 500;
		transition: all 0.2s ease-in-out;
		text-decoration: none;
	}

	/* Effet de survol flottant type "pill" */
	.nav-item:hover {
		background-color: rgba(255, 255, 255, 0.08);
		color: #ffffff;
		transform: translateX(2px);
	}


	 .nav-item.active {
		background-color: #ffffff;
		color: #083344;
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}
</style>
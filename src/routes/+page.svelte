<!-- filepath: src/routes/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Search, SlidersHorizontal, MapPin, Heart, ShieldCheck, Loader2 } from '@lucide/svelte';
	import PlotSkeletonCard from '$lib/components/PlotSkeletonCard.svelte';
	import type { PageData } from './$types';

	interface PlotImage {
		url: string;
	}

	interface PlotItem {
		id: string;
		categoryId?: string | null;
		description?: string | null;
		city?: string | null;
		country?: string | null;
		address?: string | null;
		width?: number | null;
		height?: number | null;
		price?: number | null;
		isFavorite?: boolean;
		images?: PlotImage[] | null;
	}

	let { data }: { data: PageData } = $props();

	let q = $state('');
	let category = $state('ALL');
	let sort = $state('recent');
	let items = $state<PlotItem[]>([]);
	let cursor = $state<string | null>(null);
	let loading = $state(false);
	let searching = $state(false); // true uniquement pendant le petit délai de recherche (debounce)
	let hasMore = $state(true);

	// Jeton de requête : permet d'ignorer/annuler un flux de résultats devenu obsolète
	// (ex : l'utilisateur tape plus vite que le temps de réponse du serveur)
	let requestToken = 0;
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	// --- Variantes visuelles déterministes (ratio d'image, carte "mise en avant") ---
	// Le rendu paraît aléatoire à l'œil, comme sur les plateformes modernes (Pinterest,
	// Instagram Explore...), mais reste stable pour un même id : pas de saut de mise en
	// page quand les éléments déjà affichés sont re-rendus.
	const ASPECTS = ['4 / 3', '1 / 1', '3 / 4', '16 / 9', '4 / 5'];

	function hashCode(str: string) {
		let h = 0;
		for (let i = 0; i < str.length; i++) {
			h = (h << 5) - h + str.charCodeAt(i);
			h |= 0;
		}
		return Math.abs(h);
	}

	function getAspect(id: string) {
		return ASPECTS[hashCode(id) % ASPECTS.length];
	}

	function isFeatured(id: string, index: number) {
		return hashCode(`${id}-${index}`) % 6 === 0;
	}

	const skeletonAspects = [ASPECTS[0], ASPECTS[3], ASPECTS[1], ASPECTS[2], ASPECTS[4], ASPECTS[0]];

	onMount(() => {
		items = data.recommended as PlotItem[];
		load(true);
	});

	async function load(reset = false) {
		if (!reset && (loading || !hasMore)) return;

		const myToken = reset ? ++requestToken : requestToken;
		loading = true;

		if (reset) {
			cursor = null;
			items = [];
			hasMore = true;
		}

		const p = new SvelteURLSearchParams({ limit: '12', sort });
		if (q.trim()) p.set('q', q.trim());
		if (category && category !== 'ALL') p.set('category', category);
		if (cursor) p.set('cursor', cursor);

		try {
			const res = await fetch(`/api/plots?${p}`);
			if (!res.ok || !res.body) return;

			// Lecture en streaming : le serveur envoie les parcelles par petits paquets
			// (format NDJSON) au fur et à mesure qu'il les récupère en base, au lieu
			// d'attendre que la requête complète soit terminée avant de répondre.
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				if (myToken !== requestToken) {
					reader.cancel();
					break;
				}

				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				let newlineIndex: number;
				while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
					const line = buffer.slice(0, newlineIndex).trim();
					buffer = buffer.slice(newlineIndex + 1);
					if (!line || myToken !== requestToken) continue;

					const chunk = JSON.parse(line);
					items = [...items, ...(chunk.items ?? [])];
					cursor = chunk.nextCursor ?? cursor;
					hasMore = Boolean(chunk.hasMore);
				}
			}
		} catch (err) {
			console.error('Erreur lors du chargement des parcelles:', err);
		} finally {
			if (myToken === requestToken) {
				loading = false;
				searching = false;
			}
		}
	}

	function onSearchInput() {
		searching = true;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => load(true), 350);
	}

	function toggleFavorite(e: MouseEvent, plot: PlotItem) {
		e.preventDefault();
		e.stopPropagation();
		const next = !plot.isFavorite;
		plot.isFavorite = next;

		fetch('/api/favorites', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ plotId: plot.id, favorite: next })
		});
	}

	function onScroll() {
		if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) load();
	}
</script>

<svelte:window onscroll={onScroll} />
<svelte:head>
	<title>Proprios — Parcelles certifiées</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-5 pb-24">
	<section class="mb-6 pt-3">
		<p class="mb-1 text-sm font-semibold text-emerald-300">Marché foncier certifié</p>
		<h1 class="text-3xl font-black tracking-tight text-white">Trouvez votre prochaine parcelle.</h1>

		<!-- BARRE DE RECHERCHE + SÉLECTEUR DE CATÉGORIE -->
		<div class="mt-4 flex items-center gap-2">
			<div class="relative flex-1">
				{#if searching}
					<Loader2
						class="absolute top-1/2 left-3 -translate-y-1/2 animate-spin text-emerald-400"
						size={19}
					/>
				{:else}
					<Search class="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" size={19} />
				{/if}
				<input
					class="input searchInput"
					bind:value={q}
					oninput={onSearchInput}
					placeholder="Rechercher par ville, adresse..."
				/>
			</div>
			<div class="flex items-center gap-2">
				<button
					class="icon-btn shrink-0 cursor-pointer"
					onclick={() => load(true)}
					aria-label="Filtrer"
				>
					<SlidersHorizontal size={19} />
				</button>
			</div>
		</div>

		<!-- FILTRES DE TRI -->
		<div class="mt-2 flex gap-2 overflow-x-auto pb-1">
			<button
				class="cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition-all {sort ===
				'recent'
					? 'bg-emerald-400 text-slate-950'
					: 'bg-white/5 text-slate-400 hover:text-white'}"
				onclick={() => {
					sort = 'recent';
					load(true);
				}}>Récentes</button
			>
			<button
				class="cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition-all {sort ===
				'popular'
					? 'bg-emerald-400 text-slate-950'
					: 'bg-white/5 text-slate-400 hover:text-white'}"
				onclick={() => {
					sort = 'popular';
					load(true);
				}}>Populaires</button
			>
			<button
				class="cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition-all {sort ===
				'priceDesc'
					? 'bg-emerald-400 text-slate-950'
					: 'bg-white/5 text-slate-400 hover:text-white'}"
				onclick={() => {
					sort = 'priceDesc';
					load(true);
				}}>Prix ↑</button
			>
			<button
				class="cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition-all {sort ===
				'priceAsc'
					? 'bg-emerald-400 text-slate-950'
					: 'bg-white/5 text-slate-400 hover:text-white'}"
				onclick={() => {
					sort = 'priceAsc';
					load(true);
				}}>Prix ↓</button
			>
		</div>
	</section>

	<!-- PARCELLES RECOMMANDÉES (section inchangée) -->
	<section class="mb-7">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-extrabold text-white">Recommandées</h2>
			<span class="text-xs text-slate-500">{data.total} disponibles</span>
		</div>
		<div class="flex snap-x gap-3.5 overflow-x-auto pb-2">
			{#each data.recommended as plot (plot.id)}
				<article
					class="card group min-w-[84%] snap-start overflow-hidden transition-all duration-300 hover:border-emerald-400/50 hover:shadow-xl sm:min-w-[46%]"
				>
					<a href="/plots/{plot.id}" class="block">
						<div class="relative h-44 overflow-hidden bg-slate-900">
							{#if plot.images && plot.images[0]}
								<img
									src={plot.images[0].url}
									alt=""
									class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
								/>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-slate-900 text-xs text-slate-600"
								>
									Photo non disponible
								</div>
							{/if}
							<span
								class="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-emerald-400 px-2.5 py-1 text-[10px] font-black text-slate-950 shadow-md"
							>
								<ShieldCheck size={12} /> CERTIFIÉ
							</span>
						</div>
						<div class="p-4">
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0 flex-1">
									<h3
										class="truncate text-base font-bold text-white transition-colors group-hover:text-emerald-300"
									>
										{plot.city || 'Kinshasa'}
									</h3>
									<p class="mt-0.5 text-xs text-slate-400">
										{plot.width ?? '—'} × {plot.height ?? '—'} m
									</p>
									{#if plot.description}
										<p class="mt-1 line-clamp-2 text-xs leading-snug text-slate-400">
											{plot.description}
										</p>
									{/if}
								</div>
								<span class="shrink-0 font-mono text-sm font-black text-emerald-300">
									{plot.price ? `${plot.price.toLocaleString()} $` : 'Sur demande'}
								</span>
							</div>
						</div>
					</a>
				</article>
			{/each}
		</div>
	</section>

	<!-- TOUTES LES PARCELLES : disposition "masonry" moderne (aléatoire par carte, stable par id) -->
	<section>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-extrabold text-white">Toutes les parcelles</h2>
			<span class="text-xs text-slate-500">Flux continu</span>
		</div>

		<div class="plots-masonry">
			{#each items as plot, i (plot.id)}
				<article
					class="card plot-card group relative overflow-hidden transition-all hover:border-emerald-400/40 hover:shadow-lg"
				>
					<a href="/plots/{plot.id}" class="block">
						<div class="plot-image-wrap" style="aspect-ratio:{getAspect(plot.id)}">
							{#if plot.images?.[0]}
								<img
									src={plot.images[0].url}
									alt=""
									class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-slate-900 text-xs text-slate-600"
								>
									Photo non disponible
								</div>
							{/if}
						</div>
						<div class="p-3">
							<h3
								class="truncate text-sm font-bold text-white transition-colors group-hover:text-emerald-300"
							>
								{plot.city || 'Parcelle certifiée'}
							</h3>
							<p class="mt-1 flex items-center gap-1 truncate text-[11px] text-slate-400">
								<MapPin size={11} class="shrink-0 text-emerald-400" />{plot.address ||
									plot.country ||
									'RDC'}
							</p>
							{#if isFeatured(plot.id, i) && plot.description}
								<p class="mt-1 line-clamp-2 text-xs leading-snug text-slate-400">
									{plot.description}
								</p>
							{/if}
							<div class="mt-2 flex items-center justify-between">
								<span class="font-mono text-xs font-black text-emerald-300">
									{plot.price ? `${plot.price.toLocaleString()} $` : 'Sur demande'}
								</span>
								<span class="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
									<ShieldCheck size={12} /> Certifiée
								</span>
							</div>
						</div>
					</a>

					<!-- BOUTON FAVORI INDÉPENDANT DU LIEN GLOBAL -->
					<button
						type="button"
						class="icon-btn absolute top-2.5 right-2.5 z-10 cursor-pointer {plot.isFavorite
							? 'text-rose-400'
							: 'text-slate-400 hover:text-white'}"
						onclick={(e) => toggleFavorite(e, plot)}
						aria-label="Ajouter ou retirer des favoris"
					>
						<Heart size={16} fill={plot.isFavorite ? 'currentColor' : 'none'} />
					</button>
				</article>
			{/each}

			{#if loading}
				{#each skeletonAspects as aspect, i (i)}
					<PlotSkeletonCard {aspect} />
				{/each}
			{/if}
		</div>

		{#if !loading && items.length === 0}
			<div class="py-10 text-center text-xs text-slate-500">
				Aucune parcelle ne correspond à votre recherche.
			</div>
		{:else if !loading && !hasMore}
			<div class="py-5 text-center text-xs text-slate-500">
				Vous avez atteint la fin des offres disponibles.
			</div>
		{/if}
	</section>
</div>

<style>
	.searchInput {
		padding-left: 38px;
	}
</style>

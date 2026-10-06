<!-- filepath: src/routes/plots/[id]/+page.svelte -->
<script lang="ts">
	import { 
		MapPin, ShieldCheck, Heart, MessageCircle, 
		ArrowLeft, Ruler, DollarSign, Building2, 
		Briefcase, Phone, CheckCircle2, Share2, FileText
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const plot = $derived(data.plot);

	let selectedImageIdx = $state(0);
	let isFavorite = $derived(data.isFavorited);

	const categoryLabels: Record<string, string> = {
		GROUND: 'Terrain nu',
		HOUSE: 'Maison résidentielle',
		COMPANY: 'Propriété commerciale / Entreprise',
		OTHER: 'Autre bien immobilier'
	};

	const surface = $derived(
		plot.width && plot.height ? plot.width * plot.height : null
	);

	async function toggleFavorite() {
		isFavorite = !isFavorite;
		try {
			await fetch('/api/favorites', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ plotId: plot.id, favorite: isFavorite })
			});
		} catch (err) {
			console.error('Erreur favoris:', err);
		}
	}

	function sharePlot() {
		if (navigator.share) {
			navigator.share({
				title: `Parcelle certifiée à ${plot.city ?? 'Proprios'}`,
				text: `Découvrez cette parcelle certifiée sur Proprios : ${plot.address ?? plot.city}`,
				url: window.location.href
			}).catch(() => {});
		} else {
			navigator.clipboard.writeText(window.location.href);
			alert('Lien copié dans le presse-papier !');
		}
	}
</script>

<svelte:head>
	<title>Parcelle #{plot.id.slice(-6)} — {plot.city ?? 'Proprios'}</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-4 pb-28 space-y-6">
	<!-- BARRE SUPÉRIEURE DE NAVIGATION -->
	<div class="flex items-center justify-between">
		<button
			type="button"
			onclick={() => history.back()}
			class="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95 cursor-pointer"
		>
			<ArrowLeft size={16} /> Retour
		</button>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={sharePlot}
				class="icon-btn text-slate-300 hover:text-white cursor-pointer"
				aria-label="Partager"
			>
				<Share2 size={17} />
			</button>
			<button
				type="button"
				onclick={toggleFavorite}
				class="icon-btn {isFavorite ? 'text-rose-400' : 'text-slate-300 hover:text-white'} cursor-pointer"
				aria-label="Favori"
			>
				<Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
			</button>
		</div>
	</div>

	<!-- GALERIE PHOTOS HAUT DE GAMME -->
	<div class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-2xl">
		<div class="relative h-72 sm:h-96 w-full overflow-hidden bg-slate-900">
			{#if plot.images && plot.images.length > 0}
				<img
					src={plot.images[selectedImageIdx]?.url}
					alt="Parcelle"
					class="h-full w-full object-cover transition-all duration-300"
				/>
			{:else}
				<div class="flex h-full w-full flex-col items-center justify-center text-slate-500">
					<Building2 size={48} class="opacity-30 mb-2 text-emerald-400" />
					<p class="text-xs">Aucune photo fournie pour cette parcelle</p>
				</div>
			{/if}

			<!-- BADGE CERTIFICATION FLOTTANT -->
			<div class="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-emerald-400 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-400/25">
				<ShieldCheck size={16} />
				<span>PARCELLE 100% CERTIFIÉE</span>
			</div>

			<!-- PRIX FLOTTANT -->
			{#if plot.price}
				<div class="absolute bottom-4 right-4 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/15 px-4 py-2 text-right shadow-xl">
					<span class="text-[10px] uppercase font-bold text-slate-400 block">Prix de vente</span>
					<span class="text-xl font-black text-emerald-300 font-mono">
						{plot.price.toLocaleString()} <span class="text-xs text-white">USD</span>
					</span>
				</div>
			{/if}
		</div>

		<!-- MINIATURES -->
		{#if plot.images && plot.images.length > 1}
			<div class="flex gap-2.5 p-3 overflow-x-auto bg-black/40 border-t border-white/5">
				{#each plot.images as img, idx (img.id)}
					<button
						type="button"
						onclick={() => selectedImageIdx = idx}
						class="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer {selectedImageIdx === idx ? 'border-emerald-400 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}"
					>
						<img src={img.url} alt="" class="h-full w-full object-cover" />
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- INFORMATIONS PRINCIPALES -->
	<div class="grid gap-6 md:grid-cols-3">
		<!-- COLONNE GAUCHE : DÉTAILS -->
		<div class="md:col-span-2 space-y-6">
			<!-- CARTE TITRE & LOCALISATION -->
			<section class="card p-6 space-y-4">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div>
						<span class="text-xs font-bold uppercase tracking-wider text-emerald-400">
							{categoryLabels[plot.categoryId] ?? 'Propriété immobilière'}
						</span>
						<h1 class="text-2xl sm:text-3xl font-black text-white mt-1">
							{plot.city || 'Parcelle de terrain'}
						</h1>
						<p class="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
							<MapPin size={16} class="text-emerald-400 shrink-0" />
							{plot.address ? `${plot.address}, ${plot.city ?? ''}` : (plot.country ?? 'République Démocratique du Congo')}
						</p>
					</div>

					<div class="flex items-center gap-2">
						<span class="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-300">
							Réf #{plot.id.slice(-6).toUpperCase()}
						</span>
					</div>
				</div>

				<!-- GRILLE DES CARACTÉRISTIQUES CLÉS -->
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-white/5">
					<div class="rounded-2xl bg-white/5 p-3.5 border border-white/5">
						<div class="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
							<Ruler size={14} class="text-emerald-400" /> Dimensions
						</div>
						<b class="text-base font-bold text-white">
							{plot.width ?? '—'} × {plot.height ?? '—'} m
						</b>
					</div>

					<div class="rounded-2xl bg-white/5 p-3.5 border border-white/5">
						<div class="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
							<Building2 size={14} class="text-emerald-400" /> Superficie
						</div>
						<b class="text-base font-bold text-white">
							{surface ? `${surface.toLocaleString()} m²` : 'Non précisée'}
						</b>
					</div>

					<div class="rounded-2xl bg-white/5 p-3.5 border border-white/5 col-span-2 sm:col-span-1">
						<div class="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
							<DollarSign size={14} class="text-emerald-400" /> Disponibilité
						</div>
						<b class="text-sm font-bold {plot.canSell ? 'text-emerald-300' : 'text-amber-300'}">
							{plot.canSell ? 'Disponible à la vente' : 'Patrimoine privé'}
						</b>
					</div>
				</div>
			</section>

			<!-- DESCRIPTION DE LA PARCELLE -->
			{#if plot.description}
				<section class="card p-6 space-y-3">
					<h2 class="text-base font-bold text-white flex items-center gap-2">
						<FileText size={18} class="text-emerald-400" /> Description & Notes
					</h2>
					<p class="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
						{plot.description}
					</p>
				</section>
			{/if}

			<!-- CARTE GARANTIES JURIDIQUES & CERTIFICATION -->
			<section class="card p-6 space-y-4 border-emerald-500/20 bg-linear-to-br from-emerald-950/20 to-slate-900/60">
				<div class="flex items-center gap-3">
					<div class="grid size-10 place-items-center rounded-2xl bg-emerald-400/20 text-emerald-300">
						<ShieldCheck size={22} />
					</div>
					<div>
						<h2 class="text-lg font-black text-white">Certification & Sécurité Proprios</h2>
						<p class="text-xs text-slate-400">Cette parcelle a suivi le protocole complet de vérification foncière.</p>
					</div>
				</div>

				<div class="grid gap-2.5 sm:grid-cols-2 text-xs pt-2">
					<div class="flex items-center gap-2 rounded-xl bg-black/20 p-2.5 border border-white/5">
						<CheckCircle2 size={15} class="text-emerald-400 shrink-0" />
						<span class="text-slate-300">Titres de propriété vérifiés</span>
					</div>
					<div class="flex items-center gap-2 rounded-xl bg-black/20 p-2.5 border border-white/5">
						<CheckCircle2 size={15} class="text-emerald-400 shrink-0" />
						<span class="text-slate-300">Bornage physique validé</span>
					</div>
					<div class="flex items-center gap-2 rounded-xl bg-black/20 p-2.5 border border-white/5">
						<CheckCircle2 size={15} class="text-emerald-400 shrink-0" />
						<span class="text-slate-300">Absence de litige cadastral</span>
					</div>
					<div class="flex items-center gap-2 rounded-xl bg-black/20 p-2.5 border border-white/5">
						<CheckCircle2 size={15} class="text-emerald-400 shrink-0" />
						<span class="text-slate-300">Accompagnement notarié garanti</span>
					</div>
				</div>
			</section>
		</div>

		<!-- COLONNE DROITE : AVOCAT & ACTION -->
		<div class="space-y-6">
			<!-- AVOCAT ASSIGNÉ -->
			{#if plot.lawyer}
				<section class="card p-5 space-y-3 bg-blue-950/20 border-blue-500/20">
					<div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
						<Briefcase size={15} /> Avocat Référent
					</div>
					<div class="flex items-center gap-3 pt-1">
						<div class="grid size-11 place-items-center rounded-2xl bg-blue-500/20 text-blue-300 font-bold text-sm">
							{plot.lawyer.name?.slice(0, 2).toUpperCase() || 'AV'}
						</div>
						<div>
							<h3 class="font-bold text-white text-sm">{plot.lawyer.name}</h3>
							<p class="text-xs text-slate-400">Cabinet juridique agréé</p>
						</div>
					</div>
					{#if plot.lawyer.telephone}
						<div class="pt-2">
							<a
								href="tel:{plot.lawyer.telephone}"
								class="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-500/15 border border-blue-500/30 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/25 transition-all"
							>
								<Phone size={14} /> Contacter : {plot.lawyer.telephone}
							</a>
						</div>
					{/if}
				</section>
			{/if}

			<!-- ACTION CHAT RAPIDE -->
			<div class="card p-5 space-y-3 bg-emerald-950/20 border-emerald-500/30 text-center">
				<h3 class="font-bold text-white text-sm">Une question sur ce bien ?</h3>
				<p class="text-xs text-slate-400">Échangez directement avec nos conseillers avec la référence de cette parcelle.</p>
				<button
					type="button"
					onclick={() => goto(`/chat?plotId=${plot.id}`)}
					class="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-xs font-black text-slate-950 hover:bg-emerald-300 shadow-lg shadow-emerald-400/20 transition-all active:scale-95 cursor-pointer"
				>
					<MessageCircle size={16} /> Discuter dans le chat
				</button>
			</div>
		</div>
	</div>
</div>

<!-- BARRE D'ACTION FIXE BAS DE PAGE -->
<div class="fixed bottom-0 inset-x-0 z-40 p-3 bg-slate-950/90 backdrop-blur-xl border-t border-white/10">
	<div class="mx-auto flex max-w-3xl items-center justify-between gap-3">
		<div>
			<span class="text-[10px] uppercase font-bold text-slate-400 block">Parcelle #{plot.id.slice(-6)}</span>
			<span class="text-base font-black text-emerald-300 font-mono">
				{plot.price ? `${plot.price.toLocaleString()} $` : 'Prix sur demande'}
			</span>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={toggleFavorite}
				class="icon-btn {isFavorite ? 'text-rose-400' : 'text-slate-300 hover:text-white'} cursor-pointer"
			>
				<Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
			</button>

			<button
				type="button"
				onclick={() => goto(`/chat?plotId=${plot.id}`)}
				class="flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-400/25 hover:bg-emerald-300 active:scale-95 transition-all cursor-pointer"
			>
				<MessageCircle size={16} /> Poser une question
			</button>
		</div>
	</div>
</div>
<!-- filepath: src/routes/owner/+page.svelte -->
<script lang="ts">
	import {
		Plus,
		Lock,
		Heart,
		MapPin,
		Pencil,
		Loader2,
		Image as ImageIcon,
		Briefcase,
		Phone,
		AlertCircle,
		ShieldCheck,
		FileText,
		ArrowRight,
		UploadCloud,
		Calendar,
		Tag
	} from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	interface LawyerInfo {
		name: string;
		telephone: string | null;
	}

	interface ImageInfo {
		id: string;
		url: string;
		publicId?: string;
	}

	interface DocumentInfo {
		id: string;
		url: string;
		publicId?: string;
		name?: string | null;
	}

	interface OwnerVisit {
		id: string;
		date: string | Date | null;
		type: 'CERTIFICATION' | 'FORCLIENT';
		isCompleted: boolean;
		isCancelled: boolean;
	}

	interface OwnerPlot {
		id: string;
		categoryId: string;
		description?: string | null;
		proprioId: string;
		width: number | null;
		height: number | null;
		country: string | null;
		city: string | null;
		address: string | null;
		certificationStatus: 'ATTENTE' | 'EN_COURS' | 'CERTIFIE' | 'REJETE';
		certified: boolean;
		certifStep: number;
		price: number | null;
		canSell: boolean;
		images: ImageInfo[];
		documents?: DocumentInfo[];
		lawyer?: LawyerInfo | null;
		visits?: OwnerVisit[];
	}

	interface OwnerFavorite {
		id: string;
		city: string | null;
		address: string | null;
		images?: ImageInfo[];
	}

	interface OwnerDataResult {
		plots: OwnerPlot[];
		favorites: OwnerFavorite[];
	}

	type PageProps = {
		data: PageData & {
			ownerData: Promise<OwnerDataResult>;
			userCertified: boolean;
		};
		form: ActionData;
	};

	let { data, form }: PageProps = $props();

	let open = $state(false);
	let editing = $state<OwnerPlot | null>(null);
	let isSubmitting = $state(false);

	const statusLabel: Record<string, string> = {
		ATTENTE: 'En attente',
		EN_COURS: 'En cours',
		CERTIFIE: 'Certifiée',
		REJETE: 'Rejetée'
	};

	const statusClass: Record<string, string> = {
		ATTENTE: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
		EN_COURS: 'text-sky-300 bg-sky-400/10 border-sky-400/20',
		CERTIFIE: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
		REJETE: 'text-rose-300 bg-rose-400/10 border-rose-400/20'
	};

	function openAddModal() {
		editing = null;
		open = true;
	}

	function formatVisitDate(date: string | Date | null): string {
		if (!date) return 'date en cours de planification';
		const d = new Date(date);
		const day = d.toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
		const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
		return `${day} à ${time}`;
	}
</script>

<svelte:head>
	<title>Mes parcelles — Proprios</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-5 pb-28">
	<!-- HEADER AVEC BOUTON AJOUTER -->
	<div class="flex items-end justify-between pt-3">
		<div>
			<p class="text-sm font-semibold text-emerald-300">Espace propriétaire</p>
			<h1 class="text-3xl font-black text-white">Mes parcelles</h1>
		</div>
		<button
			type="button"
			class="btn-primary hidden cursor-pointer items-center gap-2 shadow-lg shadow-emerald-400/20 sm:flex"
			onclick={openAddModal}
		>
			<Plus size={18} /> Déclarer une parcelle
		</button>
	</div>

	{#if form?.message}
		<div
			class="mt-4 rounded-2xl {form.success
				? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
				: 'border border-red-400/20 bg-red-400/10 text-red-200'} p-3 text-sm font-medium"
		>
			{form.message}
		</div>
	{/if}

	<!-- STREAMING DES PARCELLES -->
	{#await data.ownerData}
		<div class="mt-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
			<Loader2 size={32} class="animate-spin text-emerald-400" />
			<p class="text-sm">Chargement de vos parcelles...</p>
		</div>
	{:then ownerData}
		<section class="mt-6 space-y-3">
			{#if ownerData.plots.length === 0}
				<div
					class="space-y-3 rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400"
				>
					<p>Vous n'avez pas encore déclaré de parcelle dans votre portefeuille foncier.</p>
					<button
						type="button"
						class="btn-primary inline-flex cursor-pointer items-center gap-2"
						onclick={openAddModal}
					>
						<Plus size={16} /> Déclarer ma première parcelle
					</button>
				</div>
			{/if}

			{#each ownerData.plots as plot (plot.id)}
				{@const isCertifie = plot.certificationStatus === 'CERTIFIE'}

				<article
					class="card p-4 transition-all duration-200 {isCertifie
						? 'hover:border-emerald-400/50 hover:shadow-xl'
						: ''}"
				>
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<h2 class="truncate text-base font-bold text-white">{plot.city || 'Parcelle'}</h2>
								<span
									class="rounded-lg border px-2 py-0.5 text-xs font-bold {statusClass[
										plot.certificationStatus
									] || 'text-slate-300'}"
								>
									{statusLabel[plot.certificationStatus] || plot.certificationStatus}
								</span>
							</div>
							<p class="mt-1 flex items-center gap-1 text-xs text-slate-400">
								<MapPin size={13} class="shrink-0 text-emerald-400" />{plot.address ||
									'Adresse non renseignée'}
							</p>
							{#if plot.lawyer}
								<div
									class="mt-2.5 flex w-max max-w-full flex-col gap-1 rounded-xl border border-blue-500/20 bg-blue-500/10 p-2.5 text-xs text-blue-300"
								>
									<strong class="flex items-center gap-1.5 font-bold">
										<Briefcase size={13} /> Avocat assigné :
									</strong>
									<span class="flex items-center gap-1.5 truncate text-slate-200">
										<Phone size={12} />
										{plot.lawyer.name} ({plot.lawyer.telephone || 'Non renseigné'})
									</span>
								</div>
							{/if}
						</div>

						<div class="flex shrink-0 items-center gap-2">
							{#if isCertifie}
								<a
									href="/plots/{plot.id}"
									class="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-400/20"
								>
									<ShieldCheck size={15} /> Voir la fiche <ArrowRight size={13} />
								</a>
							{:else if plot.certificationStatus === 'ATTENTE' || plot.certificationStatus === 'EN_COURS'}
								<div
									class="p-2 text-slate-500"
									title="Modification verrouillée durant l'instruction"
								>
									<Lock size={18} />
								</div>
							{:else}
								<button
									type="button"
									class="icon-btn cursor-pointer text-slate-300 hover:text-white"
									onclick={() => {
										editing = plot;
										open = true;
									}}
									aria-label="Modifier"
								>
									<Pencil size={16} />
								</button>
							{/if}
						</div>
					</div>

					<div class="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/5">
						<div
							class="h-full bg-emerald-300 transition-all duration-500"
							style={`width:${plot.certifStep >= 4 || isCertifie ? 100 : Math.max(25, plot.certifStep * 25)}%`}
						></div>
					</div>

					<!-- VISITE DE CERTIFICATION -->
					{#if plot.visits && plot.visits.length > 0}
						{@const visit = plot.visits[0]}
						<div
							class="mt-3 flex flex-col gap-1 rounded-xl border p-2.5 text-xs {visit.isCancelled
								? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
								: visit.isCompleted
									? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
									: 'border-purple-500/20 bg-purple-500/10 text-purple-300'}"
						>
							<strong class="flex items-center gap-1.5 font-bold">
								<Calendar size={13} /> Visite de certification
							</strong>
							{#if visit.isCancelled}
								<span>Visite annulée par l'administration</span>
							{:else if visit.isCompleted}
								<span>Visite effectuée le {formatVisitDate(visit.date)}</span>
							{:else if visit.date}
								<span class="text-slate-200">{formatVisitDate(visit.date)}</span>
								<span class="opacity-80">Visite planifiée</span>
							{:else}
								<span>Date en cours de planification</span>
							{/if}
						</div>
					{:else if !isCertifie}
						<div
							class="mt-3 flex items-center gap-1.5 rounded-xl border border-slate-500/20 bg-slate-500/10 p-2.5 text-xs text-slate-400"
						>
							<Calendar size={13} /> Aucune visite de certification planifiée.
						</div>
					{/if}

					<!-- BASCULE VENTE / HORS VENTE -->
					{#if isCertifie}
						<div
							class="mt-3 flex items-center justify-between gap-3 rounded-xl border p-3 {plot.canSell
								? 'border-emerald-400/30 bg-emerald-400/10'
								: 'border-white/10 bg-white/5'}"
						>
							<div class="flex items-center gap-2 text-xs">
								<Tag size={14} class={plot.canSell ? 'text-emerald-300' : 'text-slate-400'} />
								<span class="font-bold {plot.canSell ? 'text-emerald-300' : 'text-slate-400'}">
									{plot.canSell ? 'En vente' : 'Hors vente'}
								</span>
							</div>
							<form method="POST" action="?/toggleSaleStatus" use:enhance>
								<input type="hidden" name="plotId" value={plot.id} />
								<button
									type="submit"
									class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-colors {plot.canSell
										? 'bg-slate-700 text-white hover:bg-slate-600'
										: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'}"
								>
									{plot.canSell ? 'Retirer de la vente' : 'Mettre en vente'}
								</button>
							</form>
						</div>
					{:else}
						<div
							class="mt-3 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400"
						>
							<Lock size={13} />
							La mise en vente sera disponible après certification de la parcelle.
						</div>
					{/if}
				</article>
			{/each}
		</section>

		<section class="mt-8">
			<h2 class="mb-3 text-lg font-extrabold text-white">Mes favoris</h2>
			{#if ownerData.favorites.length === 0}
				<div class="rounded-2xl bg-white/5 p-4 text-xs text-slate-400">
					Aucune parcelle enregistrée dans vos favoris.
				</div>
			{:else}
				<div class="grid gap-3 sm:grid-cols-2">
					{#each ownerData.favorites as favPlot (favPlot.id)}
						<article class="card p-4">
							<div class="flex items-center justify-between">
								<div>
									<b class="text-sm text-white">{favPlot.city || 'Parcelle'}</b>
									<p class="text-xs text-slate-500">{favPlot.address || 'RDC'}</p>
								</div>
								<div class="flex items-center gap-2">
									<a
										href="/plots/{favPlot.id}"
										class="icon-btn text-slate-400 hover:text-white"
										title="Consulter"
										aria-label="Consulter la parcelle"
									>
										<ArrowRight size={16} />
									</a>
									<button
										type="button"
										class="icon-btn cursor-pointer text-rose-400"
										aria-label="Retirer des favoris"
										onclick={async () => {
											await fetch('/api/favorites', {
												method: 'POST',
												headers: { 'content-type': 'application/json' },
												body: JSON.stringify({ plotId: favPlot.id, favorite: false })
											});
											location.reload();
										}}
									>
										<Heart size={16} fill="currentColor" />
									</button>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</section>
	{:catch error}
		<div
			class="mt-8 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
		>
			<AlertCircle size={18} /> Impossible de charger vos données ({error.message}).
		</div>
	{/await}
</div>

<!-- BOUTON FLOTTANT (+) EN BAS À DROITE -->
<button
	type="button"
	onclick={openAddModal}
	class="fixed right-5 bottom-24 z-40 grid size-14 cursor-pointer place-items-center rounded-full bg-emerald-400 text-slate-950 shadow-2xl shadow-emerald-400/50 transition-all duration-300 hover:scale-110 hover:bg-emerald-300 focus:ring-4 focus:ring-emerald-400/30 focus:outline-none active:scale-95"
	aria-label="Ajouter une parcelle"
	title="Ajouter une nouvelle parcelle"
>
	<Plus size={28} strokeWidth={2.5} />
</button>

<!-- MODAL FORMULAIRE AVEC FEEDBACK DE CHARGEMENT -->
{#if open}
	<div
		class="fixed inset-0 z-60 grid place-items-end bg-black/70 p-3 backdrop-blur-sm sm:place-items-center"
	>
		<form
			method="POST"
			action={editing ? '?/update' : '?/create'}
			enctype="multipart/form-data"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					try {
						await update();
					} finally {
						isSubmitting = false;
						open = false;
					}
				};
			}}
			class="glass relative max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-white/10 p-6 shadow-2xl"
		>
			<!-- OVERLAY DE CHARGEMENT PENDANT L'UPLOAD -->
			{#if isSubmitting}
				<div
					class="absolute inset-0 z-50 flex flex-col items-center justify-center space-y-4 bg-slate-950/80 p-6 text-center backdrop-blur-xs"
				>
					<div class="relative">
						<div
							class="size-16 animate-spin rounded-full border-4 border-emerald-400/20 border-t-emerald-400"
						></div>
						<UploadCloud size={24} class="absolute inset-0 m-auto animate-pulse text-emerald-400" />
					</div>
					<div>
						<h3 class="text-base font-bold text-white">Téléversement en cours...</h3>
						<p class="mt-1 max-w-xs text-xs text-slate-400">
							Vos photos et documents justificatifs sont en cours d'envoi vers nos serveurs
							sécurisés. Veuillez patienter.
						</p>
					</div>
				</div>
			{/if}

			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-xl font-black text-white">
						{editing ? 'Modifier la parcelle' : 'Déclarer une nouvelle parcelle'}
					</h2>
					<p class="mt-0.5 text-xs text-slate-400">
						Le dossier sera instruit par notre équipe d’experts cadastraux.
					</p>
				</div>
				<button
					type="button"
					disabled={isSubmitting}
					class="icon-btn cursor-pointer text-slate-400 hover:text-white disabled:opacity-40"
					onclick={() => (open = false)}
					aria-label="Fermer"
				>
					✕
				</button>
			</div>

			{#if editing}
				<input type="hidden" name="plotId" value={editing.id} />
			{/if}

			<fieldset disabled={isSubmitting} class="space-y-3">
				<div>
					<label for="categoryId" class="mb-1 block text-xs font-bold text-slate-400"
						>Catégorie du bien</label
					>
					<select
						id="categoryId"
						class="input"
						name="categoryId"
						value={editing?.categoryId ?? 'GROUND'}
					>
						<option value="GROUND">Terrain nu</option>
						<option value="HOUSE">Maison d'habitation</option>
						<option value="COMPANY">Bâtiment commercial / Entreprise</option>
						<option value="OTHER">Autre</option>
					</select>
				</div>

				<!-- UPLOAD DES PHOTOS -->
				<div class="space-y-1.5 rounded-2xl border border-white/10 bg-white/5 p-3.5">
					<label
						for="plot-images"
						class="flex items-center gap-1.5 text-xs font-bold text-slate-300"
					>
						<ImageIcon size={15} class="text-emerald-400" /> Photos de la parcelle
					</label>
					<input
						id="plot-images"
						type="file"
						name="images"
						multiple
						accept="image/*"
						class="w-full cursor-pointer text-xs text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-400 file:px-4 file:py-2 file:text-xs file:font-bold file:text-slate-950 hover:file:bg-emerald-300"
					/>
				</div>

				<!-- UPLOAD DES DOCUMENTS (TITRES, CONTRATS, ETC.) -->
				<div class="space-y-1.5 rounded-2xl border border-white/10 bg-white/5 p-3.5">
					<label
						for="plot-documents"
						class="flex items-center gap-1.5 text-xs font-bold text-slate-300"
					>
						<FileText size={15} class="text-emerald-400" /> Documents justificatifs (Titres de propriété,
						plans, etc.)
					</label>
					<input
						id="plot-documents"
						type="file"
						name="documents"
						multiple
						accept=".pdf,.doc,.docx,image/*,application/pdf"
						class="w-full cursor-pointer text-xs text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-400 file:px-4 file:py-2 file:text-xs file:font-bold file:text-slate-950 hover:file:bg-emerald-300"
					/>
					<p class="text-[11px] text-slate-400">
						Formats acceptés : PDF, Word, Photos de documents
					</p>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="width" class="mb-1 block text-xs font-bold text-slate-400"
							>Largeur (m)</label
						>
						<input
							id="width"
							class="input"
							name="width"
							type="number"
							placeholder="Ex: 20"
							value={editing?.width ?? ''}
						/>
					</div>
					<div>
						<label for="height" class="mb-1 block text-xs font-bold text-slate-400"
							>Longueur (m)</label
						>
						<input
							id="height"
							class="input"
							name="height"
							type="number"
							placeholder="Ex: 30"
							value={editing?.height ?? ''}
						/>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="price" class="mb-1 block text-xs font-bold text-slate-400"
							>Prix estimé (USD)</label
						>
						<input
							id="price"
							class="input"
							name="price"
							type="number"
							placeholder="Prix en USD"
							value={editing?.price ?? ''}
						/>
					</div>
					<div>
						<label for="city" class="mb-1 block text-xs font-bold text-slate-400">Ville</label>
						<input
							id="city"
							class="input"
							name="city"
							placeholder="Ex: Kinshasa"
							value={editing?.city ?? ''}
						/>
					</div>
				</div>

				<div>
					<label for="address" class="mb-1 block text-xs font-bold text-slate-400"
						>Adresse ou Repère cadastral</label
					>
					<input
						id="address"
						class="input"
						name="address"
						placeholder="Avenue, Quartier, Numéro parcellaire..."
						value={editing?.address ?? ''}
					/>
				</div>

				<!-- CHAMP DESCRIPTION -->
				<div>
					<label
						for="description"
						class="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-400"
					>
						<FileText size={14} class="text-emerald-400" /> Description & Notes complémentaires
					</label>
					<textarea
						id="description"
						name="description"
						rows={3}
						placeholder="Détails sur l'accessibilité, l'historique du terrain, documents en votre possession..."
						class="input resize-none text-xs text-white"
						value={editing?.description ?? ''}
					></textarea>
				</div>

				{#if !editing && data.userCertified}
					<label
						class="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3.5 text-xs font-medium text-slate-300"
					>
						<input
							type="checkbox"
							name="canSell"
							class="size-4 rounded text-emerald-400 focus:ring-emerald-400"
						/>
						Je souhaite proposer cette parcelle à la vente (après certification).
					</label>
				{:else if !editing}
					<div class="rounded-2xl border border-white/5 bg-white/5 p-3.5 text-xs text-slate-400">
						La publication à la vente sera disponible une fois votre compte certifié.
					</div>
				{/if}
			</fieldset>

			<!-- BOUTON DE SOUMISSION AVEC INDICATEUR DE CHARGEMENT -->
			<button
				type="submit"
				disabled={isSubmitting}
				class="btn-primary mt-2 flex w-full cursor-pointer items-center justify-center gap-2 shadow-lg shadow-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{#if isSubmitting}
					<Loader2 size={18} class="animate-spin text-slate-950" />
					<span>Traitement et enregistrement...</span>
				{:else}
					<span>{editing ? 'Enregistrer les modifications' : 'Envoyer à la certification'}</span>
				{/if}
			</button>
		</form>
	</div>
{/if}-

<style>
	select {
		background-color: #070b14;
	}
</style>

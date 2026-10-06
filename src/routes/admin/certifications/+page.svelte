<!-- filepath: src/routes/admin/certifications/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/admin/ui/Card.svelte';
	import Badge from '$lib/components/admin/ui/Badge.svelte';
	import { 
		Search, 
		FileText, 
		CheckCircle, 
		Image as ImageIcon, 
		MapPin, 
		Calendar, 
		FileBadge, 
		AlertTriangle, 
		ChevronRight, 
		X, 
		Briefcase,
		ExternalLink
	} from '@lucide/svelte';
	import type { PageData, ActionData } from './$types';

	interface DocumentData {
		id: string;
		url: string;
		name: string | null;
		publicId: string;
	}

	interface ImageData {
		id: string;
		url: string;
		publicId: string;
	}

	interface VisitData {
		id: string;
		date: Date | null;
		isCompleted: boolean;
	}

	interface PlotData {
		id: string;
		proprioId: string;
		certified: boolean;
		certifStep: number;
		address: string | null;
		city: string | null;
		description: string | null;
		proprio: {
			id: string;
			name: string;
			telephone: string | null;
			cardID: string | null;
			typeID: string | null;
			certified: boolean;
		};
		images: ImageData[];
		documents: DocumentData[];
		visits: VisitData[];
	}

	type CertifFilter = 'ALL' | 'DOCS' | 'VISIT' | 'FINAL';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let activeFilter = $state<CertifFilter>('ALL');
	let searchQuery = $state('');
	let selectedPlotId = $state<string | null>(null);
	
	let showVisitModal = $state(false);
	let visitDateInput = $state('');
	let selectedLawyerId = $state('');
	
	const FILTERS: CertifFilter[] = ['ALL', 'DOCS', 'VISIT', 'FINAL'];

	const getMinDateTime = () => {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	};

	let filteredPlots = $derived(
		(data.pendingPlots as unknown as PlotData[]).filter((plot) => {
			const matchSearch = 
				plot.proprio.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
				plot.id.toLowerCase().includes(searchQuery.toLowerCase());
							
			if (activeFilter === 'DOCS') return matchSearch && plot.certifStep <= 1;
			if (activeFilter === 'VISIT') return matchSearch && plot.certifStep === 2;
			if (activeFilter === 'FINAL') return matchSearch && plot.certifStep === 3;
			return matchSearch;
		})
	);

	let activePlot = $derived(filteredPlots.find((p) => p.id === selectedPlotId));

	let hasValidVisit = $derived(
		Boolean(activePlot?.visits && activePlot.visits.length > 0 && activePlot.visits[0].date !== null)
	);

	let canAdvanceStep = $derived(() => {
		if (!activePlot) return false;
		if (activePlot.certifStep === 2) {
			return hasValidVisit && selectedLawyerId.trim().length > 0;
		}
		return true;
	});

	const getStepLabel = (step: number) => {
		switch (step) {
			case 0: return 'Dossier Reçu';
			case 1: return 'Vérification Docs';
			case 2: return 'Visite Terrain';
			case 3: return 'Validation Légale';
			case 4: return 'Certifié';
			default: return 'Inconnu';
		}
	};

	$effect(() => {
		if (form?.success) {
			showVisitModal = false;
			selectedLawyerId = '';
			visitDateInput = '';
		}
	});
</script>

{#if data.currentUser}
	<div class="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden relative">
		
		<!-- COLONNE 1 : LISTE DES DOSSIERS -->
		<Card class="w-87.5 flex flex-col shrink-0 bg-proprios-dark/50">
			<div class="p-4 border-b border-white/5 space-y-4">
				<div>
					<h2 class="text-lg font-bold text-white mb-1">Dossiers en attente</h2>
					<p class="text-xs text-slate-400">{filteredPlots.length} parcelles à vérifier</p>
				</div>

				<div class="relative">
					<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
					<input 
						bind:value={searchQuery}
						type="text" 
						placeholder="Rechercher (Client ou ID)..." 
						class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-proprios-mint/50 transition-colors"
					/>
				</div>

				<div class="flex gap-1 bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar">
					{#each FILTERS as filter (filter)}
						<button 
							type="button"
							onclick={() => activeFilter = filter}
							class="px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap transition-all {activeFilter === filter ? 'bg-proprios-card text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}">
							{filter === 'ALL' ? 'Tous' : filter === 'DOCS' ? 'Documents' : filter === 'VISIT' ? 'Terrain' : 'Final'}
						</button>
					{/each}
				</div>
			</div>

			<div class="flex-1 overflow-y-auto p-2 space-y-2">
				{#each filteredPlots as plot (plot.id)}
					<button 
						type="button"
						onclick={() => selectedPlotId = plot.id}
						class="w-full text-left p-3 rounded-xl transition-all flex flex-col gap-2 group border {selectedPlotId === plot.id ? 'bg-proprios-mint/10 border-proprios-mint/20' : 'hover:bg-white/5 border-white/5 bg-white/2'}">
						
						<div class="flex justify-between items-start w-full">
							<div>
								<span class="text-sm font-bold text-white block">{plot.proprio.name}</span>
								<span class="text-[10px] text-slate-400 font-mono block mt-0.5">#{plot.id.slice(-6).toUpperCase()}</span>
							</div>
							<Badge variant={plot.certifStep >= 3 ? 'success' : plot.certifStep === 2 ? 'warning' : 'default'}>
								Étape {plot.certifStep}
							</Badge>
						</div>
						
						<div class="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
							<MapPin size={12} class={selectedPlotId === plot.id ? 'text-proprios-mint' : ''} />
							<span class="truncate">{plot.city || 'Non spécifié'} - {plot.address || 'Adresse introuvable'}</span>
						</div>
					</button>
				{/each}
				
				{#if filteredPlots.length === 0}
					<div class="p-8 text-center flex flex-col items-center justify-center text-slate-500 gap-3">
						<CheckCircle size={32} class="opacity-30" />
						<p class="text-sm">Aucun dossier dans cette catégorie.</p>
					</div>
				{/if}
			</div>
		</Card>

		<!-- COLONNE 2 : BUREAU D'EXAMEN -->
		<Card class="flex-1 flex flex-col min-w-0 bg-proprios-card relative overflow-hidden">
			{#if !activePlot}
				<div class="flex-1 flex flex-col items-center justify-center text-slate-500">
					<FileBadge size={64} class="mb-4 opacity-20" />
					<h3 class="text-lg font-medium text-white mb-2">Bureau de Certification</h3>
					<p class="text-sm">Sélectionnez un dossier à gauche pour l'examiner et le valider.</p>
				</div>
			{:else}
				
				<!-- HEADER DOSSIER -->
				<div class="p-6 border-b border-white/5 flex items-center justify-between bg-linear-to-r from-proprios-dark/50 to-transparent">
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 bg-proprios-mint/10 text-proprios-mint rounded-xl flex items-center justify-center border border-proprios-mint/20">
							<FileBadge size={24} />
						</div>
						<div>
							<h2 class="text-xl font-bold text-white flex items-center gap-2">
								Dossier Parcelle <span class="text-proprios-mint font-mono">#{activePlot.id.slice(-6).toUpperCase()}</span>
							</h2>
							<p class="text-sm text-slate-400 flex items-center gap-2 mt-1">
								Soumis par <span class="font-medium text-slate-200">{activePlot.proprio.name}</span>
								{#if activePlot.proprio.certified}
									<Badge variant="success">Propriétaire Vérifié</Badge>
								{:else}
									<Badge variant="warning">Identité à vérifier</Badge>
								{/if}
							</p>
						</div>
					</div>
				</div>

				<!-- WORKSPACE -->
				<div class="flex-1 overflow-y-auto p-6 flex gap-6">
					
					<!-- Section Gauche : Infos & Fichiers -->
					<div class="relative flex-1 space-y-6">
						
						<!-- STEPPER -->
						<div class="bg-white/5 border border-white/10 rounded-2xl p-5">
							<h3 class="text-sm font-bold text-white mb-4 uppercase tracking-wider">État d'avancement</h3>
							<div class="flex items-center justify-between relative">
								<div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-white/10 z-0"></div>
								
								{#each [0, 1, 2, 3] as step (step)}
									{@const isCompleted = (activePlot?.certifStep ?? 0) > step}
									{@const isCurrent = (activePlot?.certifStep ?? 0) === step}
									<div class="relative z-10 flex flex-col items-center gap-2">
										<div class="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors {isCompleted ? 'bg-proprios-mint border-proprios-mint text-proprios-dark' : isCurrent ? 'bg-proprios-dark border-proprios-mint text-proprios-mint shadow-[0_0_15px_rgba(2,225,177,0.3)]' : 'bg-proprios-dark border-white/20 text-slate-500'}">
											{#if isCompleted}
												<CheckCircle size={16} strokeWidth={3} />
											{:else}
												<span class="text-xs font-bold">{step + 1}</span>
											{/if}
										</div>
										<span class="text-[10px] font-medium {isCurrent ? 'text-proprios-mint' : isCompleted ? 'text-white' : 'text-slate-500'}">
											{getStepLabel(step)}
										</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- DESCRIPTION FOURNIE -->
						{#if activePlot.description}
							<div class="bg-white/5 border border-white/10 rounded-2xl p-4">
								<h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
									<FileText size={14} class="text-proprios-mint" /> Description & Déclaration du propriétaire
								</h3>
								<p class="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
									{activePlot.description}
								</p>
							</div>
						{/if}

						<!-- DOCUMENTS LÉGAUX -->
						<div>
							<h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
								<FileText size={16} class="text-proprios-mint" /> Documents justificatifs fournis ({activePlot.documents.length})
							</h3>
							{#if activePlot.documents.length > 0}
								<div class="grid grid-cols-2 gap-3">
									{#each activePlot.documents as doc (doc.id)}
										<a 
											href={doc.url} 
											target="_blank" 
											rel="noopener noreferrer" 
											class="p-3 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3 hover:bg-white/10 hover:border-proprios-mint/30 transition-all group"
											title="Cliquer pour ouvrir le document dans un nouvel onglet"
										>
											<div class="w-10 h-10 bg-red-500/10 text-red-400 rounded-lg flex items-center justify-center shrink-0">
												<FileText size={20} />
											</div>
											<div class="overflow-hidden flex-1">
												<div class="flex items-center justify-between gap-1">
													<p class="text-sm text-white font-medium truncate group-hover:text-proprios-mint transition-colors">
														{doc.name || 'Document_Justificatif.pdf'}
													</p>
													<ExternalLink size={13} class="text-slate-500 group-hover:text-proprios-mint shrink-0" />
												</div>
												<p class="text-[10px] text-slate-500 mt-0.5">Ouvrir le fichier</p>
											</div>
										</a>
									{/each}
								</div>
							{:else}
								<div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-500/80 text-sm">
									<AlertTriangle size={18} /> Le client n'a encore fourni aucun document.
								</div>
							{/if}
						</div>

						<!-- PHOTOS TERRAIN -->
						<div>
							<h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
								<ImageIcon size={16} class="text-proprios-mint" /> Photos de la parcelle ({activePlot.images.length})
							</h3>
							{#if activePlot.images.length > 0}
								<div class="flex flex-wrap gap-3 overflow-x-auto pb-2">
									{#each activePlot.images as img (img.id)}
										<a href={img.url} target="_blank" rel="noopener noreferrer" class="w-32 h-32 shrink-0 rounded-xl overflow-hidden border border-white/10 relative group block">
											<img src={img.url} alt="Vue de la parcelle" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
											<div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
												<Search size={20} class="text-white" />
											</div>
										</a>
									{/each}
								</div>
							{:else}
								<p class="text-sm text-slate-500">Aucune photo disponible.</p>
							{/if}
						</div>
					</div>

					<!-- Section Droite : Actions de Validation -->
					<div class="w-72 shrink-0 space-y-4">
						
						<!-- Localisation & Visite -->
						<div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm">
							<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Localisation</h4>
							<p class="text-white font-medium mb-1">{activePlot.city || 'Ville inconnue'}</p>
							<p class="text-slate-400 text-xs leading-relaxed">{activePlot.address || 'Aucune adresse précise fournie'}</p>
							
							<div class="w-full h-px bg-white/10 my-4"></div>
							
							<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Descente sur terrain</h4>
							{#if activePlot.visits.length > 0}
								{@const lastVisit = activePlot.visits[0]}
								<div class="flex items-start gap-2">
									<Calendar size={16} class="text-proprios-mint shrink-0 mt-0.5" />
									<div>
										<p class="text-white font-medium">{lastVisit.date ? new Date(lastVisit.date).toLocaleDateString('fr-FR') : 'Date à fixer'}</p>
										<p class="text-[10px] {lastVisit.isCompleted ? 'text-green-400' : 'text-amber-400'} mt-0.5">
											{lastVisit.isCompleted ? 'Rapport validé' : 'En attente de réalisation'}
										</p>
									</div>
								</div>
							{:else}
								<p class="text-slate-400 text-xs mb-3">Aucune visite programmée.</p>
								{#if activePlot.certifStep >= 1}
									<button 
										type="button"
										onclick={() => showVisitModal = true}
										class="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors border border-white/10 flex items-center justify-center gap-2">
										<Calendar size={14} /> Planifier une descente
									</button>
								{/if}
							{/if}
						</div>

						<!-- Messages d'erreur -->
						{#if form?.message && !form.success}
							<div class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex gap-2">
								<AlertTriangle size={16} class="shrink-0" /> {form.message}
							</div>
						{/if}

						<!-- BOUTON D'ACTION PRINCIPAL -->
						<form method="POST" action="?/advanceStep" use:enhance class="mt-auto space-y-3">
							<input type="hidden" name="plotId" value={activePlot.id} />
							<input type="hidden" name="currentStep" value={activePlot.certifStep} />
							
							{#if activePlot.certifStep === 2}
								<div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl space-y-2">
									<label for="lawyer-select" class="text-xs font-bold text-blue-400 flex items-center gap-1.5">
										<Briefcase size={14} /> Assigner un Avocat <span class="text-red-400">*</span>
									</label>
									<select 
										id="lawyer-select"
										name="lawyerId" 
										bind:value={selectedLawyerId} 
										required 
										class="w-full bg-proprios-dark border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none"
									>
										<option value="" disabled selected>-- Choisir un avocat --</option>
										{#each data.lawyers as lawyer (lawyer.id)}
											<option value={lawyer.id}>{lawyer.name}</option>
										{/each}
									</select>

									{#if !hasValidVisit}
										<p class="text-[11px] text-amber-400 flex items-center gap-1 mt-2">
											<AlertTriangle size={12} /> Planifiez d'abord une descente sur terrain ci-dessus.
										</p>
									{/if}
								</div>
							{/if}

							<button 
								type="submit"
								disabled={!canAdvanceStep()}
								class="w-full py-3.5 bg-proprios-mint hover:bg-proprios-mint-hover text-proprios-dark font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(2,225,177,0.2)] flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed">
								{#if activePlot.certifStep === 0}
									Valider la Réception <ChevronRight size={18} class="group-hover:translate-x-1 transition-transform" />
								{:else if activePlot.certifStep === 1}
									Documents Conformes <ChevronRight size={18} class="group-hover:translate-x-1 transition-transform" />
								{:else if activePlot.certifStep === 2}
									Entrer en phase légale <ChevronRight size={18} class="group-hover:translate-x-1 transition-transform" />
								{:else if activePlot.certifStep === 3}
									<CheckCircle size={18} /> Accorder Certification Finale
								{:else}
									Dossier Clôturé (Certifié)
								{/if}
							</button>
						</form>
					</div>

				</div>
			{/if}
			
			<!-- MODALE PLANIFICATION VISITE -->
			{#if showVisitModal && activePlot}
				<div class="absolute inset-0 z-50 bg-proprios-dark/80 backdrop-blur-sm flex items-center justify-center p-6">
					<div class="bg-proprios-card border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
						<button 
							type="button" 
							onclick={() => showVisitModal = false} 
							class="absolute top-4 right-4 text-slate-500 hover:text-white"
						>
							<X size={20} />
						</button>
						
						<h3 class="text-lg font-bold text-white mb-1">Planifier une descente</h3>
						<p class="text-sm text-slate-400 mb-6">Parcelle #{activePlot.id.slice(-6).toUpperCase()} - Client: {activePlot.proprio.name}</p>
						
						<form method="POST" action="?/scheduleVisit" use:enhance class="space-y-4">
							<input type="hidden" name="plotId" value={activePlot.id} />
							
							<div>
								<label for="date-input" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
									Date et Heure prévue (Ne peut pas être antérieure à aujourd'hui)
								</label>
								<input 
									type="datetime-local" 
									id="date-input"
									name="date" 
									min={getMinDateTime()}
									bind:value={visitDateInput}
									required
									class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-proprios-mint/50 color-scheme-dark"
								/>
							</div>
							
							<button 
								type="submit"
								disabled={!visitDateInput}
								class="w-full py-3 bg-proprios-mint text-proprios-dark font-bold rounded-xl transition-colors disabled:opacity-50 mt-4">
								Confirmer la planification
							</button>
						</form>
					</div>
				</div>
			{/if}

		</Card>
	</div>
{/if}

<style>
	.color-scheme-dark {
		color-scheme: dark;
	}
</style>
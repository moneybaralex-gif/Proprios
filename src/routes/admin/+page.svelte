<!-- filepath: src/routes/admin/+page.svelte -->
<script lang="ts">
	import Card from '$lib/components/admin/ui/Card.svelte';
	import Badge from '$lib/components/admin/ui/Badge.svelte';
	import { 
		Users, ShieldCheck, MapPin, TrendingUp, Search, 
		Clock, AlertCircle, ArrowUpRight, Calendar, UserCheck, 
		Layers, CheckCircle2, ChevronRight, RefreshCw
	} from '@lucide/svelte';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	interface ProprioInfo {
		id: string;
		name: string;
		certified: boolean;
		telephone: string | null;
	}

	interface LawyerInfo {
		id: string;
		name: string;
	}

	interface VisitInfo {
		date: Date | string | null;
		isCompleted: boolean;
		type: string;
	}

	interface RecentPlot {
		id: string;
		categoryId: 'GROUND' | 'HOUSE' | 'COMPANY' | 'OTHER' | string;
		city: string | null;
		address: string | null;
		price: number | null;
		certificationStatus: 'ATTENTE' | 'EN_COURS' | 'CERTIFIE' | 'REJETE' | string;
		certifStep: number;
		updatedAt: Date | string;
		proprio: ProprioInfo;
		lawyer: LawyerInfo | null;
		visits: VisitInfo[];
	}

	interface KycUser {
		id: string;
		name: string;
		cardID: string | null;
		typeID: string | null;
		createdAt: Date | string;
		kycSubmittedAt: Date | string | null;
	}

	interface CategoryGroup {
		categoryId: string;
		_count: { _all: number };
	}

	interface StatusGroup {
		certificationStatus: string;
		_count: { _all: number };
	}

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedStatusFilter = $state<string>('ALL');
	let isRefreshing = $state(false);

	const categoryLabels: Record<string, string> = {
		GROUND: 'Terrains nus',
		HOUSE: 'Résidentiel',
		COMPANY: 'Commercial',
		OTHER: 'Autres biens'
	};

	const statusLabels: Record<string, string> = {
		ATTENTE: 'Dossier Reçu',
		EN_COURS: 'Instruction',
		CERTIFIE: 'Certifiée',
		REJETE: 'Rejetée'
	};

	const statusVariant = (status: string): 'warning' | 'default' | 'success' => {
		switch (status) {
			case 'CERTIFIE': return 'success';
			case 'EN_COURS': return 'warning';
			case 'REJETE': return 'default';
			default: return 'warning';
		}
	};

	const formatCurrency = (val: number) => {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
	};

	async function refreshData() {
		isRefreshing = true;
		await invalidateAll();
		isRefreshing = false;
	}

	// Conversion sûre et typée avec 'unknown'
	let plotsList = $derived((data.recentPlots as unknown as RecentPlot[]) ?? []);
	let kycUsersList = $derived((data.pendingKycUsers as unknown as KycUser[]) ?? []);
	let categoriesList = $derived((data.plotsByCategory as unknown as CategoryGroup[]) ?? []);
	let statusList = $derived((data.statusCounts as unknown as StatusGroup[]) ?? []);

	// Filtrage instantané réactif
	let filteredPlots = $derived(
		plotsList.filter((plot) => {
			const matchesSearch =
				plot.proprio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				plot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(plot.city && plot.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
				(plot.address && plot.address.toLowerCase().includes(searchQuery.toLowerCase()));

			if (selectedStatusFilter === 'ALL') return matchesSearch;
			return matchesSearch && plot.certificationStatus === selectedStatusFilter;
		})
	);

	let totalPlotsCount = $derived(
		statusList.reduce((acc, curr) => acc + curr._count._all, 0)
	);
</script>

<div class="space-y-8">
	<!-- HEADER AVEC BOUTON D'ACTUALISATION RAPIDE -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-black text-white tracking-tight">Vue d'ensemble</h1>
			<p class="text-slate-400 mt-1 text-sm">Supervision temps réel du cadastre et des certifications foncières.</p>
		</div>
		
		<div class="flex items-center gap-3">
			<button 
				type="button"
				onclick={refreshData}
				disabled={isRefreshing}
				class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
			>
				<RefreshCw size={14} class={isRefreshing ? 'animate-spin text-proprios-mint' : ''} />
				<span>{isRefreshing ? 'Actualisation...' : 'Actualiser les données'}</span>
			</button>

			<a 
				href="/admin/certifications" 
				class="flex items-center gap-2 px-4 py-2 rounded-xl bg-proprios-mint hover:bg-proprios-mint-hover text-proprios-dark text-xs font-bold transition-all shadow-[0_0_15px_rgba(2,225,177,0.2)]"
			>
				<span>Examiner les dossiers</span>
				<ArrowUpRight size={15} />
			</a>
		</div>
	</div>

	<!-- GRILLE DES 4 KPI EN TEMPS RÉEL -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
		<Card class="p-5 flex items-center justify-between bg-proprios-card border border-white/5 hover:border-white/10 transition-colors">
			<div>
				<p class="text-xs font-bold uppercase tracking-wider text-slate-400">Utilisateurs inscrits</p>
				<p class="text-2xl sm:text-3xl font-black text-white mt-1.5">{data.stats.totalUsers.toLocaleString()}</p>
				<span class="inline-flex items-center gap-1 text-[11px] text-blue-400 mt-1 font-medium">
					Comptes propriétaires & acquéreurs
				</span>
			</div>
			<div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
				<Users size={22} />
			</div>
		</Card>

		<Card class="p-5 flex items-center justify-between bg-proprios-card border border-white/5 hover:border-white/10 transition-colors">
			<div>
				<p class="text-xs font-bold uppercase tracking-wider text-slate-400">Parcelles certifiées</p>
				<p class="text-2xl sm:text-3xl font-black text-white mt-1.5">{data.stats.totalCertifiedPlots.toLocaleString()}</p>
				<span class="inline-flex items-center gap-1 text-[11px] text-proprios-mint mt-1 font-medium">
					100% Titrées & Bornées
				</span>
			</div>
			<div class="w-12 h-12 rounded-2xl bg-proprios-mint/10 text-proprios-mint flex items-center justify-center shrink-0 border border-proprios-mint/20">
				<ShieldCheck size={22} />
			</div>
		</Card>

		<Card class="p-5 flex items-center justify-between bg-proprios-card border border-white/5 hover:border-white/10 transition-colors">
			<div>
				<p class="text-xs font-bold uppercase tracking-wider text-slate-400">Descentes terrain</p>
				<p class="text-2xl sm:text-3xl font-black text-white mt-1.5">{data.stats.pendingVisitsCount}</p>
				<span class="inline-flex items-center gap-1 text-[11px] text-amber-400 mt-1 font-medium">
					Visites programmées / en cours
				</span>
			</div>
			<div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
				<Calendar size={22} />
			</div>
		</Card>

		<Card class="p-5 flex items-center justify-between bg-proprios-card border border-white/5 hover:border-white/10 transition-colors">
			<div>
				<p class="text-xs font-bold uppercase tracking-wider text-slate-400">Volume / Revenus (Mois)</p>
				<p class="text-2xl sm:text-3xl font-black text-white mt-1.5 font-mono">{formatCurrency(data.stats.monthlyIncome)}</p>
				<span class="inline-flex items-center gap-1 text-[11px] text-purple-400 mt-1 font-medium">
					Commissions & Frais de dossier
				</span>
			</div>
			<div class="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
				<TrendingUp size={22} />
			</div>
		</Card>
	</div>

	<!-- SECTION PRINCIPALE (TABLEAU INTERACTIF & COLONNE ACTIONS REQUISES) -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		
		<!-- COLONNE GAUCHE (2/3) : DERNIÈRES PARCELLES AVEC RECHERCHE & FILTRES RAPIDES -->
		<Card class="p-6 lg:col-span-2 flex flex-col bg-proprios-card border border-white/5">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
				<div>
					<h2 class="text-lg font-bold text-white">Dernières instructions cadastrales</h2>
					<p class="text-xs text-slate-400 mt-0.5">Suivi en direct des dossiers soumis par les propriétaires</p>
				</div>

				<div class="flex items-center gap-2">
					<div class="relative min-w-44">
						<Search size={14} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
						<input 
							type="text" 
							bind:value={searchQuery}
							placeholder="Recherche rapide..."
							class="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-proprios-mint/50 transition-colors"
						/>
					</div>
				</div>
			</div>

			<!-- ONGLETS DE FILTRAGE INSTANTANÉ -->
			<div class="flex items-center gap-1.5 pb-3 border-b border-white/5 overflow-x-auto no-scrollbar">
				{#each ['ALL', 'ATTENTE', 'EN_COURS', 'CERTIFIE'] as status (status)}
					<button
						type="button"
						onclick={() => selectedStatusFilter = status}
						class="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap {selectedStatusFilter === status ? 'bg-white/10 text-proprios-mint' : 'text-slate-400 hover:text-slate-200'}"
					>
						{status === 'ALL' ? 'Tous les dossiers' : statusLabels[status] || status}
					</button>
				{/each}
			</div>

			<!-- TABLEAU DES DOSSIERS -->
			<div class="flex-1 overflow-x-auto mt-2">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
							<th class="py-3 px-2">Propriétaire</th>
							<th class="py-3 px-2">Localisation</th>
							<th class="py-3 px-2">Avancement</th>
							<th class="py-3 px-2">Statut</th>
							<th class="py-3 px-2 text-right">Action</th>
						</tr>
					</thead>
					<tbody class="text-xs divide-y divide-white/5">
						{#each filteredPlots as plot (plot.id)}
							<tr class="hover:bg-white/2 transition-colors group">
								<td class="py-3 px-2">
									<div class="font-bold text-white flex items-center gap-1.5">
										<span>{plot.proprio.name}</span>
										{#if plot.proprio.certified}
											<span title="Propriétaire vérifié" class="text-proprios-mint">
												<CheckCircle2 size={13} />
											</span>
										{/if}
									</div>
									<span class="text-[10px] text-slate-500 font-mono">#{plot.id.slice(-6).toUpperCase()}</span>
								</td>

								<td class="py-3 px-2 text-slate-300">
									<div class="flex items-center gap-1 truncate max-w-40">
										<MapPin size={12} class="text-proprios-mint shrink-0" />
										<span>{plot.city || 'Non spécifiée'}</span>
									</div>
									<p class="text-[10px] text-slate-500 truncate max-w-40">{plot.address || 'RDC'}</p>
								</td>

								<td class="py-3 px-2">
									<span class="text-slate-300 font-medium">Étape {plot.certifStep}/4</span>
									<div class="w-20 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
										<div 
											class="h-full bg-proprios-mint transition-all" 
											style="width: {plot.certifStep >= 4 ? 100 : Math.max(20, plot.certifStep * 25)}%"
										></div>
									</div>
								</td>

								<td class="py-3 px-2">
									<Badge variant={statusVariant(plot.certificationStatus)}>
										{statusLabels[plot.certificationStatus] || plot.certificationStatus}
									</Badge>
								</td>

								<td class="py-3 px-2 text-right">
									<a 
										href="/admin/certifications" 
										class="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-proprios-mint group-hover:translate-x-0.5 transition-all"
										title="Examiner le dossier"
									>
										<span>Examiner</span>
										<ChevronRight size={14} />
									</a>
								</td>
							</tr>
						{/each}

						{#if filteredPlots.length === 0}
							<tr>
								<td colspan="5" class="py-8 text-center text-slate-500">
									Aucun dossier correspondant aux critères de recherche.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</Card>

		<!-- COLONNE DROITE (1/3) : ACTIONS REQUISES & RÉPARTITION DU PARC -->
		<div class="space-y-6">
			
			<!-- ACTIONS REQUISES (ALERTES KYC & DOSSIERS URGENTS) -->
			<Card class="p-6 bg-linear-to-br from-proprios-card to-proprios-dark border border-white/5 space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-base font-bold text-white flex items-center gap-2">
						<AlertCircle size={16} class="text-amber-400" /> Actions Requises
					</h2>
					<span class="rounded-full bg-amber-400/10 text-amber-400 px-2 py-0.5 text-[10px] font-bold border border-amber-400/20">
						{kycUsersList.length + (data.stats.pendingCertificationCount > 0 ? 1 : 0)} En attente
					</span>
				</div>

				<div class="space-y-2.5">
					<!-- NOTIFICATION CERTIFICATION EN ATTENTE -->
					{#if data.stats.pendingCertificationCount > 0}
						<a 
							href="/admin/certifications"
							class="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-proprios-mint/40 transition-all flex items-start gap-3 group"
						>
							<div class="w-8 h-8 rounded-lg bg-proprios-mint/10 text-proprios-mint flex items-center justify-center shrink-0 mt-0.5">
								<Clock size={16} />
							</div>
							<div class="overflow-hidden flex-1">
								<div class="flex items-center justify-between">
									<p class="text-xs font-bold text-white group-hover:text-proprios-mint transition-colors">
										{data.stats.pendingCertificationCount} Parcelles à instruire
									</p>
									<ChevronRight size={13} class="text-slate-500 group-hover:text-proprios-mint" />
								</div>
								<p class="text-[10px] text-slate-400 mt-0.5">Visites de bornage ou assignations avocat requises</p>
							</div>
						</a>
					{/if}

					<!-- NOTIFICATIONS KYC UTILISATEURS -->
					{#each kycUsersList as kycUser (kycUser.id)}
						<div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
							<div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
								<UserCheck size={16} />
							</div>
							<div class="overflow-hidden flex-1">
								<div class="flex items-center justify-between">
									<p class="text-xs font-bold text-white truncate">{kycUser.name}</p>
									<span class="text-[9px] text-slate-500">KYC</span>
								</div>
								<p class="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
									{kycUser.typeID || 'PIÈCE'} : {kycUser.cardID || 'Photo soumise'}
								</p>
							</div>
						</div>
					{/each}

					{#if kycUsersList.length === 0 && data.stats.pendingCertificationCount === 0}
						<div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-center">
							✨ Aucune action urgente en attente. Tout est à jour !
						</div>
					{/if}
				</div>
			</Card>

			<!-- RÉPARTITION DU PARC FONCIER -->
			<Card class="p-6 bg-proprios-card border border-white/5 space-y-4">
				<h2 class="text-base font-bold text-white flex items-center gap-2">
					<Layers size={16} class="text-proprios-mint" /> Typologie des biens ({totalPlotsCount})
				</h2>

				<div class="space-y-3">
					{#each categoriesList as cat (cat.categoryId)}
						{@const percentage = totalPlotsCount > 0 ? Math.round((cat._count._all / totalPlotsCount) * 100) : 0}
						<div>
							<div class="flex justify-between text-xs mb-1">
								<span class="font-medium text-slate-300">{categoryLabels[cat.categoryId] || cat.categoryId}</span>
								<span class="font-bold text-white font-mono">{cat._count._all} ({percentage}%)</span>
							</div>
							<div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
								<div 
									class="h-full bg-proprios-mint transition-all duration-500"
									style="width: {percentage}%"
								></div>
							</div>
						</div>
					{/each}

					{#if categoriesList.length === 0}
						<p class="text-xs text-slate-500">Aucune statistique de catégorie disponible.</p>
					{/if}
				</div>
			</Card>

		</div>
	</div>
</div>
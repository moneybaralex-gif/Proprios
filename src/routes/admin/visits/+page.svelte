<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/admin/ui/Card.svelte';
	import Badge from '$lib/components/admin/ui/Badge.svelte';
	import {
		Search,
		MapPin,
		Calendar,
		Clock,
		CheckCircle,
		ShieldCheck,
		Users,
		CreditCard,
		ChevronRight,
		AlertTriangle,
		Navigation,
		Map,
		PhoneCall,
		RefreshCcw,
		FileSignature,
		XCircle
	} from '@lucide/svelte';
	import type { PageData, ActionData } from './$types';

	type VisitType = 'CERTIFICATION' | 'FORCLIENT';
	type FilterStatus = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

	interface UserBase {
		id: string;
		name: string;
		telephone: string | null;
	}

	interface Client extends UserBase {
		image: string | null;
	}

	interface ImageItem {
		id: string;
		url: string;
	}

	interface PlotData {
		id: string;
		address: string | null;
		city: string | null;
		proprio: UserBase;
		images: ImageItem[];
	}

	interface VisitData {
		id: string;
		date: Date | null;
		type: VisitType;
		paid: boolean;
		isCompleted: boolean;
		isCancelled: boolean;
		user: Client | null;
		plot: PlotData;
	}

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let currentUser = $derived(data.currentUser);

	let searchQuery = $state('');
	let activeFilter = $state<FilterStatus>('ALL');
	let selectedVisitId = $state<string | null>(null);
	let isRescheduling = $state(false);
	let newDateInput = $state('');
	let toastMessage = $state<string | null>(null);

	let typedVisits = $derived(data.visits as unknown as VisitData[]);

	const today = $state(new Date());
	today.setHours(0, 0, 0, 0);

		let filteredVisits = $derived(
		typedVisits.filter((visit) => {
			const matchSearch =
				visit.plot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(visit.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
				visit.plot.proprio.name.toLowerCase().includes(searchQuery.toLowerCase());

			const visitDate = visit.date ? new Date(visit.date) : null;

			if (activeFilter === 'UPCOMING')
				return (
					matchSearch &&
					!visit.isCompleted &&
					!visit.isCancelled &&
					visitDate !== null &&
					visitDate >= today
				);
			if (activeFilter === 'COMPLETED') return matchSearch && visit.isCompleted;
			if (activeFilter === 'CANCELLED') return matchSearch && visit.isCancelled;
			return matchSearch;
		})
	);

	let activeVisit = $derived(filteredVisits.find((v) => v.id === selectedVisitId));

	const isPastDue = (dateStr: Date | null) => {
		if (!dateStr) return false;
		return new Date(dateStr) < today;
	};

	const formatDate = (dateStr: Date | null, timeOnly = false) => {
		if (!dateStr) return 'Non planifié';
		const date = new Date(dateStr);
		if (timeOnly) {
			return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
		}
		return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
	};

	$effect(() => {
		if (form?.success) {
			isRescheduling = false;
			toastMessage = form.message || 'Action réussie';
			setTimeout(() => (toastMessage = null), 3000);
		}
	});
</script>

{#if currentUser}
	<div class="relative flex h-[calc(100vh-8rem)] gap-6 overflow-hidden">
		<!-- COLONNE GAUCHE : TIMELINE -->
		<Card class="flex w-95 shrink-0 flex-col bg-proprios-dark/50">
			<div class="space-y-4 border-b border-white/5 p-5">
				<div>
					<h2 class="mb-0.5 text-xl font-bold text-white">Missions Terrain</h2>
					<p class="text-xs text-slate-400">Planification des descentes</p>
				</div>

				<div class="relative">
					<Search size={16} class="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
					<input
						bind:value={searchQuery}
						type="text"
						placeholder="ID Parcelle, Client..."
						class="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-4 pl-9 text-sm text-white transition-colors focus:border-proprios-mint/50 focus:outline-none"
					/>
				</div>

				<div class="no-scrollbar flex gap-2 overflow-x-auto pb-1">
					{#each [{ id: 'ALL', label: 'Toutes' }, { id: 'UPCOMING', label: 'À venir' }, { id: 'COMPLETED', label: 'Terminées' }, { id: 'CANCELLED', label: 'Annulées' }] as filter (filter.id)}
						<button
							type="button"
							onclick={() => (activeFilter = filter.id as FilterStatus)}
							class="rounded-lg border px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-all {activeFilter ===
							filter.id
								? 'border-white/10 bg-proprios-card text-white shadow-sm'
								: 'border-transparent bg-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'}"
						>
							{filter.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="relative flex-1 space-y-3 overflow-y-auto p-4">
				{#each filteredVisits as visit (visit.id)}
					{@const isDanger = !visit.isCompleted && !visit.isCancelled && isPastDue(visit.date)}

					<button
						type="button"
						onclick={() => {
							selectedVisitId = visit.id;
							isRescheduling = false;
						}}
						class="group relative z-10 flex w-full gap-4 rounded-2xl p-3 text-left transition-all {selectedVisitId ===
						visit.id
							? 'border border-white/10 bg-proprios-card shadow-lg'
							: 'border border-transparent hover:bg-white/2'}"
					>
						<div class="relative flex w-10 shrink-0 flex-col items-center">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-bold {visit.isCancelled
									? 'border-red-500/20 bg-red-500/10 text-red-400'
									: visit.isCompleted
										? 'border-proprios-mint/20 bg-proprios-mint/10 text-proprios-mint'
										: isDanger
											? 'border-red-500/20 bg-red-500/10 text-red-500'
											: 'border-white/10 bg-white/5 text-slate-300'}"
							>
								{#if visit.isCancelled}
									<XCircle size={18} />
								{:else if visit.isCompleted}
									<CheckCircle size={18} />
								{:else}
									<span class="text-center leading-tight">
										{visit.date ? new Date(visit.date).getDate() : '?'}
										<span class="block text-[8px] uppercase"
											>{visit.date
												? new Date(visit.date).toLocaleString('fr-FR', { month: 'short' })
												: ''}</span
										>
									</span>
								{/if}
							</div>
						</div>

						<div class="min-w-0 flex-1 py-0.5">
							<div class="mb-1 flex items-start justify-between">
								<span
									class="text-xs font-bold {visit.isCompleted || visit.isCancelled
										? 'text-slate-400 line-through'
										: 'text-white'} truncate"
								>
									Parcelle #{visit.plot.id.slice(-6).toUpperCase()}
								</span>
								<span
									class="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase {visit.type ===
									'CERTIFICATION'
										? 'bg-purple-500/20 text-purple-400'
										: 'bg-blue-500/20 text-blue-400'}"
								>
									{visit.type === 'CERTIFICATION' ? 'Audit' : 'Vente'}
								</span>
							</div>

							<p class="mb-1.5 flex items-center gap-1.5 truncate text-[11px] text-slate-400">
								<MapPin size={10} />
								{visit.plot.city || 'Lieu non spécifié'}
							</p>

							{#if visit.isCancelled}
								<p class="flex items-center gap-1 text-[10px] font-medium text-red-400">
									<XCircle size={10} /> Visite annulée
								</p>
							{:else if isDanger}
								<p class="flex items-center gap-1 text-[10px] font-medium text-red-400">
									<AlertTriangle size={10} /> En retard / À reprogrammer
								</p>
							{:else if !visit.isCompleted}
								<p class="flex items-center gap-1 text-[10px] text-slate-500">
									<Clock size={10} />
									{formatDate(visit.date, true)}
								</p>
							{/if}
						</div>
					</button>
				{/each}

				{#if filteredVisits.length === 0}
					<div class="pt-10 text-center text-sm text-slate-500">Aucune mission trouvée.</div>
				{/if}
			</div>
		</Card>

		<!-- COLONNE DROITE : TABLEAU DE BORD MISSION -->
		<Card class="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-proprios-card shadow-2xl">
			{#if !activeVisit}
				<div class="flex flex-1 flex-col items-center justify-center text-slate-500">
					<div
						class="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5"
					>
						<Navigation size={40} class="text-slate-600" />
					</div>
					<h3 class="mb-2 text-xl font-medium text-white">Centre Opérationnel</h3>
					<p class="text-sm">Sélectionnez une mission pour voir les détails d'intervention.</p>
				</div>
			{:else}
				<!-- HEADER MISSION -->
				<div
					class="flex items-start justify-between border-b border-white/5 bg-linear-to-r from-proprios-dark/50 to-transparent p-6"
				>
					<div>
						<div class="mb-2 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl text-white {activeVisit.type ===
								'CERTIFICATION'
									? 'bg-purple-500'
									: 'bg-blue-500'} shadow-lg"
							>
								{#if activeVisit.type === 'CERTIFICATION'}
									<ShieldCheck size={20} />
								{:else}
									<Users size={20} />
								{/if}
							</div>
							<div>
								<h2 class="text-2xl font-black tracking-tight text-white">
									Mission #{activeVisit.id.slice(-6).toUpperCase()}
								</h2>
								<p class="text-sm font-medium text-slate-400">
									Objectif : {activeVisit.type === 'CERTIFICATION'
										? 'Audit et vérification de la parcelle'
										: 'Visite pour un acheteur potentiel'}
								</p>
							</div>
						</div>
					</div>

					<div class="flex flex-col items-end gap-2">
						{#if activeVisit.isCancelled}
							<Badge variant="danger">Annulée</Badge>
						{:else if activeVisit.isCompleted}
							<Badge variant="success">Mission Accomplie</Badge>
						{:else if isPastDue(activeVisit.date)}
							<Badge variant="danger">En Retard</Badge>
						{:else}
							<Badge variant="default">Planifiée</Badge>
						{/if}
					</div>
				</div>

				<!-- WORKSPACE -->
				<div class="grid flex-1 auto-rows-max grid-cols-2 gap-4 overflow-y-auto p-6">
					<!-- BLOC 1 : DATE & LOCALISATION -->
					<div
						class="col-span-2 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-5"
					>
						<div class="flex items-center gap-4">
							<div
								class="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-white/10 bg-proprios-dark text-proprios-mint"
							>
								<Calendar size={20} class="mb-0.5" />
								<span class="text-[10px] font-bold uppercase"
									>{activeVisit.date
										? new Date(activeVisit.date).toLocaleDateString('fr-FR', { month: 'short' })
										: 'N/A'}</span
								>
							</div>
							<div>
								<h4 class="mb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
									Planification
								</h4>
								<p class="text-lg font-bold text-white">{formatDate(activeVisit.date)}</p>
								<p class="mt-0.5 text-xs text-slate-400">
									<Clock size={12} class="mr-1 inline" />{formatDate(activeVisit.date, true)}
								</p>
							</div>
						</div>

						<div class="mx-6 h-16 w-px bg-white/10"></div>

						<div class="flex flex-1 items-center gap-4">
							<div
								class="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-800"
							>
								{#if (activeVisit.plot?.images?.length ?? 0) > 0}
									<img
										src={activeVisit.plot.images[0].url}
										class="h-full w-full object-cover"
										alt="Parcelle"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center">
										<Map size={24} class="text-slate-600" />
									</div>
								{/if}
							</div>
							<div>
								<h4 class="mb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
									Lieu d'intervention
								</h4>
								<p class="max-w-50 truncate text-sm font-bold text-white">
									Parcelle #{activeVisit.plot.id.slice(-6).toUpperCase()}
								</p>
								<p class="mt-0.5 max-w-50 truncate text-xs text-slate-400">
									<MapPin size={12} class="mr-1 inline" />{activeVisit.plot.address ||
										activeVisit.plot.city ||
										'Non renseigné'}
								</p>
							</div>
						</div>
					</div>

					<!-- BLOC 2 : CONTACTS -->
					<div class="col-span-1 rounded-3xl border border-white/10 bg-white/5 p-5">
						<h4
							class="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase"
						>
							<Users size={14} /> Personnes à rencontrer
						</h4>

						<div class="space-y-4">
							<div
								class="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 p-3"
							>
								<div>
									<p class="mb-0.5 text-[10px] font-bold text-slate-500 uppercase">Propriétaire</p>
									<p class="text-sm font-bold text-white">{activeVisit.plot.proprio.name}</p>
								</div>
								{#if activeVisit.plot.proprio.telephone}
									<a
										href={`tel:${activeVisit.plot.proprio.telephone}`}
										class="flex h-8 w-8 items-center justify-center rounded-full bg-proprios-mint/10 text-proprios-mint transition-colors hover:bg-proprios-mint hover:text-proprios-dark"
									>
										<PhoneCall size={14} />
									</a>
								{/if}
							</div>

							{#if activeVisit.type === 'FORCLIENT' && activeVisit.user}
								<div
									class="flex items-center justify-between rounded-xl border border-blue-500/10 bg-blue-500/5 p-3"
								>
									<div class="flex items-center gap-3">
										<img
											src={activeVisit.user.image ||
												`https://api.dicebear.com/7.x/initials/svg?seed=${activeVisit.user.name}`}
											alt="Client"
											class="h-8 w-8 rounded-full border border-white/10"
										/>
										<div>
											<p class="mb-0.5 text-[10px] font-bold text-blue-400 uppercase">
												Client Visiteur
											</p>
											<p class="text-sm font-bold text-white">{activeVisit.user.name}</p>
										</div>
									</div>
									{#if activeVisit.user.telephone}
										<a
											href={`tel:${activeVisit.user.telephone}`}
											class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 transition-colors hover:bg-blue-500 hover:text-white"
										>
											<PhoneCall size={14} />
										</a>
									{/if}
								</div>
							{/if}
						</div>
					</div>

					<!-- BLOC 3 : FINANCES & GESTION -->
					<div
						class="col-span-1 flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-5"
					>
						<div>
							<h4
								class="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase"
							>
								<CreditCard size={14} /> Logistique & Finances
							</h4>

							<div
								class="mb-4 flex items-center justify-between rounded-xl border border-white/5 bg-proprios-dark/50 p-4"
							>
								<div>
									<p class="text-sm font-bold text-white">Frais de descente</p>
									<p class="mt-1 text-xs text-slate-400">À charge du client / propriétaire</p>
								</div>

								<form method="POST" action="?/togglePayment" use:enhance>
									<input type="hidden" name="visitId" value={activeVisit.id} />
									<input type="hidden" name="isPaid" value={activeVisit.paid ? 'true' : 'false'} />

									<button
										type="submit"
										class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors {activeVisit.paid
											? 'border-proprios-mint/20 bg-proprios-mint/10 text-proprios-mint'
											: 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20'}"
									>
										{#if activeVisit.paid}
											<CheckCircle size={14} /> Payé
										{:else}
											<AlertTriangle size={14} /> Non Payé
										{/if}
									</button>
								</form>
							</div>
						</div>

						{#if !activeVisit.isCompleted && !activeVisit.isCancelled}
							<div class="flex gap-2">
								<button
									type="button"
									onclick={() => (isRescheduling = !isRescheduling)}
									class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/10"
								>
									<RefreshCcw size={14} /> Reporter
								</button>
								<form method="POST" action="?/cancelVisit" use:enhance class="flex-1">
									<input type="hidden" name="visitId" value={activeVisit.id} />
									<button
										type="submit"
										class="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/20"
									>
										<XCircle size={14} /> Annuler
									</button>
								</form>
							</div>
						{/if}
					</div>

					{#if isRescheduling}
						<div
							class="col-span-2 flex animate-in items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 duration-200 zoom-in-95 fade-in"
						>
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-500"
							>
								<Calendar size={20} />
							</div>
							<div class="flex-1">
								<h4 class="text-sm font-bold text-amber-500">Nouvelle date</h4>
								<p class="text-xs text-amber-500/70">
									Sélectionnez la nouvelle date d'intervention.
								</p>
							</div>

							<form
								method="POST"
								action="?/rescheduleVisit"
								use:enhance
								class="flex items-center gap-3"
							>
								<input type="hidden" name="visitId" value={activeVisit.id} />
								<input
									type="datetime-local"
									name="newDate"
									bind:value={newDateInput}
									required
									class="color-scheme-dark rounded-xl border border-amber-500/30 bg-proprios-dark p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
								/>
								<button
									type="submit"
									disabled={!newDateInput}
									class="rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-proprios-dark transition-colors disabled:opacity-50"
									>Confirmer</button
								>
							</form>
						</div>
					{/if}

					<div class="col-span-2 mt-2">
						{#if !activeVisit.isCompleted && !activeVisit.isCancelled}
							<form method="POST" action="?/completeVisit" use:enhance>
								<input type="hidden" name="visitId" value={activeVisit.id} />
								<button
									type="submit"
									class="group flex w-full items-center justify-center gap-3 rounded-2xl bg-proprios-mint py-4 font-black text-proprios-dark shadow-[0_0_20px_rgba(2,225,177,0.2)] transition-all hover:bg-proprios-mint-hover"
								>
									<FileSignature size={20} />
									VALIDER LE RAPPORT DE DESCENTE
									<ChevronRight size={20} class="transition-transform group-hover:translate-x-1" />
								</button>
							</form>
						{:else if activeVisit.isCancelled}
							<div
								class="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-4 font-bold text-red-400"
							>
								<XCircle size={20} /> MISSION ANNULÉE
							</div>
						{:else}
							<div
								class="flex w-full items-center justify-center gap-2 rounded-2xl border border-proprios-mint/20 bg-proprios-dark/50 py-4 font-bold text-proprios-mint opacity-70"
							>
								<CheckCircle size={20} /> MISSION CLÔTURÉE
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if toastMessage}
				<div
					class="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 animate-in items-center gap-3 rounded-full border border-white/20 bg-proprios-card px-6 py-3 font-bold text-white shadow-2xl duration-300 fade-in slide-in-from-bottom-8"
				>
					<CheckCircle size={20} class="text-proprios-mint" />
					{toastMessage}
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

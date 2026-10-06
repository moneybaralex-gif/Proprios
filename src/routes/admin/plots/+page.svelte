<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { Component } from 'svelte';
	import Card from '$lib/components/admin/ui/Card.svelte';
	import {
		Map,
		Pencil,
		Trash2,
		Search,
		X,
		MapPin,
		ShieldCheck,
		Image as ImageIcon,
		Loader2,
		AlertTriangle,
		Tag,
		Save
	} from '@lucide/svelte';

	let { data } = $props();
	let plots = $derived(data.plots);

	type EditingPlot = (typeof plots)[number];
	type TabId = 'general' | 'location' | 'status' | 'media';
	interface TabDef {
		id: TabId;
		label: string;
		icon: Component<{ size?: number | string }>;
	}

	let searchQuery = $state('');
	let filteredPlots = $derived(
		plots.filter(
			(p) =>
				p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.proprio.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	let editingPlot = $state<EditingPlot | null>(null);
	let activeTab = $state<TabId>('general');
	let deletingImageId = $state<string | null>(null);
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	const tabs: TabDef[] = [
		{ id: 'general', label: 'Général', icon: Tag },
		{ id: 'location', label: 'Localisation', icon: MapPin },
		{ id: 'status', label: 'Statut & Vente', icon: ShieldCheck },
		{ id: 'media', label: 'Média', icon: ImageIcon }
	];

	const fieldLabel = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400';
	const fieldInput =
		'rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-proprios-mint/60 focus:bg-white/[0.07]';

	function openEdit(plot: EditingPlot) {
		editingPlot = { ...plot, images: [...plot.images] };
		activeTab = 'general';
		errorMessage = null;
		isSubmitting = false;
		deletingImageId = null;
	}

	function closeEdit() {
		editingPlot = null;
		errorMessage = null;
		isSubmitting = false;
		deletingImageId = null;
	}

	const handleEnhance: SubmitFunction = ({ submitter }) => {
		const isDeleteImage = submitter?.getAttribute('formaction')?.includes('deleteImage') ?? false;

		if (!isDeleteImage) {
			isSubmitting = true;
			errorMessage = null;
		}

		return async ({ result, update }) => {
			if (!isDeleteImage) isSubmitting = false;

			if (result.type === 'success') {
				if (isDeleteImage && deletingImageId) {
					const plot = editingPlot;
					if (plot) {
						plot.images = plot.images.filter((i) => i.id !== deletingImageId);
					}
					deletingImageId = null;
				} else {
					closeEdit();
				}
			} else if (result.type === 'failure') {
				const responseData = result.data as { message?: string } | undefined;
				errorMessage = responseData?.message ?? 'Une erreur est survenue';
				deletingImageId = null;
			}

			await update();
		};
	};
</script>

<div class="relative h-[calc(100vh-8rem)]">
	<Card class="flex h-full flex-col bg-proprios-card">
		<div class="flex items-center justify-between border-b border-white/5 bg-proprios-dark/50 p-6">
			<div class="flex items-center gap-4">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-xl bg-proprios-mint/10 text-proprios-mint"
				>
					<Map size={24} />
				</div>
				<div>
					<h2 class="text-xl font-bold text-white">Base de Données Parcelles</h2>
					<p class="text-sm text-slate-400">Gestion globale des biens immobiliers.</p>
				</div>
			</div>
			<div class="relative w-72">
				<Search size={16} class="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
				<input
					bind:value={searchQuery}
					placeholder="Rechercher..."
					class="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-4 pl-9 text-sm text-white focus:border-proprios-mint/50 focus:outline-none"
				/>
			</div>
		</div>

		<div class="flex-1 overflow-auto">
			<table class="w-full text-left text-sm text-slate-300">
				<thead class="sticky top-0 bg-white/5 text-xs text-slate-400 uppercase backdrop-blur-md">
					<tr>
						<th class="px-6 py-4">ID</th>
						<th class="px-6 py-4">Propriétaire</th>
						<th class="px-6 py-4">Ville</th>
						<th class="px-6 py-4">Statut</th>
						<th class="px-6 py-4 text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/5">
					{#each filteredPlots as plot (plot.id)}
						<tr class="transition-colors hover:bg-white/5">
							<td class="px-6 py-4 font-mono text-xs">#{plot.id.slice(-6).toUpperCase()}</td>
							<td class="px-6 py-4 font-bold text-white">{plot.proprio.name}</td>
							<td class="px-6 py-4">{plot.city || '-'}</td>
							<td class="px-6 py-4"
								><span class="rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase"
									>{plot.certificationStatus}</span
								></td
							>
							<td class="flex justify-end gap-2 px-6 py-4">
								<button
									type="button"
									onclick={() => openEdit(plot)}
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition hover:bg-blue-500 hover:text-white"
									aria-label="Modifier la parcelle"
								>
									<Pencil size={14} />
								</button>
								<form method="POST" action="?/deletePlot" use:enhance>
									<input type="hidden" name="id" value={plot.id} />
									<button
										type="submit"
										class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition hover:bg-red-500 hover:text-white"
										aria-label="Supprimer la parcelle"
									>
										<Trash2 size={14} />
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Modale d'édition -->
	{#if editingPlot}
		<div
			class="absolute inset-0 z-50 flex items-center justify-center bg-proprios-dark/80 p-4 backdrop-blur-sm sm:p-6"
		>
			<div
				class="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-proprios-card shadow-2xl"
			>
				<!-- En-tête -->
				<header class="flex items-start justify-between border-b border-white/5 p-6">
					<div class="flex items-center gap-4">
						<div
							class="flex h-11 w-11 items-center justify-center rounded-xl bg-proprios-mint/10 text-proprios-mint"
						>
							<Pencil size={20} />
						</div>
						<div>
							<h3 class="text-lg font-bold text-white">Modification de la parcelle</h3>
							<p class="font-mono text-xs text-slate-400">
								#{editingPlot.id.slice(-6).toUpperCase()} • {editingPlot.proprio.name}
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={closeEdit}
						class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
						aria-label="Fermer"
					>
						<X size={18} />
					</button>
				</header>

				<!-- Onglets -->
				<nav class="flex gap-1 overflow-x-auto border-b border-white/5 px-6">
					{#each tabs as tab (tab.id)}
						{@const Icon = tab.icon}
						<button
							type="button"
							onclick={() => (activeTab = tab.id)}
							class="flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold tracking-wider uppercase transition {activeTab ===
							tab.id
								? 'border-proprios-mint text-proprios-mint'
								: 'border-transparent text-slate-400 hover:text-white'}"
						>
							<Icon size={14} />
							{tab.label}
						</button>
					{/each}
				</nav>

				<!-- Formulaire -->
				<form
					method="POST"
					action="?/updatePlot"
					use:enhance={handleEnhance}
					class="flex min-h-0 flex-1 flex-col"
				>
					<input type="hidden" name="id" value={editingPlot.id} />

					<div class="min-h-0 flex-1 overflow-y-auto p-6">
						<!-- Général -->
						<section class="grid gap-5" class:hidden={activeTab !== 'general'}>
							<label class="grid gap-1.5">
								<span class={fieldLabel}>Catégorie</span>
								<select name="categoryId" value={editingPlot.categoryId} class={fieldInput} style="background-color: black;">
									<option value="GROUND">Terrain</option>
									<option value="HOUSE">Maison</option>
									<option value="COMPANY">Entreprise</option>
									<option value="OTHER">Autre</option>
								</select>
							</label>

							<label class="grid gap-1.5">
								<span class={fieldLabel}>Description</span>
								<textarea
									name="description"
									rows={6}
									value={editingPlot.description ?? ''}
									placeholder="Description détaillée de la parcelle..."
									class="{fieldInput} resize-none"
								></textarea>
							</label>
						</section>

						<!-- Localisation & Dimensions -->
						<section class="grid gap-5" class:hidden={activeTab !== 'location'}>
							<div class="grid gap-5 sm:grid-cols-2">
								<label class="grid gap-1.5">
									<span class={fieldLabel}>Pays</span>
									<input
										name="country"
										value={editingPlot.country ?? ''}
										class={fieldInput}
										placeholder="Pays"
									/>
								</label>
								<label class="grid gap-1.5">
									<span class={fieldLabel}>Ville</span>
									<input
										name="city"
										value={editingPlot.city ?? ''}
										class={fieldInput}
										placeholder="Ville"
									/>
								</label>
							</div>

							<label class="grid gap-1.5">
								<span class={fieldLabel}>Adresse</span>
								<input
									name="address"
									value={editingPlot.address ?? ''}
									class={fieldInput}
									placeholder="Adresse complète"
								/>
							</label>

							<div class="grid gap-5 sm:grid-cols-3">
								<label class="grid gap-1.5">
									<span class={fieldLabel}>Largeur (m)</span>
									<input
										name="width"
										type="number"
										value={editingPlot.width ?? ''}
										class={fieldInput}
										placeholder="0"
									/>
								</label>
								<label class="grid gap-1.5">
									<span class={fieldLabel}>Longueur (m)</span>
									<input
										name="height"
										type="number"
										value={editingPlot.height ?? ''}
										class={fieldInput}
										placeholder="0"
									/>
								</label>
								<label class="grid gap-1.5">
									<span class={fieldLabel}>Prix</span>
									<input
										name="price"
										type="number"
										value={editingPlot.price ?? ''}
										class={fieldInput}
										placeholder="0"
									/>
								</label>
							</div>
						</section>

						<!-- Statut & Vente -->
						<section class="grid gap-5" class:hidden={activeTab !== 'status'}>
							<div class="grid gap-5 sm:grid-cols-2">
								<label class="grid gap-1.5">
									<span class={fieldLabel}>Statut de certification</span>
									<select
										name="certificationStatus"
										value={editingPlot.certificationStatus}
										class={fieldInput} style=" background-color: black;"
									>
										<option value="ATTENTE">En attente</option>
										<option value="EN_COURS">En cours</option>
										<option value="CERTIFIE">Certifié</option>
										<option value="REJETE">Rejeté</option>
									</select>
								</label>
								<label class="grid gap-1.5">
									<span class={fieldLabel}>Étape de certification</span>
									<input
										name="certifStep"
										type="number"
										min="0"
										value={editingPlot.certifStep}
										class={fieldInput}
									/>
								</label>
							</div>

							<div class="grid gap-3 rounded-xl border border-white/10 bg-white/2 p-4">
								<label class="flex cursor-pointer items-center justify-between gap-4">
									<div>
										<p class="text-sm font-medium text-white">Certifié</p>
										<p class="text-xs text-slate-400">La parcelle est officiellement certifiée</p>
									</div>
									<input
										type="checkbox"
										name="certified"
										checked={editingPlot.certified}
										class="h-5 w-5 accent-proprios-mint"
									/>
								</label>

								<div class="h-px bg-white/5"></div>

								<label class="flex cursor-pointer items-center justify-between gap-4">
									<div>
										<p class="text-sm font-medium text-white">Proposé à la vente</p>
										<p class="text-xs text-slate-400">La parcelle est visible sur le marché</p>
									</div>
									<input
										type="checkbox"
										name="canSell"
										checked={editingPlot.canSell}
										class="h-5 w-5 accent-proprios-mint"
									/>
								</label>
							</div>
						</section>

						<!-- Média -->
						<section class="grid gap-4" class:hidden={activeTab !== 'media'}>
							<div class="flex items-center justify-between">
								<div>
									<h4 class="text-sm font-semibold text-white">Galerie média</h4>
									<p class="text-xs text-slate-400">
										{editingPlot.images.length} image(s) rattachée(s) à cette parcelle
									</p>
								</div>
							</div>

							{#if editingPlot.images.length === 0}
								<div
									class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/2 py-12 text-slate-500"
								>
									<ImageIcon size={32} />
									<p class="text-sm">Aucune image pour cette parcelle</p>
								</div>
							{:else}
								<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
									{#each editingPlot.images as image (image.id)}
										<div
											class="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5"
										>
											<!-- svelte-ignore a11y_img_redundant_alt -->
											<img
												src={image.url}
												alt="Image de la parcelle"
												class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
												loading="lazy"
											/>
											<div
												class="absolute inset-0 flex items-center justify-center bg-proprios-dark/70 opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100"
											>
												<button
													type="submit"
													formaction="?/deleteImage"
													name="imageId"
													value={image.id}
													onclick={() => (deletingImageId = image.id)}
													disabled={deletingImageId === image.id}
													class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/90 text-white transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-60"
													aria-label="Supprimer l'image"
												>
													{#if deletingImageId === image.id}
														<Loader2 size={16} class="animate-spin" />
													{:else}
														<Trash2 size={16} />
													{/if}
												</button>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</section>
					</div>

					<!-- Pied de page -->
					<footer
						class="flex items-center justify-between gap-3 border-t border-white/5 bg-proprios-dark/40 p-5"
					>
						<div class="min-h-5 text-xs">
							{#if errorMessage}
								<span class="flex items-center gap-2 text-red-400">
									<AlertTriangle size={14} />
									{errorMessage}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-3">
							<button
								type="button"
								onclick={closeEdit}
								class="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
							>
								Annuler
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								class="flex items-center gap-2 rounded-xl bg-proprios-mint px-5 py-2.5 text-sm font-bold text-proprios-dark transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
							>
								{#if isSubmitting}
									<Loader2 size={14} class="animate-spin" />
								{:else}
									<Save size={14} />
								{/if}
								Enregistrer
							</button>
						</div>
					</footer>
				</form>
			</div>
		</div>
	{/if}
</div>

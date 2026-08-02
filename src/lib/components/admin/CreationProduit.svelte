<script lang="ts">
	import {
		ArrowBigRightDashIcon,
		BadgeInfo,
		ChevronLeft,
		GlobeOff,
		Loader2,
		RefreshCcw,
		UploadCloud,
		X
	} from '@lucide/svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import Hr from '../Hr.svelte';
	import Trie from './Trie.svelte';
	import InputLabel from './generals/InputLabel.svelte';
	import ButtonFetching from './ButtonFetching.svelte';
	import { enhance } from '$app/forms';
	import { toast } from '$lib/services/notification.svelte';
	import ImageSlide from './generals/ImageSlide.svelte';
	import VerifPin from './generals/VerifPin.svelte';
	import { useNetworkStatus, type NetworkQuality } from '$lib/network.svelte';
	import { useBoutiqueState } from '../../../runes/stateBoutique.svelte';
	import { lancerFeuArtifice } from '$lib/utils/confetti';
	import ProduitSucces from './ProduitSucces.svelte';

	let { close }: { close: () => void } = $props();

	let network = useNetworkStatus();
	let boutiques = useBoutiqueState();
	let stocksData = $derived(
		boutiques.currentStock?.map((stock) => {
			return {
				...stock,
				labelFormate: new Date(stock.createdAt).toLocaleString('fr-FR', {
					day: '2-digit',
					month: 'long',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
			};
		}) ?? []
	);

	// 2. On crée le tableau de chaînes (strings) UNIQUEMENT pour ton composant
	// Ça donnera: ["22 juillet 2026 à 22:49", "23 juillet..."]
	let stocks = $derived(stocksData.map((s) => s.labelFormate));

	// 3. On crée une variable pour stocker ce que l'utilisateur a sélectionné dans le composant
	let affecter = $state('');

	$effect(() => {
		// Si le tableau contient des options...
		if (stocks.length > 0) {
			// Et que le texte actuel est vide OU n'existe plus dans le nouveau tableau
			if (!affecter || !stocks.includes(affecter)) {
				// On assigne par défaut le premier élément du tableau
				affecter = stocks[0];
			}
		}
	});

	// 4. MAGIE : On retrouve l'ID du stock basé sur le texte sélectionné
	let selectedStockId = $derived(
		stocksData.find((s) => s.labelFormate === affecter)?.id ?? ''
	);

	let creerStock = $state(false);

	let step = $state(0);
	let nom = $state('');
	let model = $state('');
	let prixAchat = $state<number | null>(null);
	let prix = $state<number | null>(null);
	let qty = $state<number | null>(null);
	let description = $state('');
	let imageUrls = $state<string[] | null>(null);

	let pinValide = $state(false);

	let transformStyle = $derived(`transform: translateX(-${(step * 100) / 2}%);`);
	let formEl = $state<HTMLFormElement | null>(null);
	let inputFile = $state<HTMLInputElement | null>(null);
	let isLoading = $state<boolean>();
	let formVerif = $state(false);
	let produitCreer = $state(false);

	let internet = $state<NetworkQuality>('offline');

	async function testInternet() {
		// 1. On lance le test de connexion manuellement et on attend le résultat
		const currentQuality = await network.testConnection();
		internet = currentQuality;
	}

	function formComplete() {
		if (step === 1 && affecter && nom.trim() && prix && description.trim()) {
			if (!qty || qty === 0) {
				toast.ajouter('La quantité du produit est obligatoire', 'info');
			} else {
				formVerif = true;
			}
		} else {
			toast.ajouter('le formulaire est incomplet');
		}
	}

	function goNext() {
		if (nom.trim() && description.trim() && prix) {
			if (!affecter) {
				toast.ajouter(' Veuillez affecter le produit à un stock', 'info');
			} else {
				testInternet();
				step = 1;
			}
		} else {
			toast.ajouter('Veuillez remplir tous les champs obligatoire.', 'error');
		}
	}

	function goBack() {
		if (step > 0) step -= 1;
	}

	function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = input.files;

		if (files) {
			// Vérifier que c'est une image
			if (!files?.[0].type.startsWith('image/')) {
				toast.ajouter('Veuillez sélectionner un fichier image valide.', 'error');
				input.value = '';
				return;
			}

			imageUrls = Array.from(files).map((file) => URL.createObjectURL(file));
		}
	}

	// Suppression locale de la sélection
	function removeImage() {
		if (imageUrls) {
			imageUrls.map((url) => URL.revokeObjectURL(url));
			imageUrls = null;
		}
		if (inputFile) inputFile.value = '';
	}

	function verifierPin() {
		if (pinValide) {
			isLoading = true;
			formVerif = false;
			formEl?.requestSubmit();
		}
	}

	function creerNouveauStock() {
		creerStock = false;
		const ns = boutiques.nouveauStock();
		if (ns.status === 'succes') {
			toast.ajouter('Nouveau stock créer', 'success');
		} else {
			toast.ajouter('Echoec lors de la creation du stock');
		}
	}

	function nouveauProduitCreer() {
		produitCreer = true;
		lancerFeuArtifice();
	}

	function produitOk() {
		produitCreer = false;
		close();
	}
</script>

{#if formVerif}
	<VerifPin bind:isValide={pinValide} getPin={verifierPin} close={() => (formVerif = false)} />
{/if}

{#if produitCreer}
	<ProduitSucces
		produit={nom}
		{model}
		pA={prixAchat ?? undefined}
		pV={prix ?? 0}
		qty={qty ?? 0}
		stock={affecter}
		images={imageUrls ?? []}
		ok={() => produitOk()}
		continuer={() => {
			produitCreer = false;
			step = 0;
			formEl?.reset();
			removeImage();
			nom = '';
			model = '';
			prixAchat = null;
			prix = null;
			qty = null;
			description = '';
		}}
	/>
{/if}
<div
	in:fade
	out:fade={{ duration: 200, delay: 200 }}
	class="fixed top-0 left-0 z-10 flex h-screen w-full items-center justify-center bg-slate-400/60 p-4 backdrop-blur-sm"
>
	<div
		in:fly={{ y: -100, duration: 200, delay: 200 }}
		out:fly={{ y: -100, duration: 200 }}
		class="relative h-fit w-full max-w-xl overflow-x-hidden rounded-2xl border border-white/50 bg-neutral-200/70 p-4 text-white shadow-2xl"
	>
		<div>
			<div class=" flex items-center justify-between gap-3 py-3">
				{#if step === 0}
					<button
						type="button"
						onclick={close}
						class=" flex cursor-pointer items-center justify-center rounded-4xl border border-neutral-300 bg-neutral-400 p-2 hover:bg-red-400"
						><X /></button
					>
				{:else}
					<button
						type="button"
						onclick={goBack}
						class=" flex cursor-pointer items-center justify-center rounded-4xl border border-neutral-300 bg-neutral-400 p-2 hover:bg-neutral-600"
						><ChevronLeft /></button
					>
				{/if}

				<div class=" absolute left-36 flex w-1/2 justify-center gap-3">
					<div
						class="h-2 w-full rounded-full transition-colors duration-300 {step === 0 || step === 1
							? 'bg-cyan-500'
							: 'bg-cyan-950/80'}"
					></div>
					<div
						class="h-2 w-full rounded-full transition-colors duration-300 {step === 1
							? 'bg-cyan-500'
							: 'bg-black/40'}"
					></div>
				</div>
			</div>
			<div class="rounded-full bg-cyan-950/90 p-2 text-center text-lg font-extrabold text-cyan-50">
				CREER UN NOUVEAU PRODUIT
			</div>
			<form
				enctype="multipart/form-data"
				bind:this={formEl}
				action="/admin/boutique/liensPage/stock?/creerProduit"
				method="POST"
				use:enhance={({ cancel }) => {
					if (step !== 1) {
						cancel();
						return;
					}

					if (!formComplete) {
						cancel();
						return;
					}

					isLoading = true;

					return async ({ result }) => {
						if (result.type === 'success') {
							if (result.data?.erreurImage) {
								toast.ajouter('Ajouter mais sans images', 'info');
								nouveauProduitCreer();
								isLoading = false;
							} else {
								toast.ajouter('Produit créer avec succès', 'success');

								nouveauProduitCreer();
								isLoading = false;
							}
						} else {
							toast.ajouter('Erreur lors de la création du produit', 'error');
							isLoading = false;
						}
					};
				}}
			>
				<div
					class="flex w-[200%] transition-transform duration-500 ease-out"
					style={transformStyle}
				>
					<div class=" flex w-1/2 flex-col overflow-y-auto px-6">
						<Hr d="l" legende="AFFECTATION" color="bg-neutral-400/60" />
						<div class=" relative flex w-full items-center gap-3">
							<Trie
								title="Stock du"
								options={stocks}
								name="affecter"
								bind:value={affecter}
								isFetching={boutiques.isFetching}
							/>
							<input type='hidden' name="stockId" value={selectedStockId} />
							<button
								disabled={boutiques.isFetching}
								type="button"
								onclick={() => (creerStock = true)}
								class=" h-10 w-72 cursor-pointer rounded-lg border-2 border-green-500 p-1 transition-transform active:scale-95 disabled:border-neutral-500"
							>
								<div
									aria-disabled={boutiques.isFetching}
									class=" rounded-lg bg-green-500 p-2 text-white hover:bg-green-400 aria-disabled:bg-neutral-500"
								>
									NOUVEAU STOCK
								</div>
							</button>
							{#if creerStock}
								<div
									in:scale={{ duration: 400 }}
									out:scale={{ duration: 300 }}
									class=" absolute -bottom-24 z-10 flex h-fit w-full flex-col justify-around rounded-xl border border-amber-500/50 bg-neutral-800 p-4 shadow-xl shadow-black/60 ring-amber-400"
								>
									<h2 class="text-md m-2 text-center font-mono">
										AJOUTER UN NOUVEAU STOCK A LA BOUTIQUE : <span
											class=" rounded-md px-3 py-1 font-bold text-neutral-200"
										>
											{boutiques.currentBoutique?.nom?.toUpperCase()}</span
										>
									</h2>
									<div class=" flex items-center gap-3">
										<div
											class=" rounded-2xl border border-amber-500 bg-amber-300 p-3 text-amber-500 shadow-sm"
										>
											<BadgeInfo size={24} />
										</div>
										<div class=" fingerAnime"><ArrowBigRightDashIcon size={30} /></div>
										<div class="flex flex-col gap-2">
											<h3 class="text-left font-mono text-sm text-red-100">
												Etes-vous sure de vouloir faire cette action ?
											</h3>
										</div>
										<div class=" flex flex-col gap-2">
											<button
												onclick={creerNouveauStock}
												type="button"
												class=" h-1/2 cursor-pointer rounded-md border-2 border-green-300 bg-green-500 px-3 py-1 text-green-50 hover:bg-green-400"
												>OUI</button
											>
											<button
												onclick={() => (creerStock = false)}
												type="button"
												class=" h-1/2 cursor-pointer rounded-md border-2 border-red-300 bg-red-200 px-3 py-1 text-red-500 hover:bg-red-100"
												>NON</button
											>
										</div>
									</div>
								</div>
							{/if}
						</div>
						<Hr d="l" legende="INFORMATIONS" color="bg-neutral-400/60" />
						<div class=" flex gap-3">
							<InputLabel label="Nom du produit (oblig.)" name="nom" bind:value={nom} />
							<InputLabel label="Model du produit" name="model" bind:value={model} />
						</div>
						<textarea
							bind:value={description}
							name="description"
							placeholder="Description (oblig.)"
							class="my-3 h-24 w-full rounded-xl border-2 border-neutral-100/80 bg-neutral-700/30 p-2 focus:outline-0"
						></textarea>
						<div class=" flex gap-3">
							<InputLabel
								type="number"
								label="Prix d'achat "
								name="prixAchat"
								bind:value={prixAchat as number}
							/>
							<InputLabel
								label="Prix de vente (oblig.) "
								name="prix"
								type="number"
								bind:value={prix as number}
							/>
						</div>
						<div class=" border-slate-100p-4 mt-3 flex gap-3 border-t pt-2">
							<ButtonFetching
								title="Brouillon"
								height="h-10"
								color="bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors rounded-lg font-medium"
							/>
							<ButtonFetching
								isFetching={boutiques.isFetching}
								type="button"
								onclick={goNext}
								title="Suivant"
								height="h-10"
								color="bg-cyan-600 text-cyan-50 hover:bg-cyan-500 border border-cyan-300 transition-colors rounded-lg font-medium"
							/>
						</div>
					</div>
					<div class=" flex w-1/2 flex-col overflow-y-auto px-6">
						<Hr d="l" legende="QUANTITE" color="bg-neutral-400/60" />
						<InputLabel
							label="Quatité du produit (oblig.) "
							name="qty"
							type="number"
							bind:value={qty as number}
						/>
						<Hr d="l" legende="REFERENCE" color="bg-neutral-400/60" />
						<div>
							{#if internet !== 'offline'}
							<input bind:this={inputFile} class="hidden" type="file" name="images" accept="image/*" multiple onchange={handleFileChange} />
						{/if}

						{#if imageUrls}
							<div in:fade class="rounded-xl border border-slate-300 bg-white p-2 shadow-sm">
								<ImageSlide url={imageUrls} />
								<button
									type="button"
									onclick={removeImage}
									class="mt-3 w-full flex justify-center items-center gap-2 rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
								>
									<RefreshCcw size={16} /> Changer les images
								</button>
							</div>
						{:else}
							<!-- Zone de Drop/Upload -->
							<div class="relative flex h-48 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white/60 transition-all hover:border-cyan-400 hover:bg-cyan-50/50">
								{#if isLoading}
									<div class="flex flex-col items-center text-cyan-600">
										<Loader2 size={40} class="animate-spin" />
										<span class="mt-2 text-sm font-medium">Traitement en cours...</span>
									</div>
								{:else if internet !== 'offline'}
									<button type="button" onclick={() => inputFile?.click()} class="absolute inset-0 flex h-full w-full flex-col items-center justify-center text-slate-500 hover:text-cyan-600 group">
										<div class="rounded-full bg-slate-100 p-4 mb-3 transition-colors group-hover:bg-cyan-100">
											<UploadCloud size={40} class="text-slate-400 group-hover:text-cyan-500 transition-colors" />
										</div>
										<span class="text-sm font-medium">Cliquez pour téléverser des images</span>
										<span class="mt-1 text-xs text-slate-400">JPG, PNG, WEBP (Max 5MB)</span>
									</button>
								{:else}
									<div class="flex flex-col items-center justify-center p-4 text-center text-red-500">
										<GlobeOff size={40} class="mb-2 text-red-400" />
										<span class="text-sm font-semibold">Connexion requise pour les images</span>
										<button
											onclick={testInternet}
											class="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
										>
											<RefreshCcw size={16} /> Réessayer
										</button>
									</div>
								{/if}
							</div>
						{/if}
						</div>
						<div class=" border-slate-100p-4 mt-3 flex gap-3 border-t pt-2">
							<ButtonFetching
								title="Brouillon"
								height="h-10"
								color="bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors rounded-lg font-medium"
							/>
							<ButtonFetching
								isFetching={isLoading}
								type="button"
								onclick={() => formComplete()}
								title="Créer"
								height="h-10"
								color="bg-cyan-600 text-cyan-50 hover:bg-cyan-500 border border-cyan-300 transition-colors rounded-lg font-medium"
							/>
						</div>
					</div>
				</div>
			</form>
		</div>
	</div>
</div>

<style>
	.fingerAnime {
		animation: finger 1s infinite ease-in;
	}

	@keyframes finger {
		0% {
			transform: translateX(-5px);
		}
		50% {
			transform: translateX(5px);
		}

		100% {
			transform: translateX(-5px);
		}
	}
</style>

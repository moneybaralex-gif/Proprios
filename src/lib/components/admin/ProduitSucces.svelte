<script lang="ts">
	import { 
		CheckCircle, 
		Tag, 
		Package, 
		Wallet, 
		Coins, 
		Archive, 
		Plus, 
		Check 
	} from '@lucide/svelte';
	import { scale, fly, fade } from 'svelte/transition';
	import { quintOut, backOut } from 'svelte/easing';

	let {
		continuer,
		ok,
		produit,
		model,
		qty,
		images = [],
		pA,
		pV,
		stock
	}: {
		continuer: () => void;
		ok: () => void;
		produit: string;
		model?: string;
		qty: number;
		images?: string[];
		pA?: number;
		pV: number;
		stock?: string;
	} = $props();

	const formaterPrix = (prix: number) => {
		return new Intl.NumberFormat('fr-FR').format(prix);
	};
</script>

<!-- BACKDROP (Arrière-plan sombre) : inset-0 est plus fiable que h-screen -->
<div
	in:fade={{ duration: 300 }}
	out:fade={{ duration: 200, delay: 100 }}
	class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm"
>
	<!-- 
		LA CARTE :
		- max-h-[90vh] : 90% de l'écran maximum
		- flex flex-col : Prépare le terrain pour le scroll interne
	-->
    <div 
		class="w-full max-w-lg max-h-[90vh] flex flex-col relative mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
		in:scale={{ duration: 500, start: 0.95, easing: quintOut }}
	>
		<!-- En-tête : shrink-0 empêche cette partie de s'écraser si on manque de place -->
		<div class="shrink-0 bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 p-6 sm:p-8 text-center relative overflow-hidden">
			<!-- Cercle décoratif en fond -->
			<div class="absolute -top-10 -right-10 w-32 h-32 bg-green-200 dark:bg-green-800/30 rounded-full blur-3xl opacity-50"></div>
			
			<div 
				class="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-500 text-white rounded-full shadow-lg shadow-green-500/30 mb-3 sm:mb-4"
				in:scale={{ duration: 600, delay: 200, easing: backOut }}
			>
				<CheckCircle size={36} strokeWidth={2.5} class="sm:w-10 sm:h-10" />
			</div>
			<h2 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white" in:fly={{ y: 20, duration: 400, delay: 300 }}>
				Produit créé avec succès !
			</h2>
			<p class="text-sm sm:text-base text-green-600 dark:text-green-400 font-medium mt-1" in:fly={{ y: 20, duration: 400, delay: 400 }}>
				Il a été ajouté à votre inventaire.
			</p>
		</div>

		<!-- 
			CORPS DU COMPOSANT :
			- overflow-y-auto : Ajoute un scroll vertical si l'écran est trop petit
			- flex-1 : Prend tout l'espace restant
		-->
		<div class="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5 sm:space-y-6">
			
			<!-- Section Images -->
			{#if images && images.length > 0}
				<div 
					class="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
					in:fade={{ duration: 400, delay: 500 }}
				>
					{#each images as imgUrl, index (index)}
						<img 
							src={imgUrl} 
							alt="Aperçu de {produit}" 
							loading="lazy"
							decoding="async"
							class="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm snap-start shrink-0 bg-gray-50"
						/>
					{/each}
				</div>
			{/if}

			<!-- Grille d'informations -->
			<div 
				class="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-100 dark:border-gray-800"
				in:fly={{ y: 20, duration: 500, delay: 600 }}
			>
				<!-- Produit & Modèle -->
				<div class="flex items-start gap-3 sm:col-span-2 pb-2 border-b border-gray-200 dark:border-gray-800">
					<div class="p-2 shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
						<Tag size={20} />
					</div>
					<div class="min-w-0">
						<p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Désignation</p>
						<p class="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
							{produit.toUpperCase()} 
							{#if model}
								<span class="text-gray-400 font-normal text-sm ml-1">- {model.toUpperCase()}</span>
							{/if}
						</p>
					</div>
				</div>

				<!-- Quantité -->
				<div class="flex items-center gap-3">
					<div class="p-2 shrink-0 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
						<Package size={20} />
					</div>
					<div>
						<p class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Quantité</p>
						<p class="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100">{qty} unités</p>
					</div>
				</div>

				<!-- Emplacement -->
				{#if stock}
					<div class="flex items-center gap-3">
						<div class="p-2 shrink-0 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
							<Archive size={20} />
						</div>
						<div class="min-w-0">
							<p class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Emplacement</p>
							<p class="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100 truncate">{stock}</p>
						</div>
					</div>
				{/if}

				<!-- Prix d'achat -->
				{#if pA}
					<div class="flex items-center gap-3">
						<div class="p-2 shrink-0 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
							<Coins size={20} />
						</div>
						<div>
							<p class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Prix Achat</p>
							<p class="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100">{formaterPrix(pA)} $</p>
						</div>
					</div>
				{/if}

				<!-- Prix de vente -->
				<div class="flex items-center gap-3">
					<div class="p-2 shrink-0 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
						<Wallet size={20} />
					</div>
					<div>
						<p class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Prix Vente</p>
						<p class="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100">{formaterPrix(pV)} $</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Actions (Toujours visibles en bas) -->
		<div 
			class="shrink-0 p-5 sm:p-6 pt-0 flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-800"
			in:fly={{ y: 20, duration: 500, delay: 700 }}
		>
			<button 
				onclick={continuer}
				class="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-colors duration-200"
			>
				<Plus size={20} />
				Créer un autre
			</button>
			
			<button 
				onclick={ok}
				class="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
			>
				<Check size={20} />
				C'est bon
			</button>
		</div>
	</div>
</div>

<style>
	/* Cache la barre de scroll pour les images (horizontal) */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	/* Barre de défilement verticale discrète pour le contenu */
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: #cbd5e1; /* slate-300 */
		border-radius: 10px;
	}
	:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: #475569; /* slate-600 */
	}
</style>
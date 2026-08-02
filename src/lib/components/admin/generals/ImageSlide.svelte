<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	// On garde strictement le nom de ta prop "url"
	let { url }: { url: string[] } = $props();

	// SÉCURITÉ 1 : On vérifie que url existe avant d'appeler .length
	let nombreImages = $derived(url ? url.length : 0);

	let indexVisible = $state(1);
	let slider: HTMLDivElement;

	function next() {
		if (!slider || indexVisible >= nombreImages) return;
		slider.scrollBy({ left: slider.clientWidth, behavior: 'smooth' });
		indexVisible += 1;
	}

	function prev() {
		if (!slider || indexVisible <= 1) return;
		slider.scrollBy({ left: -slider.clientWidth, behavior: 'smooth' });
		indexVisible -= 1;
	}
</script>

<div
	class="group relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-md"
>
	<!-- Conteneur du slider -->
	<div
		bind:this={slider}
		class="flex snap-x snap-mandatory overflow-x-auto"
		style="scrollbar-width: none;"
	>
		<!-- SÉCURITÉ 2 : On remet le {#if} au cas où la donnée n'est pas encore chargée -->
		{#if url && url.length > 0}
			<!-- SÉCURITÉ 3 : Retour à (index) pour éviter un crash si 2 images ont la même URL -->
			{#each url as lien, index (index)}
				<div class="flex h-44 min-w-full shrink-0 snap-center items-center justify-center sm:h-80">
					<img
						class="h-full w-full object-cover"
						src={lien}
						alt='produit'
						loading={index === 0 ? 'eager' : 'lazy'}
					/>
				</div>
			{/each}
		{:else}
			<!-- Affichage de secours si aucune image n'est trouvée -->
			<div class="flex h-64 min-w-full items-center justify-center text-neutral-400 sm:h-80">
				Aucune image disponible
			</div>
		{/if}
	</div>

	<!-- Boutons (cachés si on a 1 seule image ou aucune) -->
	{#if nombreImages > 1}
		{#if indexVisible > 1}
			<button
				type="button"
				class="absolute top-1/2 left-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-800 shadow-sm backdrop-blur transition-all hover:scale-110 hover:bg-white"
				onclick={prev}
			>
				<ChevronLeft size={24} />
			</button>
		{/if}

		{#if indexVisible < nombreImages}
			<button
			type="button"
				class="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-800 shadow-sm backdrop-blur transition-all hover:scale-110 hover:bg-white"
				onclick={next}
			>
				<ChevronRight size={24} />
			</button>
		{/if}
	{/if}

</div>


<style>
	div::-webkit-scrollbar {
		display: none;
	}
</style>

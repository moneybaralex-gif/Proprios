<script lang="ts">
	import { ArrowRight, ChevronLeft, FastForward } from '@lucide/svelte';

	let {
		currentStep = 0,
		totalSteps = 6,
		onNext,
		onPrev,
		onSkip
	}: {
		currentStep: number;
		totalSteps: number;
		onNext: () => void;
		onPrev: () => void;
		onSkip: () => void;
	} = $props();
</script>

<div class="flex items-center justify-between w-full max-w-6xl mx-auto px-6 py-4 z-20">
	<!-- Bouton Précédent (masqué sur le 1er step) -->
	{#if currentStep > 0 && currentStep < totalSteps - 1}
		<button
			onclick={onPrev}
			class="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200 group px-3 py-2 rounded-lg hover:bg-white/5 shadow-black border border-white/10 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer :active:scale-95"
		>
			<ChevronLeft class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
			Retour
		</button>
	{:else}
		<div></div>
	{/if}

	<!-- Actions Principales (Suivant & Passer) -->
	{#if currentStep < totalSteps - 1}
		<div class="flex items-center gap-4">
			<button
				onclick={onSkip}
				class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-white/5 shadow-black border border-white/10 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer :active:scale-95"
			>
				Passer
				<FastForward class="w-3.5 h-3.5 opacity-70" />
			</button>

			<button
				onclick={onNext}
				class="relative group overflow-hidden flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-slate-900 bg-linear-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-size-[200%_auto] hover:bg-position-[right_center] transition-all duration-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 cursor-pointer :active:scale-95"
			>
				<span>Suivant</span>
				<ArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
			</button>
		</div>
	{/if}
</div>
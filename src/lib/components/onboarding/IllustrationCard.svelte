<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, badgeText }: { children: Snippet; badgeText?: string; } = $props();
</script>

<div class="relative w-full max-w-lg mx-auto aspect-square flex items-center justify-center p-8 group">
	<!-- Arrière-plan lumineux -->
	<div class="absolute inset-0 bg-linear-to-tr from-emerald-500/10 via-teal-500/5 to-cyan-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700"></div>

	<!-- Carte Glassmorphism Principale -->
	<div class="relative w-full h-full bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-white/20">
		<!-- Filigrane de brillance -->
		<div class="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

		{#if badgeText}
			<div class="absolute top-4 right-4 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border backdrop-blur-md bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
				{badgeText}
			</div>
		{/if}

		{@render children()}
	</div>
</div>
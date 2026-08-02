<script lang="ts">
	import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Layers } from '@lucide/svelte';

	let { onStart }: { onStart: () => void } = $props();
</script>

<div class="w-full h-full flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto space-y-8">
	<!-- Badge central -->
	<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.2)]">
		<ShieldCheck class="w-4 h-4" />
		Prêt pour une expérience sécurisée
	</div>

	<!-- Titre Principal -->
	<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
		Prenez le contrôle total de <br />
		<span class="bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">votre patrimoine foncier</span>
	</h1>

	<!-- Accroche / Slogan -->
	<p class="text-slate-300 text-base sm:text-lg max-w-2xl font-normal">
		Rejoignez la nouvelle référence numérique d'enregistrement, de certification et de gestion immobilière en toute sérénité.
	</p>

	<!-- Grille d'Avantages Rapides -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl pt-4">
		<div class="p-4 rounded-2xl bg-white/2 border border-white/10 flex flex-col items-center">
			<Zap class="w-5 h-5 text-emerald-400 mb-2" />
			<span class="text-xs font-semibold text-white">Rapide</span>
		</div>
		<div class="p-4 rounded-2xl bg-white/2 border border-white/10 flex flex-col items-center">
			<ShieldCheck class="w-5 h-5 text-teal-400 mb-2" />
			<span class="text-xs font-semibold text-white">Certifié</span>
		</div>
		<div class="p-4 rounded-2xl bg-white/2 border border-white/10 flex flex-col items-center">
			<Layers class="w-5 h-5 text-cyan-400 mb-2" />
			<span class="text-xs font-semibold text-white">Transparent</span>
		</div>
		<div class="p-4 rounded-2xl bg-white/2 border border-white/10 flex flex-col items-center">
			<CheckCircle2 class="w-5 h-5 text-indigo-400 mb-2" />
			<span class="text-xs font-semibold text-white">100% Inviolable</span>
		</div>
	</div>

	<!-- CTA Principal -->
	<div class="pt-6">
		<button
			onclick={onStart}
			class="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-slate-950 bg-linear-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-size-[200%_auto] hover:bg-position-[right_center] transition-all duration-500 shadow-[0_0_35px_rgba(16,185,129,0.5)] active:scale-95"
		>
			<span>Commencer dès maintenant</span>
			<ArrowRight class="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
		</button>
	</div>
</div>
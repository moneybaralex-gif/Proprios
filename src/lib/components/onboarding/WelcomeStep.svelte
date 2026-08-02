<script lang="ts">
	import { Sparkles, ShieldCheck, Building, ArrowUpRight } from '@lucide/svelte';
	import IllustrationCard from './IllustrationCard.svelte';

	let { onNext }: { onNext: () => void } = $props();
</script>

<div class="w-full min-h-full my-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 max-w-7xl mx-auto">
	<!-- Contenu Texte (Gauche) -->
	<div class="flex-1 flex flex-col items-start text-left space-y-6 max-w-2xl lg:pl-10 xl:pl-14 lg:pt-6">
		<div class=" lg:translate-x-32 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
			<Sparkles class="w-3.5 h-3.5" />
			Plateforme Immobilière Nouvelle Génération
		</div>

		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
			Sécurisez vos terrains & biens avec <span class=" bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Proprios</span>
		</h1>

		<p class="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
			Proprios est le registre numérique haute fidélité conçu pour éliminer définitivement les conflits de propriété foncière.
		</p>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-2">
			<div class="p-4 rounded-2xl bg-white/3 border border-white/10 backdrop-blur-sm">
				<h4 class="text-white font-semibold text-sm flex items-center gap-2">
					<ShieldCheck class="w-4 h-4 text-emerald-400" /> Mission
				</h4>
				<p class="text-xs text-slate-400 mt-1">Garantir à chaque propriétaire un titre numérique inviolable et authentifié sur le terrain.</p>
			</div>

			<div class="p-4 rounded-2xl bg-white/3 border border-white/10 backdrop-blur-sm">
				<h4 class="text-white font-semibold text-sm flex items-center gap-2">
					<Building class="w-4 h-4 text-cyan-400" /> Tous Types de Biens
				</h4>
				<p class="text-xs text-slate-400 mt-1">Parcelles, terrains, villas, immeubles et locaux d'entreprises.</p>
			</div>
		</div>

		<div class="pt-4">
			<button
				onclick={onNext}
				class="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-slate-900 bg-linear-to-r from-emerald-400 to-teal-300 hover:brightness-110 transition-all duration-300 shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95"
			>
				<span>Découvrir la certification</span>
				<ArrowUpRight class="w-4 h-4" />
			</button>
		</div>
	</div>

	<!-- Illustration Graphique (Droite) -->
	<div class="flex-1 w-full flex items-center justify-center">
		<IllustrationCard badgeText="Protégé par Proprios">
			<div class="relative w-full h-full flex flex-col items-center justify-center">
				<!-- Carte 3D de Terrain Certifié -->
				<div class="w-64 h-44 rounded-2xl bg-linear-to-br from-slate-800 to-slate-950 border border-white/15 p-5 shadow-2xl relative animate-pulse">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 rounded-full bg-emerald-400"></div>
							<span class="text-xs font-mono text-slate-300">PARCELLE #8902</span>
						</div>
						<span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">VERIFIÉ</span>
					</div>
					<div class="mt-4 space-y-2">
						<div class="h-2 bg-slate-700/60 rounded w-3/4"></div>
						<div class="h-2 bg-slate-700/40 rounded w-1/2"></div>
					</div>
					<div class="absolute bottom-3 right-3 flex items-center gap-1 text-[11px] text-slate-400 font-mono">
						<span>GPS: -4.325, 15.322</span>
					</div>
				</div>

				<!-- Floating Badge -->
				<div class="absolute -bottom-2 -left-2 bg-slate-900/90 border border-emerald-500/30 p-3 rounded-xl shadow-xl flex items-center gap-3 backdrop-blur-md">
					<div class="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
						<ShieldCheck class="w-5 h-5" />
					</div>
					<div>
						<div class="text-xs font-semibold text-white">0 Conflit Toléré</div>
						<div class="text-[10px] text-slate-400">Certification Physique & Numérique</div>
					</div>
				</div>
			</div>
		</IllustrationCard>
	</div>
</div>
<script lang="ts">
</script>

<div class="group relative h-20 w-full active:scale-[0.97] cursor-pointer select-none transition-all duration-300">
	<!-- Partie Prix (Badge de droite avec dégradé et ombre diffuse) -->
	<div
		class="absolute right-0 top-0 z-20 flex h-full w-[31%] flex-col justify-center items-center rounded-2xl border border-emerald-500/10 bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/10 transition-all duration-300 group-hover:scale-[1.02] group-hover:translate-x-1 group-hover:shadow-lg group-hover:shadow-emerald-500/20"
	>
		<p class="text-[9px] font-bold tracking-widest uppercase opacity-75">Prix</p>
		<div class="text-base font-black tracking-tight">
			354 $
		</div>
	</div>

	<!-- Partie Informations (Carte principale gauche avec dégradé de fond discret) -->
	<div
		class="absolute left-0 top-0 h-full w-[77%] rounded-2xl border border-slate-100 bg-bg-linear-to-r from-white via-white to-slate-50/40 shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:border-slate-200 group-hover:shadow-md"
	>
		<div class="ml-3.5 flex h-full flex-col justify-between py-2.5 pr-6">
			<!-- Ligne Supérieure -->
			<div class="flex justify-between items-center text-xs">
				<div class="relative">
					<h3 class="tooltip font-extrabold text-slate-800 tracking-tight cursor-help" data-title="G de 8 de petite taille">
						G de 8
					</h3>
				</div>
				<span class="font-bold text-[9px] text-slate-400 bg-slate-100/75 px-1.5 py-0.5 rounded-full border border-slate-200/30">
					Nile
				</span>
			</div>

			<!-- Ligne Milieu -->
			<div class="flex justify-between items-center text-xs">
				<span class="text-slate-500 font-semibold text-[10px]">
					QTY <span class="text-slate-900 font-extrabold ml-1 bg-slate-100 px-1.5 py-0.5 rounded-md">{354}</span>
				</span>
				<span class="font-bold text-[10px] text-amber-700 bg-amber-50/60 border border-amber-100/50 px-2 py-0.5 rounded-md">
					NT : 54
				</span>
			</div>

			<!-- Ligne Inférieure -->
			<div class="flex items-center text-[10px] font-semibold text-slate-400/90">
				<!-- Icône calendrier raffinée -->
				<svg class="mr-1 h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
				<span class="truncate">A.Stock du 15/03/2026</span>
			</div>
		</div>
	</div>
</div>

<style>
	/* Conteneur principal du Tooltip */
	.tooltip::after {
		content: attr(data-title);
		position: absolute;
		bottom: calc(100% + 8px); 
		left: 50%;
		transform: translateX(-50%) scale(0.95);
		transform-origin: bottom center;

		background-color: #0f172a; /* Slate 900 */
		color: #ffffff;
		padding: 5px 9px;
		border-radius: 6px;
		font-size: 10px;
		font-weight: 600;
		white-space: nowrap;
		box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.15);

		opacity: 0;
		pointer-events: none;
		transition: opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
		z-index: 50;
	}

	/* Petite flèche d'ancrage sous le tooltip */
	.tooltip::before {
		content: '';
		position: absolute;
		bottom: calc(100% + 4px);
		left: 50%;
		transform: translateX(-50%) scale(0.95);
		transform-origin: top center;
		
		border-width: 4px 4px 0;
		border-style: solid;
		border-color: #0f172a transparent transparent;

		opacity: 0;
		pointer-events: none;
		transition: opacity 0.12s cubic-bezier(0.16, 1, 0.3, 1), transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);
		z-index: 50;
	}

	/* Affichage combiné au survol */
	.tooltip:hover::after,
	.tooltip:hover::before {
		opacity: 1;
		transform: translateX(-50%) scale(1);
	}
</style>
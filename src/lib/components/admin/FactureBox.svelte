<script lang="ts">
</script>

<button 
	type="button" 
	class="group w-full flex items-stretch rounded-2xl border border-slate-100 bg-white text-left shadow-sm overflow-hidden active:scale-[0.98] transition-all duration-200 hover:shadow-md hover:border-slate-200"
>
	<!-- Partie Gauche (Montant & Référence) -->
	<div class="w-[38%] bg-green-100/70 p-3.5 flex flex-col justify-between items-center border border-dashed border-slate-400 text-center m-1 rounded-l-xl">
		<!-- Référence monospacée -->
		<span class="text-[10px] font-mono tracking-wider text-slate-400">
			#251205121301
		</span>
		
		<!-- Montant Principal -->
		<div class="text-xl font-extrabold text-slate-800 my-1 tracking-tight">
			4 543.54 $
		</div>
		
		<!-- Libellé -->
		<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
			Merbac
		</span>
	</div>

	<!-- Partie Droite (Détails de la transaction) -->
	<div class="w-[62%] flex flex-col justify-between p-3.5 border-r-4 border-amber-500">
		<!-- En-tête : Nom & Date -->
		<div class="flex justify-between items-center">
			<span class="bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
				Alvin
			</span>
			<span class="text-[11px] font-medium text-slate-400">
				Mar. 15-09-2025
			</span>
		</div>

		<!-- Milieu : Moyen de paiement & Statut -->
		<div class="flex justify-between items-center my-2.5">
			<div class="text-xs font-bold text-slate-600">
				CASH : <span class="text-slate-950 font-extrabold">3 454.00 $</span>
			</div>
			
			<!-- Badge Statut avec animation de pouls -->
			<div class="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100/50">
				<span class="relative flex h-1.5 w-1.5">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
				</span>
				En cours
			</div>
		</div>

		<!-- Pied de page : Crédit et NT -->
		<div class="flex justify-between text-[11px] px-2.5 py-1 bg-amber-50/50 rounded-lg text-amber-800 font-semibold border border-amber-100/30">
			<div>Cr : <span class="font-bold text-amber-950">0 $</span></div>
			<div>NT : <span class="font-bold text-amber-950">0</span></div>
		</div>
	</div>
</button>
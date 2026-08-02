<script lang="ts">
	import FactureDetailsAchat from './FactureDetailsAchat.svelte';
	import FactureDetailsPaiement from './FactureDetailsPaiement.svelte';
	import FactureDetailsRetrait from './FactureDetailsRetrait.svelte';
</script>

<div class="max-w-4xl mx-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50 text-slate-800">
	<!-- En-tête de la facture -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4">
		<div class="flex items-center gap-3.5">
			<div class="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
				<img src="/images/logo/logoNoir.png" alt="logo" class="h-10 w-10 object-contain" />
			</div>
			<div>
				<h2 class="text-xs font-bold tracking-widest text-slate-400 uppercase">Facture</h2>
				<h1 class="text-base font-extrabold text-slate-900 tracking-tight">MAISON BEBE PRODUCTION</h1>
			</div>
		</div>
		<div class="text-left sm:text-right">
			<p class="text-xs font-semibold text-slate-400">Date d'émission</p>
			<p class="text-sm font-bold text-slate-800">15/08/2026</p>
			<p class="text-[11px] font-mono mt-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">
				NF : 261730011206
			</p>
		</div>
	</div>

	<!-- Informations client -->
	<div class="my-5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
		<div>
			<span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturé à</span>
			<h3 class="text-base font-extrabold text-slate-950 mt-0.5">MAMA NOELLA</h3>
		</div>
		<div>
			<span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block sm:text-right">Type d'opération</span>
			<span class="inline-block text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100/50 mt-1">
				Achat initial
			</span>
		</div>
	</div>

	<!-- Tableau d'Achat Initial -->
	<div class="mt-6">
		<div class="grid w-full grid-cols-[repeat(20,1fr)] bg-green-200/70 border-y border-slate-100 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
			<div class="col-start-1 col-end-3 text-center">QTY</div>
			<div class="col-start-3 col-end-9 text-left px-3">Produits</div>
			<div class="col-start-9 col-end-12 text-center">Mark</div>
			<div class="col-start-12 col-end-15 text-center">Prix.U</div>
			<div class="col-start-15 col-end-18 text-center">Prix.T</div>
			<div class="col-start-18 col-end-21 text-center">NT</div>
		</div>

		<div class="divide-y divide-slate-50">
			<FactureDetailsAchat qty={23} produit="G DE 8" mark="NILE" prixU={37.5} nt={3} />
			<FactureDetailsAchat qty={21} produit="G DE 8" mark="NILE" prixU={37.5} nt={7} />
			<FactureDetailsAchat qty={23} produit="G DE 8" mark="NILE" prixU={37.5} nt={12} />
			<FactureDetailsAchat qty={23} produit="G DE 8" mark="NILE" prixU={37.5} nt={4} />
		</div>

		<!-- Ligne du Total -->
		<div class="flex justify-end items-center py-4 border-b border-slate-100">
			<div class="flex items-center gap-3">
				<span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Montant Total :</span>
				<span class="text-base font-black text-slate-900 bg-slate-100/80 px-3.5 py-1.5 rounded-xl border border-slate-200/50">
					4 345 $
				</span>
			</div>
		</div>
	</div>

	<!-- Section des Paiements (Encadré Vert) -->
	<div class="my-5 p-4 rounded-2xl border border-emerald-100/60 bg-emerald-50/10">
		<div class="flex items-center gap-2 mb-3">
			<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
			<h3 class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Historique des Paiements</h3>
		</div>
		
		<div class="grid w-full grid-cols-[repeat(20,1fr)] border-b border-emerald-100/40 pb-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600/70">
			<div class="col-start-1 col-end-3">N°</div>
			<div class="col-start-3 col-end-8">Date</div>
			<div class="col-start-8 col-end-12">Montant</div>
			<div class="col-start-12 col-end-16">Crédit</div>
			<div class="col-start-16 col-end-21">Resp.</div>
		</div>
		
		<div class="space-y-1">
			<FactureDetailsPaiement
				n="FS43"
				date="12/08/2025"
				montant={4234}
				credit={0}
				responsable="Niver"
			/>
		</div>
	</div>

	<!-- Section des Retraits (Encadré Neutre) -->
	<div class="my-5 p-4 rounded-2xl border border-slate-200/60 bg-slate-50/30">
		<div class="flex items-center gap-2 mb-3">
			<span class="h-2 w-2 rounded-full bg-slate-400"></span>
			<h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Historique des Retraits</h3>
		</div>
		
		<div class="grid w-full grid-cols-[repeat(20,1fr)] border-b border-slate-200/50 pb-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
			<div class="col-start-1 col-end-2 px-1">N°</div>
			<div class="col-start-2 col-end-7 px-1">Date</div>
			<div class="col-start-7 col-end-12 px-1">Produit</div>
			<div class="col-start-12 col-end-15 px-1">Qty</div>
			<div class="col-start-15 col-end-18 px-1">Reste</div>
			<div class="col-start-18 col-end-21 px-1">Resp.</div>
		</div>
		
		<div class="space-y-1">
			<FactureDetailsRetrait
				n={1}
				date="12/08/2025"
				produit="G DE 8"
				qty={10}
				reste={35}
				responsable="Niver"
			/>
		</div>
	</div>
</div>
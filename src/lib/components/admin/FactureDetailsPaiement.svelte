<script lang="ts">
	let { n, date, montant, credit, responsable } : { n: string, date: string, montant: number, credit: number, responsable: string } = $props()
</script>

<div class="grid w-full grid-cols-[repeat(20,1fr)] items-center py-2 text-sm border-b border-emerald-100/20 text-slate-700 hover:bg-emerald-50/40 transition-colors duration-150">
	<!-- N° de reçu (Format police code) -->
	<div class="col-start-1 col-end-3 px-1 font-mono text-xs text-slate-400">
		{n}
	</div>

	<!-- Date du paiement -->
	<div class="col-start-3 col-end-8 px-1 text-xs text-slate-500 font-medium">
		{date}
	</div>

	<!-- Montant versé (Vert émeraude) -->
	<div class="col-start-8 col-end-12 px-1 font-bold text-emerald-700">
		{montant} $
	</div>

	<!-- Crédit / Reste à payer (Dynamique) -->
	<div class="col-start-12 col-end-16 px-1 font-semibold {credit > 0 ? 'text-amber-600' : 'text-slate-400'}">
		{credit} $
	</div>

	<!-- Responsable de la saisie (Aligné à droite) -->
	<div class="col-start-16 col-end-21 px-1 font-medium text-slate-600 text-right pr-1">
		{responsable}
	</div>
</div>
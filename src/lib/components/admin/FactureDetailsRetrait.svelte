<script lang="ts">
	let { n, date, produit, qty, reste, responsable } : { n: number, date: string, produit: string, qty: number, reste: number, responsable: string } = $props()
</script>

<div class="grid w-full grid-cols-[repeat(20,1fr)] items-center py-2 text-sm border-b border-slate-200/20 text-slate-700 hover:bg-slate-50/50 transition-colors duration-150">
	<!-- N° de retrait (Format police code) -->
	<div class="col-start-1 col-end-2 px-1 font-mono text-xs text-slate-400">
		{n}
	</div>

	<!-- Date du retrait -->
	<div class="col-start-2 col-end-7 px-1 text-xs text-slate-500 font-medium">
		{date}
	</div>

	<!-- Produit retiré -->
	<div class="col-start-7 col-end-12 px-1 font-semibold text-slate-800 truncate">
		{produit}
	</div>

	<!-- Quantité retirée (Mis en avant) -->
	<div class="col-start-12 col-end-15 px-1 font-bold text-slate-900">
		{qty}
	</div>

	<!-- Quantité restante (Grisé si complet) -->
	<div class="col-start-15 col-end-18 px-1 font-semibold {reste > 0 ? 'text-slate-700' : 'text-slate-300'}">
		{reste}
	</div>

	<!-- Responsable de l'opération (Aligné à droite) -->
	<div class="col-start-18 col-end-21 px-1 font-medium text-slate-500 text-right pr-1 truncate">
		{responsable}
	</div>
</div>
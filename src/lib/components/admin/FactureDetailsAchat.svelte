<script lang="ts">
	let { qty, produit, mark, prixU, nt } : { qty: number, produit: string, mark: string, prixU: number, nt: number } = $props()
</script>

<div class=" even:bg-green-50 grid w-full grid-cols-[repeat(20,1fr)] items-center py-2.5 text-sm font-medium border-b border-slate-100 text-slate-600 hover:bg-slate-50/80 transition-colors duration-150">
	<!-- Quantité (Badge) -->
	<div class="col-start-1 col-end-3 flex justify-center">
		<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 text-xs font-bold text-slate-600 min-w-8">
			{qty}
		</span>
	</div>

	<!-- Produit (Aligné à gauche avec marge) -->
	<div class="col-start-3 col-end-9 text-left px-3 font-semibold text-slate-800 truncate">
		{produit}
	</div>

	<!-- Marque (Badge discret) -->
	<div class="col-start-9 col-end-12 flex justify-center text-xs">
		<span class="bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-md text-slate-500 font-medium">
			{mark}
		</span>
	</div>

	<!-- Prix Unitaire -->
	<div class="col-start-12 col-end-15 text-center text-slate-500">
		{prixU} $
	</div>

	<!-- Total (Mis en valeur) -->
	<div class="col-start-15 col-end-18 text-center font-bold text-slate-900">
		{prixU * qty} $
	</div>

	<!-- NT -->
	<div class="col-start-18 col-end-21 text-center text-md font-semibold text-amber-500">
		{nt}
	</div>
</div>
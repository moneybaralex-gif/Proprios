<script lang="ts">
	import { CheckCircle2, Info, XCircle } from "@lucide/svelte";
	import type { Snippet } from "svelte";

	let {
		title,
		valeur,
		unite,
		tag,
		status = "ok",
		children
	}: { 
		title: string, 
		valeur: number, 
		unite: string, 
		tag?: string, 
		status?: 'ok' | 'no' | 'wait', 
		children: Snippet 
	} = $props();

	// Svelte 5 : Configuration dynamique dérivée du statut
	const theme = $derived({
		ok: {
			border: "border-slate-100 hover:border-emerald-200 hover:shadow-emerald-500/5",
			accentBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
			statusBadge: "bg-emerald-50 text-emerald-600 border-emerald-100"
		},
		no: {
			border: "border-rose-100 hover:border-rose-200 hover:shadow-rose-500/5",
			accentBg: "bg-gradient-to-br from-rose-500 to-red-600 text-white",
			statusBadge: "bg-rose-50 text-rose-600 border-rose-100"
		},
		wait: {
			border: "border-amber-100 hover:border-amber-200 hover:shadow-amber-500/5",
			accentBg: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
			statusBadge: "bg-amber-50 text-amber-600 border-amber-100"
		}
	}[status]);
</script>

<button 
	class="group flex w-full items-stretch rounded-2xl border bg-white text-left shadow-sm select-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] cursor-pointer {theme.border}"
>
	<!-- Bloc icône principal (Gauche) -->
	<div class="w-[28%] flex justify-center items-center rounded-l-2xl {theme.accentBg}">
		<div class="transition-transform duration-300 group-hover:scale-125">
			{@render children()}
		</div>
	</div>

	<!-- Informations textuelles (Milieu) -->
	<div class="w-[56%] flex flex-col justify-between py-3.5 px-4">
		<span class="text-[12px] font-black tracking-widest text-slate-400 uppercase text-nowrap">
			{title}
		</span>
		
		<div class=" flex items-center gap-3 text-lg font-black text-slate-900 tracking-tight my-0.5">
			{valeur} 
			<span class="text-md font-medium text-slate-400 tracking-normal ml-0.5">
				{unite}
			</span>
		</div>
		
		{#if tag}
			<span class="text-[12px] font-semibold text-slate-400/90 truncate">
				{tag}
			</span>
		{/if}
	</div>

	<!-- Indicateur de Statut (Droite) -->
	<div class="w-[16%] flex justify-center items-center pr-3">
		<div class="p-1.5 rounded-full border transition-transform duration-300 group-hover:scale-110 {theme.statusBadge}">
			{#if status === 'no'}
				<XCircle class="w-4 h-4" />
			{:else if status === 'wait'}
				<Info class="w-4 h-4" />
			{:else}
				<CheckCircle2 class="w-4 h-4" />
			{/if}
		</div>
	</div>
</button>
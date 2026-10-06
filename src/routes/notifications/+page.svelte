<script lang="ts">
	import { enhance } from '$app/forms';
	import { Bell, CheckCircle2, AlertCircle, MessageCircle } from '@lucide/svelte';

	// 1. On définit la structure exacte d'une notification (fini le "any")
	interface NotificationItem {
		title: string;
		content: string;
		createdAt: string | number | Date;
		isRead: boolean;
	}

	let { data } = $props();

	// 2. On type le paramètre 'n' avec notre nouvelle interface
	const icon = (n: NotificationItem) =>
		n.title.toLowerCase().includes('message')
			? MessageCircle
			: n.title.toLowerCase().includes('échec')
				? AlertCircle
				: CheckCircle2;
</script>

<div class="mx-auto max-w-3xl px-4 py-5">
	<div class="pt-3">
		<p class="text-sm font-semibold text-emerald-300">Centre d’activité</p>
		<h1 class="text-3xl font-black">Notifications</h1>
	</div>
	
	<form method="POST" action="?/readAll" use:enhance class="mt-4 text-right">
		<button class="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold">Tout marquer comme lu</button>
	</form>
	
	<div class="mt-3 space-y-2">
		{#each data.notifications as n, index (index)}
			{@const Icon = icon(n)}
			
			<!-- Optimisation Svelte : utilisation de 'class:opacity-60={...}' au lieu des backticks -->
			<article class="card flex gap-3 p-4" class:opacity-60={n.isRead}>
				<div class="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
					<Icon size={18} />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex justify-between gap-2">
						<b>{n.title}</b>
						<span class="text-[10px] text-slate-500">
							{new Date(n.createdAt).toLocaleString()}
						</span>
					</div>
					<p class="mt-1 text-sm text-slate-400">{n.content}</p>
				</div>
			</article>
		{:else}
			<div class="py-20 text-center text-slate-500">
				<Bell class="mx-auto mb-3" />
				<p>Aucune notification.</p>
			</div>
		{/each}
	</div>
</div>
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { House, MessageCircle, UserRound } from '@lucide/svelte';
	import { wsService } from '$lib/client/ws.svelte';

	const tabs = [
		{ href: '/', label: 'Accueil', Icon: House },
		{ href: '/chat', label: 'Chat', Icon: MessageCircle },
		{ href: '/owner', label: 'Propriétaire', Icon: UserRound }
	] as const;

	let touchX = 0;
	let touchY = 0;

	onMount(() => {
		wsService.connect();
	});

	$effect(() => {
		if (page.url.pathname === '/chat') {
			wsService.hasUnread = false;
		}
	});

	function handleTouchStart(e: TouchEvent) {
		touchX = e.touches[0]?.clientX ?? 0;
		touchY = e.touches[0]?.clientY ?? 0;
	}

	function handleTouchEnd(e: TouchEvent) {
		const touch = e.changedTouches[0];
		if (!touch) return;

		const dx = touch.clientX - touchX;
		const dy = touch.clientY - touchY;

		// Évite de déclencher le changement de page lors d'un défilement vertical
		if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

		const currentIndex = tabs.findIndex((tab) => tab.href === page.url.pathname);
		if (currentIndex === -1) return;

		const nextIndex = currentIndex + (dx < 0 ? 1 : -1);
		if (tabs[nextIndex]) {
			goto(tabs[nextIndex].href);
		}
	}
</script>

<div
	class="fixed inset-x-0 bottom-0 z-50 pointer-events-none px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
	role="region"
	aria-label="Navigation mobile"
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
>
	<nav
		class="glass pointer-events-auto mx-auto flex max-w-sm items-center justify-between rounded-3xl p-1.5 shadow-2xl backdrop-blur-xl border border-white/10"
		aria-label="Navigation principale"
	>
		{#each tabs as tab, _ (tab.href)}
			{@const active = page.url.pathname === tab.href}
			{@const Icon = tab.Icon}

			<a
				href={tab.href}
				data-sveltekit-preload-data="hover"
				class="relative flex flex-1 flex-col items-center justify-center py-2 px-1 text-xs font-bold transition-all duration-300 select-none {active
					? 'text-slate-950 font-black'
					: 'text-slate-400 hover:text-slate-200'}"
				aria-current={active ? 'page' : undefined}
			>
				<!-- Pilule d'arrière-plan animée pour l'onglet actif -->
				{#if active}
					<span
						class="absolute inset-0 rounded-2xl bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)] transition-all duration-300"
					></span>
				{/if}

				<div class="relative z-10 flex flex-col items-center gap-1 transition-transform duration-200 {active ? 'scale-105' : 'hover:scale-100'}">
					<div class="relative">
						<Icon size={20} strokeWidth={active ? 2.5 : 2} />

						{#if tab.label === 'Chat' && wsService.hasUnread && !active}
							<span
								class="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse"
								aria-label="Nouveau message"
							></span>
						{/if}
					</div>

					<span class="text-[11px] leading-none tracking-tight">{tab.label}</span>
				</div>
			</a>
		{/each}
	</nav>
</div>
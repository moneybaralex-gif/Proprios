<script lang="ts">
	import { toast } from '$lib/services/notification.svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import { CheckCircle2, XCircle, Info, X } from '@lucide/svelte';

	function slideDown(node: HTMLElement, params: { duration?: number } = {}) {
		const { duration = 300 } = params;
		const height = node.offsetHeight;
		const style = getComputedStyle(node);
		const paddingTop = parseFloat(style.paddingTop);
		const paddingBottom = parseFloat(style.paddingBottom);
		const marginTop = parseFloat(style.marginTop);
		const marginBottom = parseFloat(style.marginBottom);

		return {
			duration,
			easing: cubicOut,
			css: (t: number, u: number) => `
                transform: translateY(${-u * 100}%);
                opacity: ${t};
                height: ${t * height}px;
                padding-top: ${t * paddingTop}px;
                padding-bottom: ${t * paddingBottom}px;
                margin-top: ${t * marginTop}px;
                margin-bottom: ${t * marginBottom}px;
                overflow: hidden;
            `
		};
	}

	const typeConfig = {
		success: {
			icon: CheckCircle2,
			colors: 'text-emerald-600',
			badge: 'bg-emerald-500'
		},
		error: {
			icon: XCircle,
			colors: 'text-red-600',
			badge: 'bg-red-500'
		},
		info: {
			icon: Info,
			colors: 'text-amber-600',
			badge: 'bg-amber-500'
		}
	};
</script>

<!-- ═══════════════════════════════════════════════════
     CONTENEUR PRINCIPAL - Centré en haut
     ═══════════════════════════════════════════════════ -->
<div class="pointer-events-none fixed top-4 left-1/2 z-9999 flex -translate-x-1/2 flex-col items-center gap-2">
	{#each toast.toutes as n (n.id)}
		{@const config = typeConfig[n.type]}
		{@const Icon = config.icon}

		<div
			animate:flip={{ duration: 200, easing: cubicOut }}
			in:fly={{ y: -30, duration: 300, easing: cubicOut }}
			out:slideDown={{ duration: 250 }}
			class="
				group pointer-events-auto relative
				inline-flex items-center gap-3
				rounded-full px-4 py-2.5
				bg-white/95 backdrop-blur-xl
				shadow-[0_8px_32px_rgba(0,0,0,0.12)]
				border border-white-200/60
				transition-all duration-200
				hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)]
				hover:-translate-y-0.5
				dark:bg-white-900/95
				dark:border-white-700/40
				dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
				dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]
				max-w-[90vw] md:max-w-md
			"
			role="alert"
		>
			<!-- Indicateur de statut (petit point) -->
			<div class="relative shrink-0">
				<div class="h-2.5 w-2.5 rounded-full {config.badge} ring-2 ring-white/80 dark:ring-white-800/80"></div>
			</div>

			<!-- Icône -->
			<Icon size={16} strokeWidth={2.5} class="{config.colors} shrink-0" />

			<!-- Message -->
			<p class="text-sm font-medium text-white-700 dark:text-white-200 whitespace-nowrap">
				{n.message}
			</p>

			<!-- Bouton fermer -->
			<button
				onclick={() => toast.supprimer(n.id)}
				class="
					shrink-0 rounded-full p-1
					text-white-400 hover:text-white-600
					hover:bg-white-100/80
					transition-all duration-200 hover:rotate-90
					dark:text-white-500 dark:hover:text-white-300
					dark:hover:bg-white-700/30
					focus:outline-none focus:ring-2 focus:ring-white-300/50
				"
				aria-label="Fermer"
			>
				<X size={14} strokeWidth={2.5} />
			</button>
		</div>
	{/each}
</div>
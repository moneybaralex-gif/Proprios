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
			iconColor: 'text-emerald-400',
			iconBg: 'bg-emerald-500/10',
			iconRing: 'ring-emerald-500/20',
			dot: 'bg-emerald-400',
			glow: 'shadow-[0_0_20px_rgba(52,211,153,0.12)]'
		},

		error: {
			icon: XCircle,
			iconColor: 'text-red-400',
			iconBg: 'bg-red-500/10',
			iconRing: 'ring-red-500/20',
			dot: 'bg-red-400',
			glow: 'shadow-[0_0_20px_rgba(248,113,113,0.12)]'
		},

		info: {
			icon: Info,
			iconColor: 'text-amber-400',
			iconBg: 'bg-amber-500/10',
			iconRing: 'ring-amber-500/20',
			dot: 'bg-amber-400',
			glow: 'shadow-[0_0_20px_rgba(251,191,36,0.12)]'
		}
	};
</script>

<!--
	════════════════════════════════════════════════════
	TOAST CONTAINER
	════════════════════════════════════════════════════
-->
<div
	class="
		pointer-events-none fixed
		top-5 left-1/2
		z-9999
		flex -translate-x-1/2
		flex-col items-center
		gap-2.5
	"
>
	{#each toast.toutes as n (n.id)}
		{@const config = typeConfig[n.type]}
		{@const Icon = config.icon}

		<div
			animate:flip={{ duration: 220, easing: cubicOut }}
			in:fly={{ y: -35, duration: 350, easing: cubicOut }}
			out:slideDown={{ duration: 280 }}
			role="alert"
			class="
				group pointer-events-auto relative

				flex items-center gap-3

				max-w-[calc(100vw-2rem)]
				md:max-w-md

				rounded-2xl

				border border-white/8

				bg-[#111113]/95

				px-3.5 py-3

				backdrop-blur-2xl

				shadow-[0_16px_50px_rgba(0,0,0,0.55)]

				transition-all duration-300

				hover:-translate-y-0.5
				hover:border-white/13
				hover:bg-[#151517]/95

				{config.glow}
			"
		>
			<!--
				══════════════════════════════
				ICÔNE DE TYPE
				══════════════════════════════
			-->
			<div
				class="
					flex h-9 w-9 shrink-0
					items-center justify-center
					rounded-xl
					{config.iconBg}
					ring-1 {config.iconRing}
				"
			>
				<Icon
					size={18}
					strokeWidth={2.2}
					class={config.iconColor}
				/>
			</div>

			<!--
				══════════════════════════════
				CONTENU
				══════════════════════════════
			-->
			<div class="min-w-0 flex-1">
				<p
					class="
						text-sm
						font-medium
						leading-5
						text-zinc-100
						whitespace-normal
						wrap-break-word
					"
				>
					{n.message}
				</p>
			</div>

			<!--
				══════════════════════════════
				INDICATEUR DE TYPE
				══════════════════════════════
			-->
			<div class="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
				<div
					class="
						absolute
						h-4 w-4
						rounded-full
						{config.dot}
						opacity-20
						animate-ping
					"
				></div>

				<div
					class="
						relative
						h-1.5 w-1.5
						rounded-full
						{config.dot}
					"
				></div>
			</div>

			<!--
				══════════════════════════════
				BOUTON FERMER
				══════════════════════════════
			-->
			<button
				onclick={() => toast.supprimer(n.id)}
				aria-label="Fermer la notification"
				class="
					flex h-7 w-7
					shrink-0
					items-center justify-center

					rounded-lg

					text-zinc-500

					transition-all duration-200

					hover:bg-white/[0.07]
					hover:text-zinc-200

					active:scale-90

					focus:outline-none
					focus:ring-2
					focus:ring-white/10
				"
			>
				<X
					size={15}
					strokeWidth={2}
				/>
			</button>

			<!--
				══════════════════════════════
				LÉGER REFLET SUPÉRIEUR
				══════════════════════════════
			-->
			<div
				class="
					pointer-events-none
					absolute inset-x-4 top-0
					h-px
					bg-linear-to-r
					from-transparent
					via-white/10
					to-transparent
				"
			></div>
		</div>
	{/each}
</div>
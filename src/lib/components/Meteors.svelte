<script lang="ts">
	import { cn } from "$lib/utils/meteors-utils";

	type MeteorStyle = {
		top: number;
		left: string;
		animationDelay: string;
		animationDuration: string;
	};

	interface Props {
		number?: number;
		class?: string;
	}

	let { number = 10, class: className }: Props = $props();

	let meteorStyles = $derived<MeteorStyle[]>([]);

	function generateMeteors(count: number): MeteorStyle[] {
		return Array.from({ length: count }, () => ({
			top: -20,
			left: Math.floor(Math.random() * 700) + "px",
			animationDelay: Math.random() * 1 + 0.2 + "s",
			animationDuration: Math.floor(Math.random() * 8 + 2.9) + "s"
		}));
	}

	$effect(() => {
		meteorStyles = generateMeteors(number);
	});
</script>

{#each meteorStyles as style, idx (idx)}
	<!--
	  MODIFICATIONS TÊTE DE MÉTÉORE :
	  - `size-1.5` (6px x 6px) au lieu de `size-[2.4px]`
	  - `bg-white` au lieu de `bg-slate-500`
	  - `shadow-[0_0_10px_2px_#ffffff]` pour créer un halo lumineux
	-->
	<span
		id="meteor-{idx + 1}"
		class={cn(
			"pointer-events-none absolute left-1/2 top-1/2 size-1.5 rotate-215 animate-meteor rounded-full bg-white shadow-[0_0_10px_2px_#ffffff]",
			className
		)}
		style="top: {style.top}px; left: {style.left}; animation-delay: {style.animationDelay}; animation-duration: {style.animationDuration};"
	>
		<!--
		  MODIFICATIONS QUEUE DE MÉTÉORE :
		  - `h-0.5` (2px d'épaisseur) au lieu de `h-px` (1px)
		  - `w-28` (112px de long) au lieu de `w-12.5` (50px)
		  - `from-white via-blue-500/50` pour un dégradé plus lumineux
		-->
		<div
			class="pointer-events-none absolute top-1/2 -z-10 h-0.5 w-28 -translate-y-1/2 bg-linear-to-r from-white via-blue-100/50 to-transparent"
		></div>
	</span>
{/each}
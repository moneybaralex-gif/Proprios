<script lang="ts">
	let {
		d = 'v',
		color,
		legende
	}: { d?: 'v' | 'h' | 'l'; legende?: string; color?: string } = $props();
</script>

{#if d === 'v'}
	<div class=" h-full w-px ${color ? `${color}` : 'bg-neutral-400'}"></div>
{/if}

{#if d === 'h'}
	<div class=" h-px w-full ${color ? `${color}` : 'bg-neutral-400'}"></div>
{/if}

{#if d === 'l' && legende}
	<div class=" flex items-center gap-4 w-full my-2">
		<div class={` h-px w-full ${color? color : 'bg-neutral-400'}`}></div>
		<div class=" text-neutral-400" >{legende.toUpperCase()}</div>
		<div class={` h-px w-full ${color? color : 'bg-neutral-400'}`}></div>
	</div>
{/if}

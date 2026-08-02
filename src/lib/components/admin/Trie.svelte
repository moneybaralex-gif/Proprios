<script lang="ts">
    import { ChevronDownCircle, Loader2 } from '@lucide/svelte';
    import { fly, scale } from 'svelte/transition';

    type Orientation = 'vertical' | 'horizontal';
    let menuOption: HTMLDivElement | undefined = $state();

    let { 
		isFetching,
        options, 
        direction = 'vertical', 
        title = "Trier par",
        // NOUVEAU : On utilise $bindable(). 
        // Par défaut, il prend la première option.
        value = $bindable(options?.[0]),
        name
    }: { 
		isFetching? : boolean,
        options: string[] | number[] | Date[] | undefined, 
        direction?: Orientation, 
        title?: string,
        value?: string  | number | Date | null,
        name?:string
    } = $props();

    let open = $state(false);

    function handleClick(event: MouseEvent) {
        if (menuOption && !menuOption.contains(event.target as Node)) {
            open = false;
        }
    }
</script>

<svelte:window onclick={handleClick} />

<div class="relative w-full text-sm font-medium">
<input type="hidden" name={name} value={value}>
	<!-- Bouton de sélection (Trigger) -->
	<button
		class="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-cyan-500 hover:shadow-md focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
		onclick={(e) => {
			e.stopPropagation();
			open = !open;
		}}
	>
		<!-- Étiquette (Label) -->
		<div
			class="flex h-10 items-center justify-center rounded-l-xl border-r border-cyan-100 bg-cyan-700 px-4 text-cyan-50 transition-colors group-hover:bg-cyan-600"
		>
			{title}
		</div>

		<!-- Valeur Actuelle et Icône -->
		<div class="flex flex-1 items-center justify-between px-4 text-slate-700">
			<span class="truncate">{value}</span>
			{#if isFetching}
				<div in:scale out:scale><Loader2 class='animate-spin'size={18}/></div>
				{:else}
				<ChevronDownCircle
				class={`size-4.5 text-slate-400 transition-transform duration-300 group-hover:text-cyan-600 ${open ? 'rotate-180 text-cyan-600' : ''}`}
			/>
			{/if}
		</div>
	</button>

	<!-- Menu Déroulant (Dropdown) -->
	{#if open}
		<div
			bind:this={menuOption}
			class={` absolute top-12 right-0 z-50 w-full rounded-xl border border-slate-100 bg-white p-1.5 shadow-md shadow-black/40 ${
				direction === 'vertical' ? 'flex flex-col' : 'flex flex-row flex-wrap gap-1'
			}`}
			in:fly={{ y: -10, duration: 250, opacity: 0 }}
			out:fly={{ y: -10, duration: 150, opacity: 0 }}
		>
			{#each options as option, index (index)}
				<button
					class={`flex items-center rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 
                        ${direction === 'horizontal' ? 'flex-1 justify-center' : 'w-full'}
                        ${
													value === option
														? 'bg-cyan-50 font-semibold text-cyan-700'
														: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
												}
                    `}
					onclick={(e) => {
						e.stopPropagation();
						value = option;
						open = false;
					}}
				>
					{option}
				</button>
			{/each}
		</div>
	{/if}
</div>

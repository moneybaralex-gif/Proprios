<script lang="ts">
	let { currentStep = 0, totalSteps = 5 }: { currentStep: number; totalSteps: number } = $props();
</script>

<div class="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
    
    
    
    
    {#each Array.from({ length: totalSteps }, (_, index) => index) as index (index)}
    
    <div class="relative flex items-center justify-center">
        <div
				class="h-2 rounded-full transition-all duration-500 ease-out {index === currentStep
					? 'w-8 bg-linear-to-r from-emerald-400 to-teal-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
					: index < currentStep
                    ? 'w-2 bg-emerald-500/60'
                    : 'w-2 bg-white/20'}"
			></div>
		</div>
        {/each}
        <span class="ml-2 text-xs font-mono font-medium text-slate-400">
            0{currentStep + 1} / 0{totalSteps}
        </span>
    </div>
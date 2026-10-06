<script lang="ts">
	let { aspect = '4 / 3' }: { aspect?: string } = $props();
</script>

<div class="card plot-card overflow-hidden" aria-hidden="true">
	<div class="plot-image-wrap skeleton-shimmer" style="aspect-ratio:{aspect}"></div>
	<div class="flex flex-col gap-2 p-3">
		<div class="skeleton-shimmer h-3 w-3/4 rounded-md"></div>
		<div class="skeleton-shimmer h-2.5 w-1/2 rounded-md"></div>
		<div class="skeleton-shimmer mt-1 h-3 w-1/3 rounded-md"></div>
	</div>
</div>
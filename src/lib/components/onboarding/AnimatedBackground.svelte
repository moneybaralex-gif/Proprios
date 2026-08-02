<script lang="ts">
	let { currentStep = 0 }: { currentStep: number } = $props();

	// Varier légèrement les positions de halos selon l'étape
	const haloPositions = [
		'top-[-10%] left-[-10%]',
		'top-[20%] right-[-10%]',
		'bottom-[-10%] left-[20%]',
		'top-[10%] right-[20%]',
		'bottom-[10%] right-[-5%]',
		'top-[-5%] left-[30%]'
	];
</script>

<div class="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#07080C]">
	<!-- Grille vectorielle en filigrane -->
	<div 
		class="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] bg-size-[24px_24px] opacity-60"
	></div>

	<!-- Halo lumineux principal -->
	<div
		class="absolute w-150 h-150 rounded-full blur-[140px] opacity-25 transition-all duration-1000 ease-out bg-linear-to-tr from-emerald-500 via-teal-500 to-cyan-500 {haloPositions[currentStep] || haloPositions[0]}"
	></div>

	<!-- Halo lumineux secondaire -->
	<div
		class="absolute w-125 h-125 rounded-full blur-[120px] opacity-15 transition-all duration-1000 ease-out bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 bottom-[-10%] right-[-10%]"
	></div>

	<!-- Overlay vignettage -->
	<div class="absolute inset-0 bg-radial from-transparent via-[#07080C]/70 to-[#07080C]"></div>
</div>
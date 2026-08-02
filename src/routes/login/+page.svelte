<script lang="ts">
	import AnimatedBackground from '$lib/components/onboarding/AnimatedBackground.svelte';
	import ProgressIndicator from '$lib/components/onboarding/ProgressIndicator.svelte';
	import StepNavigation from '$lib/components/onboarding/StepNavigation.svelte';

	import WelcomeStep from '$lib/components/onboarding/WelcomeStep.svelte';
	import CertificationStep from '$lib/components/onboarding/CertificationStep.svelte';
	import SecurityStep from '$lib/components/onboarding/SecurityStep.svelte';
	import MarketplaceStep from '$lib/components/onboarding/MarketplaceStep.svelte';
	import FinalStep from '$lib/components/onboarding/FinalStep.svelte';
	import AuthStep from '$lib/components/onboarding/AuthStep.svelte';
	import { toast } from '$lib/services/notification.svelte';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';

	let currentStep = $state(0);
	const totalSteps = 6;
	let timeOut: ReturnType<typeof setInterval>;

	function onSuccessSingUp() {
		toast.ajouter('Connexion réussie !', 'success');
		timeOut = setTimeout(() => {
			goto('/');
		}, 2000);
	}

	function onSuccessSignIn() {
		toast.ajouter('Création de compte réussie !', 'success');
		timeOut = setTimeout(() => {
			goto('/');
		}, 2000);
	}

	onDestroy(() => {
		clearTimeout(timeOut);
	});

	function nextStep() {
		if (currentStep < totalSteps - 1) {
			currentStep += 1;
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep -= 1;
		}
	}

	function skipToAuth() {
		currentStep = 5;
	}
</script>

<svelte:head>
	<title>Proprios — Plateforme Sécurisée de Propriété Foncière</title>
</svelte:head>

<!-- Arrière-plan animé global -->
<AnimatedBackground {currentStep} />

<!-- Main Container avec 100dvh (Dynamic Viewport Height pour mobile) -->
<main class="relative z-10 h-dvh w-screen overflow-hidden bg-[#07080C] select-none">
	<!-- Header Flottant Fixe Haut (avec Glassmorphism subtil) -->
	<header class="pointer-events-none absolute inset-x-0 top-0 z-30 px-6 py-4 sm:py-6">
		<div class="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between">
			<!-- Logo -->
			<div
				class="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-2 pr-4 backdrop-blur-md"
			>
				<div
					class="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-400 to-teal-300 text-lg font-black text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
				>
					P
				</div>
				<span class="font-mono text-lg font-bold tracking-tight text-white">PROPRIOS</span>
			</div>

			<!-- Indicateur de progression (masqué à la dernière étape) -->
			{#if currentStep < 5}
				<div class="pointer-events-auto">
					<ProgressIndicator {currentStep} totalSteps={5} />
				</div>
			{/if}
		</div>
	</header>

	<!-- Slider Horizontal Container -->
	<div class="relative h-full w-full overflow-hidden">
		<div
			class="flex h-full w-[600%] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
			style="transform: translateX(-{(currentStep * 100) / totalSteps}%);"
		>
			<!-- Step 1: Welcome -->
			<section
				class="flex h-full min-h-0 w-screen shrink-0 scrollbar-thin flex-col justify-center overflow-y-auto px-4 pt-24 pb-28 sm:px-8"
			>
				<WelcomeStep onNext={nextStep} />
			</section>

			<!-- Step 2: Certification -->
			<section
				class="flex h-full min-h-0 w-screen shrink-0 scrollbar-thin flex-col justify-center overflow-y-auto px-4 pt-24 pb-28 sm:px-8"
			>
				<CertificationStep />
			</section>

			<!-- Step 3: Security -->
			<section
				class="flex h-full min-h-0 w-screen shrink-0 scrollbar-thin flex-col justify-center overflow-y-auto px-4 pt-24 pb-28 sm:px-8"
			>
				<SecurityStep />
			</section>

			<!-- Step 4: Marketplace -->
			<section
				class="flex h-full min-h-0 w-screen shrink-0 scrollbar-thin flex-col justify-center overflow-y-auto px-4 pt-24 pb-28 sm:px-8"
			>
				<MarketplaceStep />
			</section>

			<!-- Step 5: Final Presentation -->
			<section
				class="flex h-full min-h-0 w-screen shrink-0 scrollbar-thin flex-col justify-center overflow-y-auto px-4 pt-24 pb-28 sm:px-8"
			>
				<FinalStep onStart={skipToAuth} />
			</section>

			<!-- Step 6: Authentication -->
			<section
				class="flex h-full min-h-0 w-screen shrink-0 scrollbar-thin flex-col justify-center overflow-y-auto px-4 pt-24 pb-28 sm:px-8"
			>
				<AuthStep step={currentStep} onSignInSuccess={onSuccessSignIn} onSignUpSuccess={onSuccessSingUp} />
			</section>
		</div>
	</div>

	<!-- Navigation Flottante Fixe Bas -->
	<footer class="pointer-events-none absolute inset-x-0 bottom-0 z-30 pt-2 pb-4">
		<div class="pointer-events-auto">
			<StepNavigation
				{currentStep}
				{totalSteps}
				onNext={nextStep}
				onPrev={prevStep}
				onSkip={skipToAuth}
			/>
		</div>
	</footer>
</main>

<style>
	/* Personnalisation de la barre de défilement pour un rendu ultra propre */
	.scrollbar-thin::-webkit-scrollbar {
		width: 5px;
	}
	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}
	.scrollbar-thin::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 10px;
	}
	.scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background: rgba(16, 185, 129, 0.4);
	}
</style>

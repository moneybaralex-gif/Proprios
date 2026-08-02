<script lang="ts">
	import { Lock, Store, ArrowLeft } from '@lucide/svelte';
	import ButtonFetching from './ButtonFetching.svelte';
	import InputLabel from './generals/InputLabel.svelte';
	import { toast } from '$lib/services/notification.svelte';
	import { applyAction, enhance } from '$app/forms';

	interface Props {
		pseudo: string;
		onComplete?: (code: string) => void;
	}

	let { pseudo, onComplete }: Props = $props();

	// États de l'application (2 étapes : 0 et 1)
	let step = $state(0);
	let boutiqueNom = $state('');
	let boutiqueAdresse = $state('');
	let isFetching = $state(false);

	// Tableau pour stocker le PIN de validation (4 chiffres)
	let pin = $state(['', '', '', '']);

	// Références HTML
	let formEl = $state<HTMLFormElement | null>(null);
	let inputs = $state<(HTMLInputElement | null)[]>([null, null, null, null]);

	// Calcul de la transition de glissement sur 2 étapes (50% par étape)
	let transformStyle = $derived(`transform: translateX(-${(step * 100) / 2}%);`);

	$effect(() => {
		if (formEl) formEl.scrollLeft = 0;
		if (step === 1) {
			setTimeout(() => {
				inputs[0]?.focus();
				if (formEl) formEl.scrollLeft = 0;
			}, 50);
		}
	});

	function goNext() {
		if (boutiqueNom.trim() && boutiqueAdresse.trim()) {
			step = 1;
			checkStepComplete();
		} else {
			toast.ajouter('Veuillez remplir tous les champs avant de continuer.', 'error');
		}
	}

	function goBack() {
		if (step > 0) step -= 1;
		if (step === 0) isFetching = false;
	}

	function handleInput(e: Event, index: number) {
		const target = e.target as HTMLInputElement;
		const val = target.value.replace(/\D/g, '');

		pin[index] = val.slice(-1);

		if (pin[index] && index < 3) {
			inputs[index + 1]?.focus();
		}
		checkStepComplete();
	}

	function handleKeyDown(e: KeyboardEvent, index: number) {
		if (e.key === 'Backspace') {
			e.preventDefault();
			if (pin[index] !== '') {
				pin[index] = '';
			} else if (index > 0) {
				pin[index - 1] = '';
				inputs[index - 1]?.focus();
			}
			checkStepComplete();
		} else if (e.key === 'ArrowLeft' && index > 0) {
			inputs[index - 1]?.focus();
		} else if (e.key === 'ArrowRight' && index < 3) {
			inputs[index + 1]?.focus();
		}
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const pastedData = e.clipboardData?.getData('text') || '';
		const digits = pastedData.replace(/\D/g, '').slice(0, 4).split('');

		digits.forEach((digit, index) => {
			if (index < 4) pin[index] = digit;
		});

		const nextFocusIndex = Math.min(digits.length, 3);
		inputs[nextFocusIndex]?.focus();
		checkStepComplete();
	}

	function checkStepComplete() {
		// Le bouton reste en attente de chargement tant que les 4 chiffres ne sont pas saisis
		isFetching = pin.join('').length !== 4;
	}
</script>

<div class="z-999 fixed top-0 left-0 flex h-screen w-full items-center justify-center bg-linear-to-br from-cyan-950 to-slate-950 p-4">
	<form
		bind:this={formEl}
		onscroll={() => { if (formEl) formEl.scrollLeft = 0; }}
		action="/admin?/creationBoutique"
		method="POST"
		use:enhance={({ cancel }) => {
			if (step !== 1) {
				cancel();
				return;
			}

			const fullPin = pin.join('');

			if (fullPin.length !== 4) {
				cancel();
				toast.ajouter('Veuillez saisir votre code PIN complet.', 'error');
				return;
			}

			isFetching = true; // Active l'état d'attente du bouton final

			return async ({ result }) => {
				if (result.type === 'redirect') {
					toast.ajouter('Première boutique créée avec succès !', 'success');
					if (onComplete) onComplete(fullPin);
					isFetching = false;
					
					setTimeout(() => {
						applyAction(result);
					}, 2000);
				}

				if (result.type === 'failure') {
					isFetching = false;
					toast.ajouter((result.data?.error as string) || "Erreur lors de la création de la boutique.", 'error');
				}
			};
		}}
		class="relative h-fit w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/50 py-6 text-white shadow-2xl backdrop-blur-md"
	>
		<!-- Input masqué pour soumettre le code PIN de confirmation -->
		<input type="hidden" name="pin" value={pin.join('')} />

		<!-- Indicateur de progression (2 étapes) -->
		<div class="mb-6 flex items-center justify-between gap-2 px-6">
			<div class="h-1 w-full rounded-full transition-colors duration-300 {step === 0 ? 'bg-cyan-500' : 'bg-cyan-950/80'}"></div>
			<div class="h-1 w-full rounded-full transition-colors duration-300 {step === 1 ? 'bg-cyan-500' : 'bg-cyan-950/80'}"></div>
		</div>

		<!-- Container de glissement (2 étapes = 200% de large) -->
		<div class="flex w-[200%] transition-transform duration-500 ease-out" style={transformStyle}>
			
			<!-- ÉTAPE 0 : Informations de la boutique -->
			<div class="flex w-1/2 shrink-0 flex-col gap-4 px-6">
				<div class="flex items-center justify-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5">
					<Store class="text-cyan-400" size={18} />
					<div class="text-xs font-semibold tracking-wide text-white/80">
						Administrateur : {pseudo}
					</div>
				</div>

				<div class="text-center">
					<h2 class="text-xs font-bold tracking-widest text-cyan-400 uppercase">Configuration</h2>
					<h3 class="mt-1 text-xl font-extrabold tracking-tight text-white">MA PREMIÈRE BOUTIQUE</h3>
				</div>

				<p class="text-center text-xs leading-relaxed text-white/60">
					Afin de commencer à structurer vos stocks et organiser vos ventes, veuillez enregistrer 
					votre tout premier point de vente physique ou en ligne.
				</p>

				<div class="my-2 flex flex-col gap-3">
					<InputLabel name="boutiqueNom" label="Nom de la boutique" bind:value={boutiqueNom} />
					<InputLabel name="boutiqueAdresse" label="Localisation / Adresse" bind:value={boutiqueAdresse} />
				</div>

				<ButtonFetching
					type="button"
					onclick={goNext}
					title="Suivant"
					color="bg-cyan-600 hover:bg-cyan-500"
					height="h-[46px]"
				/>
			</div>

			<!-- ÉTAPE 1 : Confirmation sécurisée par PIN -->
			<div class="flex w-1/2 shrink-0 flex-col justify-between gap-4 px-6">
				<div>
					<button type="button" onclick={goBack} class="mb-4 flex items-center gap-2 text-xs font-medium text-white/50 transition-colors hover:text-white focus:outline-none">
						<ArrowLeft size={16} /> Retour
					</button>

					<div class="flex flex-col items-center justify-center gap-3 text-center">
						<div class="mb-1 inline-flex items-center justify-center rounded-full bg-cyan-500/10 p-3 text-cyan-400">
							<Lock size={28} />
						</div>
						<div class="text-sm">
							<h3 class="mb-2 text-lg font-bold text-white">Validation de sécurité</h3>
							<p class="mx-auto max-w-70 text-xs leading-relaxed text-white/60">
								Saisissez votre code PIN d'administration à 4 chiffres pour confirmer la création de cette boutique.
							</p>
						</div>
					</div>

					<div class="my-6 flex justify-center gap-3">
                    <!--eslint-disable-next-line @typescript-eslint/no-unused-vars-->
						{#each pin as _, i (i)}
							<input
								bind:this={inputs[i]}
								bind:value={pin[i]}
								type="text"
								inputmode="numeric"
								pattern="[0-9]*"
								maxlength="1"
								oninput={(e) => handleInput(e, i)}
								onkeydown={(e) => handleKeyDown(e, i)}
								onpaste={handlePaste}
								class="h-14 w-14 rounded-xl border border-white/10 bg-white/5 text-center text-2xl font-bold text-white transition-all duration-200 focus:border-cyan-500 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
							/>
						{/each}
					</div>
				</div>

				<div class="mt-4 flex flex-col gap-2">
					<ButtonFetching
						type="submit"
						title="Confirmer la création"
						color="bg-cyan-600 hover:bg-cyan-500"
						height="h-[46px]"
						{isFetching}
						onclick={() => formEl?.requestSubmit()}
					/>
				</div>
			</div>

		</div>
	</form>
</div>
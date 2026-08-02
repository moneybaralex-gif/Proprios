<script lang="ts">
	import { Check, Loader2, Lock, X } from '@lucide/svelte';
	import { toast } from '$lib/services/notification.svelte';
	import { fade, fly, scale } from 'svelte/transition';

	let { close, isValide = $bindable(), getPin }: { close: () => void, isValide:boolean, getPin: ()=> void } = $props();

	let inputs = $state<(HTMLInputElement | null)[]>([null, null, null, null]);
	let isFetching = $state(true);
	let pin = $state(['', '', '', '']);
	let pinError = $state(false);
	let pinSucces = $state(false)
	let nombreEssaie = $state(0);

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

	function handelClickEnter(e: KeyboardEvent) {
		if (e.key === 'Enter' && pin.length === 4) {
			onSubmitVerif();

		}

		return;
	}

	function checkStepComplete() {
		// Le bouton reste en attente de chargement tant que les 4 chiffres ne sont pas saisis
		isFetching = pin.join('').length !== 4;
	}

	async function onSubmitVerif() {
		if (pin.length !== 4) {
			return toast.ajouter("Le pin saisi n'est pas valide", 'error');
		}

		isFetching = true;
		const response = await fetch('/api/verifPin', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ content: pin })
		});

		if (response.ok) {
			const { verifPin } = await response.json();
			if (verifPin) {
				isFetching = false;
				pinSucces = true
				isValide = true
				const interval = setTimeout(() => {
					getPin()
				}, 2000);

				return () => clearTimeout(interval)

			} else {
				isFetching = false;
				erruerPin();
			}

		} else {
			toast.ajouter("erreur de l'envoie du pin ");
		}
	}

	function erruerPin() {
		if (pinError) return;
		pinError = true;
		pin = ['', '', '', ''];
		nombreEssaie += 1;

		const interval = setTimeout(() => {
			pinError = false;
		}, 2000);

		return () => clearTimeout(interval);
	}
</script>

<div
	class="fixed top-0 left-0 z-20 flex h-screen w-full items-center justify-center bg-slate-400/60 p-4 backdrop-blur-sm"
>
	<div
		in:fly={{ y: -40 }}
		out:fade={{ duration: 200 }}
		class=" relative w-lg rounded-2xl bg-linear-to-br from-cyan-950 to-slate-950 py-6 transition"
	>
		<button
			onclick={close}
			class=" absolute top-3 right-3 cursor-pointer rounded-full bg-black/20 p-3 text-cyan-500 shadow-sm shadow-cyan-950 transition hover:bg-black/30 active:scale-95"
			><X size={24} /></button
		>
		<input type="hidden" bind:value={isValide}>
		<div class="flex w-full shrink-0 flex-col justify-between gap-4 px-6">
			<div>
				<div class="flex flex-col items-center justify-center gap-3 text-center">
					{#if pinSucces}
						<div
						class="mb-1 inline-flex items-center justify-center rounded-full bg-cyan-500/10 p-3 text-cyan-400"
					>
						<div in:scale={{delay:250}}><Check size={28}/></div>
					</div>
					{:else}
						<div
						class="mb-1 inline-flex items-center justify-center rounded-full bg-cyan-500/10 p-3 text-cyan-400"
						class:errorPin={pinError}
					>
						<div in:scale={{delay:250}}><Lock size={28}/></div>
					</div>
					{/if}
					<div class="text-sm">
						{#if pinError}
							<h3 class="mb-2 text-lg font-bold text-red-400">Pin incorrect</h3>
						{:else}
							<h3 class="mb-2 text-lg font-bold text-white">Validation de sécurité</h3>
						{/if}
						<p class="mx-auto max-w-70 text-xs leading-relaxed text-white/60">
							Saisissez votre code PIN d'administration à 4 chiffres pour cette étape
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
							onkeypress={handelClickEnter}
							class="h-14 w-14 rounded-xl border border-white/10 bg-white/5 text-center text-2xl font-bold text-white transition-all duration-200 focus:border-cyan-500 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
						/>
					{/each}
				</div>
			</div>
			{#if nombreEssaie >= 3}
				<a in:fade class=" -m-4 text-center text-sm text-cyan-600 hover:text-cyan-400" href="/"
					>Reinitialiser mon PIN</a
				>
			{/if}
			<div class="mt-4 flex flex-col gap-2">
				<button
					onclick={onSubmitVerif}
					class=" flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-cyan-600 text-cyan-100 hover:bg-cyan-500"
				>
					{#if isFetching}
						<div class="text-cyan-100"><Loader2 class=" animate-spin" size={24} /></div>
					{:else}
						Confirmer le Pin
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.errorPin {
		animation: erreur 0.5s ease-out;
		color: rgb(248, 91, 91);
	}

	@keyframes erreur {
		0% {
			transform: translateX(-20px);
		}

		13% {
			transform: translateX(20px);
		}

		26% {
			transform: translateX(-15px);
		}

		39% {
			transform: translateX(15px);
		}

		52% {
			transform: translateX(-10px);
		}

		65% {
			transform: translateX(10px);
		}

		78% {
			transform: translateX(-5px);
		}

		91% {
			transform: translateX(5px);
		}

		100% {
			transform: translateX(0px);
		}
	}
</style>

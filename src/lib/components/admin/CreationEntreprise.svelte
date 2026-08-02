<script lang="ts">
    import { Lock, UserCircle, ArrowLeft, CheckCircle2 } from '@lucide/svelte';
    import ButtonFetching from './ButtonFetching.svelte';
    import InputLabel from './generals/InputLabel.svelte';
    import { toast } from '$lib/services/notification.svelte';
    import { applyAction, enhance } from '$app/forms';

    interface Props {
        pseudo: string;
        onComplete?: (code: string) => void;
    }

    let { pseudo, onComplete }: Props = $props();

    // États de l'application
    let step = $state(0);
    let entrepriseNom = $state('');
    let entreprisePdg = $state('');
    let isFetching = $state(false); // Initialisé à false pour l'étape 0

    // Tableaux réactifs pour stocker les PIN
    let pin = $state(['', '', '', '']);
    let confirmPin = $state(['', '', '', '']);

    // Références
    let formEl = $state<HTMLFormElement | null>(null);
    let inputs = $state<(HTMLInputElement | null)[]>([null, null, null, null]);
    let confirmInputs = $state<(HTMLInputElement | null)[]>([null, null, null, null]);

    let transformStyle = $derived(`transform: translateX(-${(step * 100) / 3}%);`);

    $effect(() => {
        if (formEl) formEl.scrollLeft = 0;
        if (step === 1) {
            setTimeout(() => {
                inputs[0]?.focus();
                if (formEl) formEl.scrollLeft = 0;
            }, 50);
        } else if (step === 2) {
            setTimeout(() => {
                confirmInputs[0]?.focus();
                if (formEl) formEl.scrollLeft = 0;
            }, 50);
        }
    });

    function goNext() {
        if (entrepriseNom.trim() && entreprisePdg.trim()) {
            step = 1;
            checkStepComplete(false); // Actualise isFetching pour l'étape 1
        } else {
            toast.ajouter('Veuillez remplir tous les champs avant de continuer.', 'error');
        }
    }

    function goBack() {
        if (step > 0) step -= 1;
        
        // Réinitialise l'état isFetching selon l'étape où l'on retourne
        if (step === 0) isFetching = false;
        if (step === 1) checkStepComplete(false);
    }

    function handleInput(e: Event, index: number, isConfirm: boolean) {
        const target = e.target as HTMLInputElement;
        const val = target.value.replace(/\D/g, '');

        const currentPin = isConfirm ? confirmPin : pin;
        const currentInputs = isConfirm ? confirmInputs : inputs;

        currentPin[index] = val.slice(-1);

        if (currentPin[index] && index < 3) {
            currentInputs[index + 1]?.focus();
        }
        checkStepComplete(isConfirm);
    }

    function handleKeyDown(e: KeyboardEvent, index: number, isConfirm: boolean) {
        const currentPin = isConfirm ? confirmPin : pin;
        const currentInputs = isConfirm ? confirmInputs : inputs;

        if (e.key === 'Backspace') {
            e.preventDefault();
            if (currentPin[index] !== '') {
                currentPin[index] = '';
            } else if (index > 0) {
                currentPin[index - 1] = '';
                currentInputs[index - 1]?.focus();
            }
            checkStepComplete(isConfirm);
        } else if (e.key === 'ArrowLeft' && index > 0) {
            currentInputs[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 3) {
            currentInputs[index + 1]?.focus();
        }
    }

    function handlePaste(e: ClipboardEvent, isConfirm: boolean) {
        e.preventDefault();
        const pastedData = e.clipboardData?.getData('text') || '';
        const digits = pastedData.replace(/\D/g, '').slice(0, 4).split('');

        const currentPin = isConfirm ? confirmPin : pin;
        const currentInputs = isConfirm ? confirmInputs : inputs;

        digits.forEach((digit, index) => {
            if (index < 4) currentPin[index] = digit;
        });

        const nextFocusIndex = Math.min(digits.length, 3);
        currentInputs[nextFocusIndex]?.focus();
        checkStepComplete(isConfirm);
    }

    function checkStepComplete(isConfirm: boolean) {
        const targetPin = isConfirm ? confirmPin : pin;
        isFetching = targetPin.join('').length !== 4;
    }

    function submitFirstPin() {
        if (pin.join('').length === 4) {
            step = 2;
            checkStepComplete(true); // Vérifie le statut du bouton de l'étape 2
        } else {
            toast.ajouter('Veuillez saisir un code PIN complet à 4 chiffres.', 'error');
        }
    }
</script>

<div class=" z-999 fixed top-0 left-0 flex h-screen w-full items-center justify-center bg-linear-to-br from-cyan-950 to-slate-950 p-4">
    <form
        bind:this={formEl}
        onscroll={() => { if (formEl) formEl.scrollLeft = 0; }}
        action="/admin?/creationEntreprise"
        method="POST"
        use:enhance={({ cancel }) => {
            if (step !== 2) {
                cancel();
                return;
            }

            const fullPin = pin.join('');
            const fullConfirm = confirmPin.join('');

            // Validation finale bloquante
            if (fullPin !== fullConfirm) {
                cancel();
                toast.ajouter('Les codes PIN ne correspondent pas. Veuillez réessayer.', 'error');
                confirmPin = ['', '', '', ''];
                isFetching = true; // Désactive le bouton
                setTimeout(() => confirmInputs[0]?.focus(), 50);
                return;
            }

            isFetching = true; // Démarre le loader du bouton final

            return async ({ result }) => {
                if (result.type === 'redirect') {
                    toast.ajouter('Entreprise créée avec succès !', 'success');
                    if (onComplete) onComplete(fullPin);
                    isFetching = false
                    
                    setTimeout(() => {
                        applyAction(result);
                    }, 2000);
                }

                if (result.type === 'failure') {
                    isFetching = false;
                    toast.ajouter(result.data?.error as string || "Erreur lors de la création de l'entreprise.", 'error');
                }
            };
        }}
        class="relative h-fit w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/50 py-6 text-white shadow-2xl backdrop-blur-md"
    >
        <!-- INPUT CACHÉ INDISPENSABLE POUR ENVOYER LE PIN -->
        <input type="hidden" name="pin" value={pin.join('')} />

        <div class="mb-6 flex items-center justify-between gap-2 px-6">
            <div class="h-1 w-full rounded-full transition-colors duration-300 {step === 0 ? 'bg-cyan-500' : 'bg-cyan-950/80'}"></div>
            <div class="h-1 w-full rounded-full transition-colors duration-300 {step === 1 ? 'bg-cyan-500' : 'bg-cyan-950/80'}"></div>
            <div class="h-1 w-full rounded-full transition-colors duration-300 {step === 2 ? 'bg-cyan-500' : 'bg-cyan-950/80'}"></div>
        </div>

        <div class="flex w-[300%] transition-transform duration-500 ease-out" style={transformStyle}>
            <!-- ÉTAPE 0 -->
            <div class="flex w-1/3 shrink-0 flex-col gap-4 px-6">
                <div class="flex items-center justify-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5">
                    <UserCircle class="text-cyan-400" size={20} />
                    <div class="text-xs font-semibold tracking-wide text-white/80">
                        Utilisateur : {pseudo}
                    </div>
                </div>

                <div class="text-center">
                    <h2 class="text-xs font-bold tracking-widest text-cyan-400 uppercase">Administration</h2>
                    <h3 class="mt-1 text-xl font-extrabold tracking-tight text-white">BEBE PRODUCTION</h3>
                </div>

                <p class="text-center text-xs leading-relaxed text-white/60">
                    En tant que premier utilisateur de la plateforme, le système vous attribue l'intégralité
                    des accès d'administration.
                </p>

                <div class="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-center text-xs leading-relaxed text-cyan-200/90 italic">
                    Commencez par configurer votre première entreprise en remplissant les informations
                    ci-dessous.
                </div>

                <div class="my-2 flex flex-col gap-3">
                    <!-- Assure-toi que le composant InputLabel génère bien des <input name="..."> standards -->
                    <InputLabel name="entrepriseNom" label="Nom de l'entreprise" bind:value={entrepriseNom} />
                    <InputLabel name="entreprisePdg" label="Nom du PDG" bind:value={entreprisePdg} />
                </div>

                <ButtonFetching
                    type="button"
                    onclick={goNext}
                    title="Suivant"
                    color="bg-cyan-600 hover:bg-cyan-500"
                    height="h-[46px]"
                />
            </div>

            <!-- ÉTAPE 1 -->
            <div class="flex w-1/3 shrink-0 flex-col justify-between gap-4 px-6">
                <div>
                    <button type="button" onclick={goBack} class="mb-4 flex items-center gap-2 text-xs font-medium text-white/50 transition-colors hover:text-white focus:outline-none">
                        <ArrowLeft size={16} /> Retour
                    </button>

                    <div class="flex flex-col items-center justify-center gap-3 text-center">
                        <div class="mb-1 inline-flex items-center justify-center rounded-full bg-cyan-500/10 p-3 text-cyan-400">
                            <Lock size={28} />
                        </div>
                        <div class="text-sm">
                            <h3 class="mb-2 text-lg font-bold text-white">Sécurité du compte</h3>
                            <p class="mx-auto max-w-70 text-xs leading-relaxed text-white/60">
                                Créez un code PIN de sécurité. Il sera requis pour valider vos actions sensibles.
                            </p>
                        </div>
                    </div>

                    <div class="my-6 flex justify-center gap-3">
						<!--eslint-disable-next-line @typescript-eslint/no-unused-vars-->
                        {#each pin as digit, i (i)}
                            <input
                                bind:this={inputs[i]}
                                bind:value={pin[i]}
                                type="text"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="1"
                                oninput={(e) => handleInput(e, i, false)}
                                onkeydown={(e) => handleKeyDown(e, i, false)}
                                onpaste={(e) => handlePaste(e, false)}
                                class="h-14 w-14 rounded-xl border border-white/10 bg-white/5 text-center text-2xl font-bold text-white transition-all duration-200 focus:border-cyan-500 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                            />
                        {/each}
                    </div>
                </div>

                <div class="mt-4 flex flex-col gap-2">
                    <ButtonFetching
                        type="button"
                        onclick={submitFirstPin}
                        title="Suivant"
                        color="bg-cyan-600 hover:bg-cyan-500"
                        height="h-[46px]"
                        {isFetching}
                    />
                    <button type="button" onclick={() => alert('Ignoré')} class="py-2 text-xs text-white/40 transition-colors hover:text-white/80 focus:outline-none">
                        Ignorer pour le moment
                    </button>
                </div>
            </div>

            <!-- ÉTAPE 2 -->
            <div class="flex w-1/3 shrink-0 flex-col justify-between gap-4 px-6">
                <div>
                    <button type="button" onclick={goBack} class="mb-4 flex items-center gap-2 text-xs font-medium text-white/50 transition-colors hover:text-white focus:outline-none">
                        <ArrowLeft size={16} /> Retour
                    </button>

                    <div class="flex flex-col items-center justify-center gap-3 text-center">
                        <div class="mb-1 inline-flex items-center justify-center rounded-full bg-cyan-500/10 p-3 text-cyan-400">
                            <CheckCircle2 size={28} />
                        </div>
                        <div class="text-sm">
                            <h3 class="mb-2 text-lg font-bold text-white">Confirmez le PIN</h3>
                            <p class="mx-auto max-w-70 text-xs leading-relaxed text-white/60">
                                Veuillez saisir à nouveau le code PIN pour confirmer qu'il n'y a pas d'erreur de
                                frappe.
                            </p>
                        </div>
                    </div>

                    <div class="my-6 flex justify-center gap-3">
                       <!--eslint-disable-next-line @typescript-eslint/no-unused-vars-->
                        {#each confirmPin as _, i (i)}
                            <input
                                bind:this={confirmInputs[i]}
                                bind:value={confirmPin[i]}
                                type="text"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="1"
                                oninput={(e) => handleInput(e, i, true)}
                                onkeydown={(e) => handleKeyDown(e, i, true)}
                                onpaste={(e) => handlePaste(e, true)}
                                class="h-14 w-14 rounded-xl border border-white/10 bg-white/5 text-center text-2xl font-bold text-white transition-all duration-200 focus:border-cyan-500 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                            />
                        {/each}
                    </div>
                </div>

                <div class="mt-4 flex flex-col gap-2">
                    <!-- C'est ce bouton qui déclenche la soumission du form et donc `use:enhance` -->
                    <ButtonFetching
                        type="submit"
                        title="Valider et Confirmer"
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
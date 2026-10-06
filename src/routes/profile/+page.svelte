<script lang="ts">
	import { enhance } from '$app/forms';
	import { authClient } from '$lib/auth-client';
	import {
		ShieldCheck,
		Camera,
		CheckCircle2,
		Clock3,
		LogOut,
		FileText,
		UserCheck,
		UploadCloud,
		X,
		Sparkles,
		ShieldAlert,
		BadgeCheck,
		Loader2
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { lancerConfettis } from '$lib/utils/confetti';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let currentPassword = $state('');
	let password = $state('');
	let passwordMessage = $state('');
	let isSubmittingKyc = $state(false);
	let isSubmittingProfile = $state(false);

	// États locaux pour la prévisualisation des images
	let profileAvatarPreview = $state<string | null>(null);
	let idPhotoPreview = $state<string | null>(null);
	let portraitPreview = $state<string | null>(null);
	let holdingPreview = $state<string | null>(null);

	// Gestion des prévisualisations
	function handleFilePreview(event: Event, type: 'avatar' | 'id' | 'portrait' | 'holding') {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const objectUrl = URL.createObjectURL(file);
		if (type === 'avatar') profileAvatarPreview = objectUrl;
		if (type === 'id') idPhotoPreview = objectUrl;
		if (type === 'portrait') portraitPreview = objectUrl;
		if (type === 'holding') holdingPreview = objectUrl;
	}

	function clearPreview(type: 'id' | 'portrait' | 'holding', inputId: string) {
		const input = document.getElementById(inputId) as HTMLInputElement | null;
		if (input) input.value = '';

		if (type === 'id') idPhotoPreview = null;
		if (type === 'portrait') portraitPreview = null;
		if (type === 'holding') holdingPreview = null;
	}

	// Calcul des étapes de progression
	const steps = $derived([
		{
			stepNum: 1,
			title: 'Informations personnelles',
			done: Boolean(
				data.streamed?.profile?.name &&
				data.streamed?.profile?.telephone &&
				data.streamed?.profile?.city
			),
			desc: 'Nom complet, numéro de téléphone et ville de résidence renseignés.'
		},
		{
			stepNum: 2,
			title: 'Vérification de l’e-mail',
			done: Boolean(data.streamed?.profile?.emailVerified),
			desc: 'Validation de votre adresse électronique via le lien envoyé.'
		},
		{
			stepNum: 3,
			title: 'Dossier KYC déposé',
			done: Boolean(data.streamed?.profile?.kycSubmittedAt),
			desc: 'Pièce d’identité officielle, portrait et photo avec la carte en main déposés.'
		},
		{
			stepNum: 4,
			title: 'Certification du compte',
			done: Boolean(data.streamed?.profile?.certified),
			desc: data.streamed?.profile?.certified
				? 'Compte officiel certifié par l’administration.'
				: data.streamed?.profile?.kycRejectionReason
					? 'Dossier refusé. Veuillez corriger vos pièces.'
					: data.streamed?.profile?.kycSubmittedAt
						? 'En cours d’examen administratif.'
						: 'En attente du dépôt du dossier KYC.'
		}
	]);

	const completedStepsCount = $derived(steps.filter((s) => s.done).length);
	const progressPercentage = $derived(Math.round((completedStepsCount / 4) * 100));

	$effect(() => {
		if (data.streamed?.profile?.certified) {
			lancerConfettis();
		}
	});

	async function verifyEmail() {
		try {
			await authClient.sendVerificationEmail({
				email: data.streamed?.profile?.email || '',
				callbackURL: '/profile'
			});
			passwordMessage =
				'E-mail de vérification envoyé avec succès. Consultez votre boîte de réception.';
		} catch {
			passwordMessage = 'Impossible d’envoyer l’e-mail pour le moment.';
		}
	}

	async function changePassword() {
		if (password.length < 8) {
			passwordMessage = 'Le mot de passe doit comporter au moins 8 caractères.';
			return;
		}
		const r = await authClient.changePassword({
			newPassword: password,
			currentPassword: currentPassword,
			revokeOtherSessions: false
		});
		passwordMessage = r.error
			? 'Échec de la modification du mot de passe.'
			: 'Mot de passe modifié avec succès.';
		password = '';
		currentPassword = '';
	}

	async function logout() {
		await authClient.signOut();
		goto('/login');
	}
</script>

<div class="mx-auto max-w-4xl space-y-8 px-4 py-8">
	<!-- EN-TÊTE DU PROFIL -->
	{#if !data.streamed?.profile}
		<div class="flex flex-1 flex-col items-center justify-center">
			<Loader2 size={32} class="animate-spin text-emerald-400" />
		</div>
	{:else}
		{#await data.streamed?.profile}
			<div class="flex flex-1 flex-col items-center justify-center">
				<Loader2 size={32} class="animate-spin text-emerald-400" />
			</div>
		{:then _}
			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div class="flex items-center gap-2">
						<span class="text-xs font-bold tracking-wider text-emerald-400 uppercase"
							>Espace Membre</span
						>
						{#if data.streamed?.profile?.certified}
							<span
								class="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-bold text-emerald-300"
							>
								<BadgeCheck size={14} /> Certifié
							</span>
						{:else if data.streamed?.profile?.kycSubmittedAt && !data.streamed?.profile?.kycRejectionReason}
							<span
								class="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-xs font-bold text-amber-300"
							>
								<Clock3 size={14} /> En attente de certification
							</span>
						{/if}
					</div>
					<h1 class="mt-1 text-3xl font-black text-white">Mon Profil & Certification</h1>
				</div>
			</div>

			<!-- NOTIFICATIONS & MESSAGES RETOUR -->
			{#if form?.message || passwordMessage}
				<div
					class="rounded-2xl border p-4 text-sm font-medium transition-all {form?.success
						? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
						: 'border-rose-500/30 bg-rose-500/10 text-rose-200'}"
				>
					{form?.message ?? passwordMessage}
				</div>
			{/if}

			<!-- 1. PROGRESSION GLOBALE DE CERTIFICATION -->
			<section
				class="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl"
			>
				<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<h2 class="flex items-center gap-2 text-xl font-black text-white">
							<Sparkles size={20} class="text-emerald-400" />
							Progression de votre Certification
						</h2>
						<p class="mt-1 text-xs text-slate-400">
							La certification débloque la publication illimitée de parcelles et renforce la
							confiance des acheteurs.
						</p>
					</div>
					<div class="flex items-center gap-3">
						<span class="text-2xl font-black text-emerald-400">{progressPercentage}%</span>
						<div class="h-3 w-32 overflow-hidden rounded-full bg-white/10">
							<div
								class="h-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-500"
								style="width: {progressPercentage}%"
							></div>
						</div>
					</div>
				</div>

				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{#each steps as step, index (index)}
						<div
							class="relative flex flex-col justify-between rounded-2xl border p-4 transition-all {step.done
								? 'border-emerald-500/40 bg-emerald-500/5'
								: 'border-white/5 bg-white/2'}"
						>
							<div class="mb-3 flex items-center justify-between">
								<div
									class="grid size-8 place-items-center rounded-xl text-xs font-bold {step.done
										? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/20'
										: 'bg-white/10 text-slate-400'}"
								>
									{#if step.done}
										<CheckCircle2 size={16} />
									{:else}
										{step.stepNum}
									{/if}
								</div>
								{#if !step.done && index === 1}
									<button
										type="button"
										class="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-400/20"
										onclick={verifyEmail}
									>
										Vérifier
									</button>
								{/if}
							</div>
							<div>
								<h3 class="text-sm font-bold text-white">{step.title}</h3>
								<p class="mt-1 line-clamp-2 text-xs text-slate-400">{step.desc}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- 2. INFORMATIONS PERSONNELLES DU PROFIL -->
			<section
				class="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl"
			>
				<div class="flex items-center gap-5 border-b border-white/5 pb-6">
					<div
						class="group relative size-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-emerald-400/10"
					>
						{#if profileAvatarPreview || data.streamed?.profile?.image}
							<img
								src={profileAvatarPreview || data.streamed?.profile?.image}
								alt="Avatar"
								class="h-full w-full object-cover"
							/>
						{:else}
							<div class="grid h-full place-items-center text-2xl font-black text-emerald-300">
								{data.streamed?.profile?.name?.slice(0, 2).toUpperCase() ?? 'U'}
							</div>
						{/if}
					</div>
					<div>
						<h2 class="text-xl font-black text-white">
							{data.streamed?.profile?.name || 'Utilisateur'}
						</h2>
						<p class="text-xs text-slate-400">{data.streamed?.profile?.email}</p>
						<span
							class="mt-2 inline-block rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300"
						>
							Type : {data.streamed?.profile?.type || 'GUEST'}
						</span>
					</div>
				</div>

				<form
					method="POST"
					action="?/update"
					enctype="multipart/form-data"
					use:enhance={() => {
						isSubmittingProfile = true;
						return async ({ update }) => {
							isSubmittingProfile = false;
							await update();
						};
					}}
					class="grid gap-4 sm:grid-cols-2"
				>
					<div class="space-y-1.5">
						<label
							for="name"
							class="block text-xs font-bold tracking-wider text-slate-400 uppercase"
							>Nom Complet</label
						>
						<input
							id="name"
							name="name"
							value={data.streamed?.profile?.name ?? ''}
							required
							placeholder="Votre nom complet"
							class="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white transition-colors focus:border-emerald-400/60 focus:outline-none"
						/>
					</div>

					<div class="space-y-1.5">
						<label
							for="telephone"
							class="block text-xs font-bold tracking-wider text-slate-400 uppercase"
							>Téléphone</label
						>
						<input
							id="telephone"
							name="telephone"
							value={data.streamed?.profile?.telephone ?? ''}
							placeholder="+243 000 000 000"
							class="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white transition-colors focus:border-emerald-400/60 focus:outline-none"
						/>
					</div>

					<div class="space-y-1.5">
						<label
							for="country"
							class="block text-xs font-bold tracking-wider text-slate-400 uppercase">Pays</label
						>
						<input
							id="country"
							name="country"
							value={data.streamed?.profile?.country ?? 'RDC'}
							class="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white transition-colors focus:border-emerald-400/60 focus:outline-none"
						/>
					</div>

					<div class="space-y-1.5">
						<label
							for="city"
							class="block text-xs font-bold tracking-wider text-slate-400 uppercase">Ville</label
						>
						<input
							id="city"
							name="city"
							value={data.streamed?.profile?.city ?? ''}
							placeholder="Ex: Kinshasa, Lubumbashi..."
							class="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white transition-colors focus:border-emerald-400/60 focus:outline-none"
						/>
					</div>

					<div class="col-span-full">
						<label
							class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/5 p-3 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10"
						>
							<Camera size={18} class="text-emerald-400" />
							<span
								>{profileAvatarPreview
									? 'Changer la photo sélectionnée'
									: 'Modifier la photo de profil'}</span
							>
							<input
								type="file"
								name="image"
								accept="image/*"
								class="hidden"
								onchange={(e) => handleFilePreview(e, 'avatar')}
							/>
						</label>
					</div>

					<div class="col-span-full flex justify-end pt-2">
						<button
							type="submit"
							disabled={isSubmittingProfile}
							class="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-black text-slate-950 transition-all hover:bg-emerald-300 disabled:opacity-50"
						>
							{isSubmittingProfile ? 'Enregistrement...' : 'Enregistrer les informations'}
						</button>
					</div>
				</form>
			</section>

			<!-- 3. SECTION KYC PROFESSIONNELLE -->
			{#if data.streamed?.profile?.certified}
				<!-- COMPTE DÉJÀ CERTIFIÉ -->
				<section class="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 shadow-xl">
					<div class="flex items-start gap-4">
						<div class="rounded-2xl bg-emerald-400 p-3 text-slate-950">
							<BadgeCheck size={28} />
						</div>
						<div class="space-y-1">
							<h2 class="text-xl font-black text-emerald-200">
								Félicitations ! Votre compte est certifié
							</h2>
							<p class="text-xs text-emerald-300/80">
								Votre identité a été validée par nos administrateurs. Vous bénéficiez du badge de
								confiance sur toutes vos parcelles et transactions.
							</p>
							<div class="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-emerald-200">
								<span>Type : <b>{data.streamed?.profile.typeID ?? 'Identité officielle'}</b></span>
								<span>N° : <b>{data.streamed?.profile.cardID ?? 'N/A'}</b></span>
							</div>
						</div>
					</div>
				</section>
			{:else if data.streamed?.profile?.kycSubmittedAt && !data.streamed?.profile?.kycRejectionReason}
				<!-- DOSSIER EN ATTENTE D'EXAMEN -->
				<section
					class="space-y-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 shadow-xl"
				>
					<div class="flex items-start gap-4">
						<div class="rounded-2xl border border-amber-400/30 bg-amber-400/20 p-3 text-amber-300">
							<Clock3 size={28} />
						</div>
						<div class="space-y-1">
							<h2 class="text-xl font-black text-amber-200">Dossier KYC en cours d'examen</h2>
							<p class="text-xs text-amber-300/80">
								Vos pièces d’identité ont été transmises avec succès. Nos équipes vérifient la
								conformité de vos documents sous 24 à 48 heures.
							</p>
							<div class="pt-3 text-xs text-slate-400">
								Date de soumission : <b
									>{new Date(data.streamed?.profile.kycSubmittedAt).toLocaleDateString('fr-FR', {
										day: 'numeric',
										month: 'long',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}</b
								>
							</div>
						</div>
					</div>

					<div class="grid grid-cols-3 gap-3 pt-2">
						{#if data.streamed?.profile.identityCardPhotoUrl}
							<div class="overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
								<img
									src={data.streamed?.profile.identityCardPhotoUrl}
									alt="Pièce ID"
									class="h-28 w-full object-cover"
								/>
								<p class="p-1.5 text-center text-[10px] text-slate-400">Pièce d'identité</p>
							</div>
						{/if}
						{#if data.streamed?.profile.portraitPhotoUrl}
							<div class="overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
								<img
									src={data.streamed?.profile.portraitPhotoUrl}
									alt="Portrait"
									class="h-28 w-full object-cover"
								/>
								<p class="p-1.5 text-center text-[10px] text-slate-400">Portrait</p>
							</div>
						{/if}
						{#if data.streamed?.profile.cardHoldingPhotoUrl}
							<div class="overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
								<img
									src={data.streamed?.profile.cardHoldingPhotoUrl}
									alt="Carte en main"
									class="h-28 w-full object-cover"
								/>
								<p class="p-1.5 text-center text-[10px] text-slate-400">Carte en main</p>
							</div>
						{/if}
					</div>
				</section>
			{:else}
				<!-- FORMULAIRE DE SOUMISSION KYC -->
				<section
					class="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl"
				>
					{#if data.streamed?.profile?.kycRejectionReason}
						<div
							class="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200"
						>
							<ShieldAlert size={24} class="mt-0.5 shrink-0 text-rose-400" />
							<div>
								<h3 class="text-sm font-bold">Votre précédent dossier KYC a été refusé</h3>
								<p class="mt-1 text-xs text-rose-300">
									Motif : {data.streamed?.profile.kycRejectionReason}
								</p>
								<p class="mt-1 text-[11px] text-rose-400/80">
									Veuillez reprendre des photos nettes et soumettre à nouveau le formulaire
									ci-dessous.
								</p>
							</div>
						</div>
					{/if}

					<div class="flex items-start gap-3">
						<div
							class="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-400"
						>
							<ShieldCheck size={24} />
						</div>
						<div>
							<h2 class="text-xl font-black text-white">Vérification d’Identité (KYC)</h2>
							<p class="mt-0.5 text-xs text-slate-400">
								Suivez scrupuleusement les 3 étapes photographiques ci-dessous pour certifier votre
								compte.
							</p>
						</div>
					</div>

					<!-- GUIDE DES BONNES PRATIQUES -->
					<div
						class="grid gap-3 rounded-2xl border border-white/5 bg-white/2 p-4 text-xs sm:grid-cols-3"
					>
						<div class="flex items-start gap-2">
							<span class="font-bold text-emerald-400">1.</span>
							<p class="text-slate-300">
								<b>Pièce lisible :</b> Pas de reflets ni de doigts masquant les écritures.
							</p>
						</div>
						<div class="flex items-start gap-2">
							<span class="font-bold text-emerald-400">2.</span>
							<p class="text-slate-300">
								<b>Portrait net :</b> Visage bien éclairé, sans lunettes de soleil ni couvre-chef.
							</p>
						</div>
						<div class="flex items-start gap-2">
							<span class="font-bold text-emerald-400">3.</span>
							<p class="text-slate-300">
								<b>Carte en main :</b> Tenez votre pièce près de votre visage sans la masquer.
							</p>
						</div>
					</div>

					<form
						method="POST"
						action="?/submitKyc"
						enctype="multipart/form-data"
						use:enhance={() => {
							isSubmittingKyc = true;
							return async ({ update }) => {
								isSubmittingKyc = false;
								await update();
							};
						}}
						class="space-y-6"
					>
						<!-- INFOS DE LA PIÈCE -->
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-1.5">
								<label
									for="typeID"
									class="block text-xs font-bold tracking-wider text-slate-400 uppercase"
									>Type de document</label
								>
								<select
									id="typeID"
									name="typeID"
									required
									class="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
								>
									<option value="NATIONAL">Carte Nationale d'Identité / Électeur</option>
									<option value="PASSPORT">Passeport</option>
									<option value="DRIVING">Permis de Conduire</option>
								</select>
							</div>

							<div class="space-y-1.5">
								<label
									for="cardID"
									class="block text-xs font-bold tracking-wider text-slate-400 uppercase"
									>Numéro de la pièce (ID)</label
								>
								<input
									id="cardID"
									name="cardID"
									value={data.streamed?.profile?.cardID ?? ''}
									required
									placeholder="Ex: 0123456789"
									class="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
								/>
							</div>
						</div>

						<!-- LES 3 ZONES DE TÉLÉVERSEMENT AVEC LIVE PREVIEW -->
						<div class="grid gap-4 sm:grid-cols-3">
							<!-- PHOTO 1 : PIÈCE D'IDENTITÉ -->
							<div
								class="relative flex flex-col overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/2 p-3"
							>
								<p class="mb-2 flex items-center gap-1 text-xs font-bold text-white">
									<FileText size={14} class="text-emerald-400" /> 1. Pièce d'identité
								</p>
								{#if idPhotoPreview}
									<div class="group relative h-36 w-full overflow-hidden rounded-xl">
										<img src={idPhotoPreview} alt="Aperçu ID" class="h-full w-full object-cover" />
										<button
											type="button"
											onclick={() => clearPreview('id', 'identityCardPhotoInput')}
											class="absolute top-2 right-2 rounded-lg bg-slate-900/80 p-1 text-white transition-colors hover:bg-rose-600"
										>
											<X size={14} />
										</button>
									</div>
								{:else}
									<label
										for="identityCardPhotoInput"
										class="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl bg-white/5 p-4 text-center transition-colors hover:bg-white/10"
									>
										<UploadCloud size={24} class="mb-2 text-slate-400" />
										<span class="text-xs font-bold text-slate-300">Importer le recto</span>
										<span class="mt-1 text-[10px] text-slate-500">JPG, PNG (max 5MB)</span>
									</label>
								{/if}
								<input
									id="identityCardPhotoInput"
									name="identityCardPhoto"
									type="file"
									accept="image/*"
									required
									class="hidden"
									onchange={(e) => handleFilePreview(e, 'id')}
								/>
							</div>

							<!-- PHOTO 2 : PORTRAIT -->
							<div
								class="relative flex flex-col overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/2 p-3"
							>
								<p class="mb-2 flex items-center gap-1 text-xs font-bold text-white">
									<UserCheck size={14} class="text-emerald-400" /> 2. Photo Portrait
								</p>
								{#if portraitPreview}
									<div class="group relative h-36 w-full overflow-hidden rounded-xl">
										<img
											src={portraitPreview}
											alt="Aperçu Portrait"
											class="h-full w-full object-cover"
										/>
										<button
											type="button"
											onclick={() => clearPreview('portrait', 'portraitPhotoInput')}
											class="absolute top-2 right-2 rounded-lg bg-slate-900/80 p-1 text-white transition-colors hover:bg-rose-600"
										>
											<X size={14} />
										</button>
									</div>
								{:else}
									<label
										for="portraitPhotoInput"
										class="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl bg-white/5 p-4 text-center transition-colors hover:bg-white/10"
									>
										<UploadCloud size={24} class="mb-2 text-slate-400" />
										<span class="text-xs font-bold text-slate-300">Importer le portrait</span>
										<span class="mt-1 text-[10px] text-slate-500">Visage net & centré</span>
									</label>
								{/if}
								<input
									id="portraitPhotoInput"
									name="portraitPhoto"
									type="file"
									accept="image/*"
									required
									class="hidden"
									onchange={(e) => handleFilePreview(e, 'portrait')}
								/>
							</div>

							<!-- PHOTO 3 : CARTE EN MAIN -->
							<div
								class="relative flex flex-col overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/2 p-3"
							>
								<p class="mb-2 flex items-center gap-1 text-xs font-bold text-white">
									<ShieldCheck size={14} class="text-emerald-400" /> 3. Carte en main
								</p>
								{#if holdingPreview}
									<div class="group relative h-36 w-full overflow-hidden rounded-xl">
										<img
											src={holdingPreview}
											alt="Aperçu Carte en main"
											class="h-full w-full object-cover"
										/>
										<button
											type="button"
											onclick={() => clearPreview('holding', 'cardHoldingPhotoInput')}
											class="absolute top-2 right-2 rounded-lg bg-slate-900/80 p-1 text-white transition-colors hover:bg-rose-600"
										>
											<X size={14} />
										</button>
									</div>
								{:else}
									<label
										for="cardHoldingPhotoInput"
										class="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl bg-white/5 p-4 text-center transition-colors hover:bg-white/10"
									>
										<UploadCloud size={24} class="mb-2 text-slate-400" />
										<span class="text-xs font-bold text-slate-300">Importer la preuve</span>
										<span class="mt-1 text-[10px] text-slate-500">Tenant la pièce en main</span>
									</label>
								{/if}
								<input
									id="cardHoldingPhotoInput"
									name="cardHoldingPhoto"
									type="file"
									accept="image/*"
									required
									class="hidden"
									onchange={(e) => handleFilePreview(e, 'holding')}
								/>
							</div>
						</div>

						<div class="flex justify-end pt-2">
							<button
								type="submit"
								disabled={isSubmittingKyc}
								class="flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-400/20 transition-all hover:bg-emerald-300 disabled:opacity-50"
							>
								<ShieldCheck size={18} />
								{isSubmittingKyc ? 'Téléversement en cours...' : 'Soumettre mon dossier KYC'}
							</button>
						</div>
					</form>
				</section>
			{/if}
		{/await}
	{/if}

	<!-- 4. SÉCURITÉ & MOT DE PASSE -->
	<section
		class="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl"
	>
		<h2 class="text-xl font-black text-white">Sécurité du compte</h2>
		<div class="grid gap-3 sm:grid-cols-3">
			<input
				class="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
				type="password"
				bind:value={currentPassword}
				placeholder="Mot de passe actuel"
			/>
			<input
				class="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-emerald-400/60 focus:outline-none"
				type="password"
				bind:value={password}
				placeholder="Nouveau mot de passe"
			/>
			<button
				type="button"
				class="rounded-xl bg-white/10 p-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
				onclick={changePassword}
			>
				Changer le mot de passe
			</button>
		</div>
	</section>

	<!-- BOUTON DÉCONNEXION -->
	<button
		type="button"
		class="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 font-bold text-rose-300 transition-colors hover:bg-rose-500/20"
		onclick={logout}
	>
		<LogOut size={18} /> Se déconnecter de la plateforme
	</button>
</div>

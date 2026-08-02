<script lang="ts">
	import { Lock, Shield, Key, FileLock2, Database } from '@lucide/svelte';
	import IllustrationCard from './IllustrationCard.svelte';
</script>

<div class="w-full min-h-full my-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 max-w-7xl mx-auto">
	<!-- Contenu Texte -->
	<div class="flex-1 flex flex-col items-start text-left space-y-6 max-w-2xl">
		<div class=" lg:translate-x-48 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase">
			<Lock class="w-3.5 h-3.5" />
			Protection Inviolable
		</div>

		<h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
			Un coffre-fort numérique pour <span class="bg-linear-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">vos preuves de propriété</span>
		</h2>

		<p class="text-slate-300 text-base">
			Les litiges de propriété proviennent souvent de la perte ou de la falsification de documents. Proprios protège vos données avec des standards de cryptage bancaires.
		</p>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-2">
			<div class="p-4 rounded-2xl bg-white/3 border border-white/10">
				<FileLock2 class="w-6 h-6 text-cyan-400 mb-2" />
				<h4 class="text-white font-semibold text-sm">Conservation Absolue</h4>
				<p class="text-xs text-slate-400 mt-1">Vos contrats et factures sont archivés de façon infalsifiable.</p>
			</div>

			<div class="p-4 rounded-2xl bg-white/3 border border-white/10">
				<Database class="w-6 h-6 text-indigo-400 mb-2" />
				<h4 class="text-white font-semibold text-sm">Traçabilité complète</h4>
				<p class="text-xs text-slate-400 mt-1">Chaque modification de statut fait l'objet d'un suivi auditable.</p>
			</div>
		</div>
	</div>

	<!-- Illustration Coffre Fort -->
	<div class="flex-1 w-full flex items-center justify-center">
		<IllustrationCard badgeText="AES-256 Encrypted">
			<div class="relative flex flex-col items-center justify-center">
				<div class="w-32 h-32 rounded-3xl bg-linear-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.2)]">
					<Shield class="w-16 h-16 text-cyan-400" />
				</div>
				<div class="mt-6 flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950 px-4 py-2 rounded-lg border border-white/10">
					<Key class="w-3.5 h-3.5 text-emerald-400" />
					<span>HASH: 8f9a...c34b</span>
				</div>
			</div>
		</IllustrationCard>
	</div>
</div>
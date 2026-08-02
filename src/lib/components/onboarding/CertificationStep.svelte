<script lang="ts">
	import { FileCheck, MapPin, Users, Award, CheckCircle2 } from '@lucide/svelte';
	import IllustrationCard from './IllustrationCard.svelte';
</script>

<div class="w-full h-full flex flex-col lg:flex-row-reverse items-center justify-between gap-12 px-6 lg:px-16 max-w-7xl mx-auto">
	<!-- Contenu Texte (Droite) -->
	<div class="flex-1 mt-2 flex flex-col items-start text-left space-y-6 max-w-2xl">
		<div class=" lg:translate-y-6 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase">
			<Award class="w-3.5 h-3.5" />
			Audit Immobiler Poussé
		</div>

		<h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
			Une certification officielle reposant sur la <span class="bg-linear-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">réalité du terrain</span>
		</h2>

		<p class="text-slate-300 text-base">
			Contrairement aux simples annuaires, nous ne faisons pas aveuglément confiance aux fichiers envoyés. Chaque bien passe par un protocole de vérification strict.
		</p>

		<div class="space-y-3 w-full pt-2">
			<div class="flex items-start gap-4 p-3.5 rounded-xl bg-white/3 border border-white/5">
				<div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
					<FileCheck class="w-5 h-5" />
				</div>
				<div>
					<h4 class="text-white font-medium text-sm">Analyse Documentaire Approfondie</h4>
					<p class="text-xs text-slate-400">Authentification des titres de propriété, actes de vente et cadastres.</p>
				</div>
			</div>

			<div class="flex items-start gap-4 p-3.5 rounded-xl bg-white/3 border border-white/5">
				<div class="p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
					<MapPin class="w-5 h-5" />
				</div>
				<div>
					<h4 class="text-white font-medium text-sm">Inspections Physiques sur le Terrain</h4>
					<p class="text-xs text-slate-400">Des experts déplacés sur place confirment l'existence réelle et les bornes du bien.</p>
				</div>
			</div>

			<div class="flex items-start gap-4 p-3.5 rounded-xl bg-white/3 border border-white/5">
				<div class="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
					<Users class="w-5 h-5" />
				</div>
				<div>
					<h4 class="text-white font-medium text-sm">Validation Juridique par nos Équipes</h4>
					<p class="text-xs text-slate-400">Confirmation de la conformité légale avant l'émission du macaron de certification.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Illustration Graphique (Gauche) -->
	<div class="flex-1 w-full flex items-center justify-center">
		<IllustrationCard badgeText="Processus N3">
			<div class="w-full space-y-4">
				<!-- Step Checklist Card -->
				<div class="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between shadow-lg">
					<div class="flex items-center gap-3">
						<CheckCircle2 class="w-5 h-5 text-emerald-400" />
						<span class="text-xs font-medium text-slate-200">Vérification Titre Foncier</span>
					</div>
					<span class="text-[10px] text-emerald-400 font-mono">100% VALIDE</span>
				</div>

				<div class="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between shadow-lg">
					<div class="flex items-center gap-3">
						<CheckCircle2 class="w-5 h-5 text-emerald-400" />
						<span class="text-xs font-medium text-slate-200">Relevé Topographique GPS</span>
					</div>
					<span class="text-[10px] text-emerald-400 font-mono">CONFIRMÉ</span>
				</div>

				<div class="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between shadow-lg">
					<div class="flex items-center gap-3">
						<div class="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
						<span class="text-xs font-medium text-slate-200">Approbation du Notaire</span>
					</div>
					<span class="text-[10px] text-cyan-400 font-mono">EN COURS</span>
				</div>
			</div>
		</IllustrationCard>
	</div>
</div>
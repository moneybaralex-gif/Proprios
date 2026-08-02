<script lang="ts">
	import { TrendingUp, Store, UserCheck, Tag } from '@lucide/svelte';
	import IllustrationCard from './IllustrationCard.svelte';
</script>

<div class="w-full h-full flex flex-col lg:flex-row-reverse items-center justify-between gap-12 px-6 lg:px-16 max-w-7xl mx-auto">
	<!-- Contenu Texte -->
	<div class="flex-1 flex flex-col items-start text-left space-y-6 max-w-2xl">
		<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase">
			<Store class="w-3.5 h-3.5" />
			Marché & Transactions
		</div>

		<h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
			Estimez, mettez en vente et <span class="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">collaborez en confiance</span>
		</h2>

		<p class="text-slate-300 text-base">
			Proprios simplifie la mise en relation entre acheteurs vérifiés et propriétaires, tout en encadrant l'intervention d'intermédiaires agréés.
		</p>

		<div class="space-y-3 w-full pt-2">
			<div class="p-3.5 rounded-xl bg-white/3 border border-white/5 flex items-center gap-4">
				<TrendingUp class="w-5 h-5 text-indigo-400" />
				<div>
					<h4 class="text-white font-medium text-sm">Estimation Libre & Transparente</h4>
					<p class="text-xs text-slate-400">Fixez ou ajustez la valeur marchande estimée de vos biens.</p>
				</div>
			</div>

			<div class="p-3.5 rounded-xl bg-white/3 border border-white/5 flex items-center gap-4">
				<UserCheck class="w-5 h-5 text-emerald-400" />
				<div>
					<h4 class="text-white font-medium text-sm">Commissionnaires Certifiés</h4>
					<p class="text-xs text-slate-400">Devenez un courtier agréé après vérification formelle de votre identité.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Illustration Marketplace Card -->
	<div class="flex-1 w-full flex items-center justify-center">
		<IllustrationCard badgeText="Offres Directes">
			<div class="w-full space-y-3">
				<div class="p-4 rounded-2xl bg-slate-950/90 border border-white/10 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
							<Tag class="w-5 h-5" />
						</div>
						<div>
							<div class="text-xs font-semibold text-white">Villa Résidentielle - Ngaliema</div>
							<div class="text-[10px] text-slate-400">Estimé à 350,000 $</div>
						</div>
					</div>
					<span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">En vente</span>
				</div>

				<div class="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-3">
					<UserCheck class="w-4 h-4 text-indigo-400" />
					<span class="text-xs text-indigo-200">Commissionnaire Agréé attribué à la vente</span>
				</div>
			</div>
		</IllustrationCard>
	</div>
</div>
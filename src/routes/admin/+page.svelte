<script lang="ts">
  import Card from '$lib/components/admin/ui/Card.svelte';
  import Badge from '$lib/components/admin/ui/Badge.svelte';
  import { Users, ShieldCheck, Map, TrendingUp } from '@lucide/svelte';
  
  // Dans un vrai cas, ces données viennent de $props() injectées par +page.server.ts (Prisma)
  let stats = $state([
    { title: 'Utilisateurs Totaux', value: '1,245', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Parcelles Sécurisées', value: '892', icon: ShieldCheck, color: 'text-proprios-mint', bg: 'bg-proprios-mint/10' },
    { title: 'Descentes en cours', value: '14', icon: Map, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { title: 'Revenus (Mois)', value: '$12,400', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ]);
</script>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold text-white tracking-tight">Vue d'ensemble</h1>
    <p class="text-slate-400 mt-1">Supervisez l'activité de Proprios en RDC.</p>
  </div>

  <!-- KPI Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each stats as stat, index (index)}
      <Card class="p-6 flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-400 font-medium">{stat.title}</p>
          <p class="text-3xl font-bold text-white mt-2">{stat.value}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl {stat.bg} {stat.color} flex items-center justify-center">
          <stat.icon size={24} />
        </div>
      </Card>
    {/each}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Graphique ou Liste Récente (2/3) -->
    <Card class="p-6 lg:col-span-2">
      <h2 class="text-lg font-bold text-white mb-4">Dernières Certifications</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-white/5 text-sm text-slate-500">
              <th class="pb-3 font-medium">Propriétaire</th>
              <th class="pb-3 font-medium">Parcelle</th>
              <th class="pb-3 font-medium">Ville</th>
              <th class="pb-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            {#each [1,2,3,4] as _item, index (index)}
            <tr class="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
              <td class="py-4 text-white font-medium">Jean K.</td>
              <td class="py-4 text-slate-300">#PRCL-8902</td>
              <td class="py-4 text-slate-300">Goma {_item}</td>
              <td class="py-4"><Badge variant="warning">En attente Visite</Badge></td>
            </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Mini Chat ou Activité (1/3) -->
    <Card class="p-6 bg-linear-to-br from-proprios-card to-proprios-dark">
      <h2 class="text-lg font-bold text-white mb-4">Action Requise</h2>
      <div class="space-y-4">
        <!-- Remplacer par des vrais composants -->
        <div class="p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group cursor-pointer hover:border-proprios-mint/50 transition-colors">
           <div class="absolute inset-0 bg-proprios-mint/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
           <p class="text-sm text-white font-medium relative z-10">Valider Document ID</p>
           <p class="text-xs text-slate-400 mt-1 relative z-10">Client: Marie M. - Il y a 10 min</p>
        </div>
      </div>
    </Card>
  </div>
</div>
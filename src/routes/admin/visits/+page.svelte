<script lang="ts">
  import { enhance } from '$app/forms';
  import Card from '$lib/components/admin/ui/Card.svelte';
  import Badge from '$lib/components/admin/ui/Badge.svelte';
  import { 
    Search, MapPin, Calendar, Clock, CheckCircle, ShieldCheck, 
    Users, CreditCard, ChevronRight, AlertTriangle, Navigation,
    Map, PhoneCall, RefreshCcw, FileSignature
  } from '@lucide/svelte';
  
  import type { PageData } from './$types';

  // --- INTERFACES STRICTES ---
  interface FormResult { success?: boolean; message?: string; }
  type VisitType = 'CERTIFICATION' | 'FORCLIENT';
  type FilterStatus = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CERTIFICATION' | 'CLIENT';

  interface UserBase { id: string; name: string; telephone: string | null; }
  interface Client extends UserBase { image: string | null; }
  interface Image { id: string; url: string; }
  
  interface PlotData {
    id: string; address: string | null; city: string | null;
    proprio: UserBase; images: Image[];
  }

  interface VisitData {
    id: string;
    date: Date | null;
    type: VisitType;
    paid: boolean;
    isCompleted: boolean;
    user: Client | null; // Le client visiteur (si FORCLIENT)
    plot: PlotData;
  }

  let { data, form }: { data: PageData; form: FormResult | null } = $props();
  
  // Cast sécurisé pour TypeScript
  let currentUser = $derived(data.currentUser);

  // --- ÉTATS (Runes) ---
  let searchQuery = $state('');
  let activeFilter = $state<FilterStatus>('ALL');
  let selectedVisitId = $state<string | null>(null);
  let isRescheduling = $state(false);
  let newDateInput = $state('');
  
  // Toasts
  let toastMessage = $state<string | null>(null);

  // --- LOGIQUE DÉRIVÉE ---
  let typedVisits = $derived(data.visits as unknown as VisitData[]);
  
  const today = $state(new Date());
  today.setHours(0,0,0,0); // Normaliser pour les comparaisons

  let filteredVisits = $derived(
    typedVisits.filter(visit => {
      const matchSearch = visit.plot.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (visit.user?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          visit.plot.proprio.name.toLowerCase().includes(searchQuery.toLowerCase());
                          
      const visitDate = visit.date ? new Date(visit.date) : null;
      
      if (activeFilter === 'UPCOMING') return matchSearch && !visit.isCompleted && (visitDate && visitDate >= today);
      if (activeFilter === 'COMPLETED') return matchSearch && visit.isCompleted;
      if (activeFilter === 'CERTIFICATION') return matchSearch && visit.type === 'CERTIFICATION';
      if (activeFilter === 'CLIENT') return matchSearch && visit.type === 'FORCLIENT';
      return matchSearch;
    })
  );

  let activeVisit = $derived(filteredVisits.find(v => v.id === selectedVisitId));

  // --- HELPERS ---
  const isPastDue = (dateStr: Date | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < today;
  };

  const formatDate = (dateStr: Date | null, timeOnly = false) => {
    if (!dateStr) return 'Non planifié';
    const date = new Date(dateStr);
    if (timeOnly) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // Gestion des retours de formulaires
  $effect(() => {
    if (form?.success) {
      isRescheduling = false;
      toastMessage = form.message || 'Action réussie';
      setTimeout(() => toastMessage = null, 3000);
    }
  });
</script>

{#if currentUser}
  <div class="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden relative">
    
    <!-- ========================================== -->
    <!-- COLONNE GAUCHE : TIMELINE DES VISITES      -->
    <!-- ========================================== -->
    <Card class="w-95 flex flex-col shrink-0 bg-proprios-dark/50">
      <div class="p-5 border-b border-white/5 space-y-4">
        <div>
          <h2 class="text-xl font-bold text-white mb-0.5">Missions Terrain</h2>
          <p class="text-xs text-slate-400">Planification des descentes</p>
        </div>

        <div class="relative">
          <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            bind:value={searchQuery}
            type="text" 
            placeholder="ID Parcelle, Client..." 
            class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-proprios-mint/50 transition-colors"
          />
        </div>

        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {#each [{id: 'ALL', label: 'Toutes'}, {id: 'UPCOMING', label: 'À venir'}, {id: 'COMPLETED', label: 'Terminées'}, {id: 'CERTIFICATION', label: 'Audit'}, {id: 'CLIENT', label: 'Vente'}] as filter (filter.id)}
            <button 
              type="button"
              onclick={() => activeFilter = filter.id as FilterStatus}
              class="py-1.5 px-3 text-[11px] font-bold rounded-lg whitespace-nowrap transition-all border {activeFilter === filter.id ? 'bg-proprios-card text-white border-white/10 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'}">
              {filter.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Liste Timeline -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 relative">
        <!-- Ligne verticale décorative (Timeline) -->
        <div class="absolute left-8 top-4 bottom-4 w-px bg-white/5 z-0"></div>

        {#each filteredVisits as visit (visit.id)}
          {@const isDanger = !visit.isCompleted && isPastDue(visit.date)}
          
          <button 
            type="button"
            onclick={() => { selectedVisitId = visit.id; isRescheduling = false; }}
            class="w-full text-left p-3 rounded-2xl transition-all flex gap-4 relative z-10 group {selectedVisitId === visit.id ? 'bg-proprios-card border border-white/10 shadow-lg' : 'hover:bg-white/2 border border-transparent'}">
            
            <!-- Date/Time Bubble -->
            <div class="flex flex-col items-center shrink-0 w-10 relative">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border {visit.isCompleted ? 'bg-proprios-mint/10 text-proprios-mint border-proprios-mint/20' : isDanger ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-white/5 text-slate-300 border-white/10'}">
                {#if visit.isCompleted}
                  <CheckCircle size={18} />
                {:else}
                  <span class="text-center leading-tight">
                    {visit.date ? new Date(visit.date).getDate() : '?'}
                    <span class="block text-[8px] uppercase">{visit.date ? new Date(visit.date).toLocaleString('fr-FR', { month: 'short' }) : ''}</span>
                  </span>
                {/if}
              </div>
            </div>
            
            <!-- Visit Info -->
            <div class="flex-1 min-w-0 py-0.5">
              <div class="flex justify-between items-start mb-1">
                <span class="text-xs font-bold {visit.isCompleted ? 'text-slate-400 line-through' : 'text-white'} truncate">
                  Parcelle #{visit.plot.id.slice(-6).toUpperCase()}
                </span>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider {visit.type === 'CERTIFICATION' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}">
                  {visit.type === 'CERTIFICATION' ? 'Audit' : 'Vente'}
                </span>
              </div>
              
              <p class="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mb-1.5">
                <MapPin size={10} /> {visit.plot.city || 'Lieu non spécifié'}
              </p>
              
              {#if isDanger && !visit.isCompleted}
                <p class="text-[10px] text-red-400 font-medium flex items-center gap-1">
                  <AlertTriangle size={10} /> En retard / À reprogrammer
                </p>
              {:else if !visit.isCompleted}
                <p class="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock size={10} /> {formatDate(visit.date, true)}
                </p>
              {/if}
            </div>
          </button>
        {/each}
        
        {#if filteredVisits.length === 0}
          <div class="pt-10 text-center text-slate-500 text-sm">
            Aucune mission trouvée.
          </div>
        {/if}
      </div>
    </Card>

    <!-- ========================================== -->
    <!-- COLONNE DROITE : LE TABLEAU DE BORD MISSION-->
    <!-- ========================================== -->
    <Card class="flex-1 flex flex-col min-w-0 bg-proprios-card relative overflow-hidden shadow-2xl">
      {#if !activeVisit}
        <div class="flex-1 flex flex-col items-center justify-center text-slate-500">
          <div class="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
            <Navigation size={40} class="text-slate-600" />
          </div>
          <h3 class="text-xl font-medium text-white mb-2">Centre Opérationnel</h3>
          <p class="text-sm">Sélectionnez une mission pour voir les détails d'intervention.</p>
        </div>
      {:else}
        
        <!-- HEADER MISSION -->
        <div class="p-6 border-b border-white/5 flex items-start justify-between bg-linear-to-r from-proprios-dark/50 to-transparent">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white {activeVisit.type === 'CERTIFICATION' ? 'bg-purple-500' : 'bg-blue-500'} shadow-lg">
                {#if activeVisit.type === 'CERTIFICATION'}<ShieldCheck size={20} />{:else}<Users size={20} />{/if}
              </div>
              <div>
                <h2 class="text-2xl font-black text-white tracking-tight">Mission #{activeVisit.id.slice(-6).toUpperCase()}</h2>
                <p class="text-sm text-slate-400 font-medium">
                  Objectif : {activeVisit.type === 'CERTIFICATION' ? 'Audit et vérification de la parcelle' : 'Visite pour un acheteur potentiel'}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Statut Badge Principal -->
          <div class="flex flex-col items-end gap-2">
            {#if activeVisit.isCompleted}
              <Badge variant="success">Mission Accomplie</Badge>
            {:else if isPastDue(activeVisit.date)}
              <Badge variant="danger">En Retard</Badge>
            {:else}
              <Badge variant="default">Planifiée</Badge>
            {/if}
          </div>
        </div>

        <!-- WORKSPACE (Bento Layout) -->
        <div class="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 auto-rows-max">
          
          <!-- BLOC 1 : DATE & LOCALISATION -->
          <div class="col-span-2 bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-proprios-dark rounded-2xl flex flex-col items-center justify-center border border-white/10 text-proprios-mint">
                <Calendar size={20} class="mb-0.5" />
                <span class="text-[10px] font-bold uppercase">{activeVisit.date ? new Date(activeVisit.date).toLocaleDateString('fr-FR', {month: 'short'}) : 'N/A'}</span>
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Planification</h4>
                <p class="text-lg font-bold text-white">{formatDate(activeVisit.date)}</p>
                <p class="text-xs text-slate-400 mt-0.5"><Clock size={12} class="inline mr-1" />{formatDate(activeVisit.date, true)}</p>
              </div>
            </div>
            
            <div class="w-px h-16 bg-white/10 mx-6"></div>
            
            <div class="flex-1 flex items-center gap-4">
              <!-- Thumbnail Parcelle -->
              <div class="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border border-white/10 shrink-0">
                {#if activeVisit.plot?.images.length > 0}
                  <img src={activeVisit.plot?.images[0].url} class="w-full h-full object-cover" alt="Parcelle" />
                {:else}
                  <div class="w-full h-full flex items-center justify-center"><Map size={24} class="text-slate-600" /></div>
                {/if}
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lieu d'intervention</h4>
                <p class="text-sm font-bold text-white truncate max-w-50">Parcelle #{activeVisit.plot.id.slice(-6).toUpperCase()}</p>
                <p class="text-xs text-slate-400 truncate max-w-50 mt-0.5"><MapPin size={12} class="inline mr-1" />{activeVisit.plot.address || activeVisit.plot.city || 'Non renseigné'}</p>
              </div>
            </div>
          </div>

          <!-- BLOC 2 : CONTACTS SUR PLACE -->
          <div class="col-span-1 bg-white/5 border border-white/10 rounded-3xl p-5">
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users size={14} /> Personnes à rencontrer
            </h4>
            
            <div class="space-y-4">
              <!-- Propriétaire -->
              <div class="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                <div>
                  <p class="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Propriétaire</p>
                  <p class="text-sm font-bold text-white">{activeVisit.plot.proprio.name}</p>
                </div>
                {#if activeVisit.plot.proprio.telephone}
                  <a href={`tel:${activeVisit.plot.proprio.telephone}`} class="w-8 h-8 rounded-full bg-proprios-mint/10 text-proprios-mint flex items-center justify-center hover:bg-proprios-mint hover:text-proprios-dark transition-colors">
                    <PhoneCall size={14} />
                  </a>
                {/if}
              </div>

              <!-- Client (Si visite FORCLIENT) -->
              {#if activeVisit.type === 'FORCLIENT' && activeVisit.user}
                <div class="flex items-center justify-between p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                  <div class="flex items-center gap-3">
                    <img src={activeVisit.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${activeVisit.user.name}`} alt="Client" class="w-8 h-8 rounded-full border border-white/10" />
                    <div>
                      <p class="text-[10px] text-blue-400 uppercase font-bold mb-0.5">Client Visiteur</p>
                      <p class="text-sm font-bold text-white">{activeVisit.user.name}</p>
                    </div>
                  </div>
                  {#if activeVisit.user.telephone}
                    <a href={`tel:${activeVisit.user.telephone}`} class="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors">
                      <PhoneCall size={14} />
                    </a>
                  {/if}
                </div>
              {/if}
            </div>
          </div>

          <!-- BLOC 3 : FINANCES & ACTIONS -->
          <div class="col-span-1 bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard size={14} /> Logistique & Finances
              </h4>
              
              <div class="flex items-center justify-between p-4 bg-proprios-dark/50 rounded-xl border border-white/5 mb-4">
                <div>
                  <p class="text-sm font-bold text-white">Frais de descente</p>
                  <p class="text-xs text-slate-400 mt-1">À charge du client / propriétaire</p>
                </div>
                
                <!-- Toggle Form pour Paiement -->
                <form method="POST" action="?/togglePayment" use:enhance>
                  <input type="hidden" name="visitId" value={activeVisit.id} />
                  <input type="hidden" name="isPaid" value={activeVisit.paid ? 'true' : 'false'} />
                  
                  <button type="submit" class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 {activeVisit.paid ? 'bg-proprios-mint/10 border-proprios-mint/20 text-proprios-mint' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'}">
                    {#if activeVisit.paid}<CheckCircle size={14}/> Payé{:else}<AlertTriangle size={14}/> Non Payé{/if}
                  </button>
                </form>
              </div>
            </div>

            <!-- Bouton Reprogrammer -->
            {#if !activeVisit.isCompleted}
              <button 
                type="button" 
                onclick={() => isRescheduling = !isRescheduling}
                class="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2">
                <RefreshCcw size={14} /> Reprogrammer la date
              </button>
            {/if}
          </div>
          
          <!-- BLOC REPROGRAMMATION (Dynamique) -->
          {#if isRescheduling}
            <div class="col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div class="w-10 h-10 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center shrink-0"><Calendar size={20} /></div>
              <div class="flex-1">
                <h4 class="text-sm font-bold text-amber-500">Nouvelle date</h4>
                <p class="text-xs text-amber-500/70">Sélectionnez la nouvelle date d'intervention.</p>
              </div>
              
              <form method="POST" action="?/rescheduleVisit" use:enhance class="flex items-center gap-3">
                <input type="hidden" name="visitId" value={activeVisit.id} />
                <input type="datetime-local" name="newDate" bind:value={newDateInput} required class="bg-proprios-dark border border-amber-500/30 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-500 color-scheme-dark" />
                <button type="submit" disabled={!newDateInput} class="px-4 py-2.5 bg-amber-500 text-proprios-dark font-bold rounded-xl transition-colors disabled:opacity-50">Confirmer</button>
              </form>
            </div>
          {/if}

          <!-- BLOC ACTION FINALE (Rapport Validé) -->
          <div class="col-span-2 mt-2">
            {#if !activeVisit.isCompleted}
              <form method="POST" action="?/completeVisit" use:enhance>
                <input type="hidden" name="visitId" value={activeVisit.id} />
                <button 
                  type="submit"
                  class="w-full py-4 bg-proprios-mint hover:bg-proprios-mint-hover text-proprios-dark font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(2,225,177,0.2)] flex items-center justify-center gap-3 group">
                  <FileSignature size={20} />
                  VALIDER LE RAPPORT DE DESCENTE
                  <ChevronRight size={20} class="group-hover:translate-x-1 transition-transform" />
                </button>
                {#if activeVisit.type === 'CERTIFICATION'}
                  <p class="text-[11px] text-center text-slate-500 mt-2">Valider cette descente fera passer la certification de la parcelle à l'étape finale.</p>
                {/if}
              </form>
            {:else}
              <div class="w-full py-4 bg-proprios-dark/50 border border-proprios-mint/20 text-proprios-mint font-bold rounded-2xl flex items-center justify-center gap-2 opacity-70">
                <CheckCircle size={20} /> MISSION CLÔTURÉE
              </div>
            {/if}
          </div>

        </div>
      {/if}

      <!-- TOAST DE NOTIFICATION -->
      {#if toastMessage}
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 bg-proprios-card border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in duration-300 z-50">
          <CheckCircle size={20} class="text-proprios-mint" /> {toastMessage}
        </div>
      {/if}
    </Card>
  </div>
{/if}

<style>
  .color-scheme-dark {
    color-scheme: dark;
  }
</style>
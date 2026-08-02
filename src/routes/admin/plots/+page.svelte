<script lang="ts">
  import { enhance } from '$app/forms';
  import Card from '$lib/components/admin/ui/Card.svelte';
  import Badge from '$lib/components/admin/ui/Badge.svelte';
  import { 
    Search, MapPin, Map, Home, Building2, Trees, ShieldCheck,
    Maximize, DollarSign, Camera, FileText, CheckCircle, Edit3, X, Save,
    Copy, Trash2, Navigation, MessageSquare, AlertTriangle, Filter
  } from '@lucide/svelte';
  
  import type { PageData } from './$types';

  // --- INTERFACES STRICTES ---
  interface FormResult { success?: boolean; message?: string; }
  type PlotCategory = 'HOUSE' | 'COMPANY' | 'GROUND' | 'OTHER';
  type FilterStatus = 'ALL' | 'CERTIFIED' | 'PENDING' | 'FOR_SALE';

  interface Proprio { id: string; name: string; image: string | null; telephone: string | null; certified: boolean; }
  interface Image {
    id: string;
    url: string;
    publicId: string;
    plotId: string;
  }
  interface Document {
    id: string;
    url: string;
    publicId: string;
    plotId: string;
  }
  interface Visit {
    id: string;
    date: Date | null;
    type: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string | null;
    plotId: string;
    agentId: string | null;
    paid: boolean;
    isCompleted: boolean;
  }

  interface PlotData {
    id: string;
    categoryId: PlotCategory;
    width: number | null;
    height: number | null;
    price: number | null;
    address: string | null;
    city: string | null;
    canSell: boolean;
    certified: boolean;
    certifStep: number;
    createdAt: Date;
    proprio: Proprio;
    images: Image[];
    documents: Document[];
    visits: Visit[];
    _count: { messages: number };
  }

  type AdminPageData = Omit<PageData, 'plots'> & {
    plots: PlotData[];
    user: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null;
      role?: string;
    } | null;
  };

  let { data, form }: { data: AdminPageData; form: FormResult | null } = $props();

  // --- ÉTATS (Runes) ---
  let searchQuery = $state('');
  let activeFilter = $state<FilterStatus>('ALL');
  let selectedPlotId = $state<string | null>(null);
  let isEditing = $state(false);
  let copiedId = $state(false);
  let showSuccessToast = $state(false);

  // --- LOGIQUE DÉRIVÉE ---
  let typedPlots = $derived(data.plots as unknown as PlotData[]);

  let filteredPlots = $derived(
    typedPlots.filter(plot => {
      const matchSearch = plot.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          plot.proprio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (plot.city && plot.city.toLowerCase().includes(searchQuery.toLowerCase()));
                          
      if (activeFilter === 'CERTIFIED') return matchSearch && plot.certified;
      if (activeFilter === 'PENDING') return matchSearch && !plot.certified;
      if (activeFilter === 'FOR_SALE') return matchSearch && plot.canSell;
      return matchSearch;
    })
  );

  let activePlot = $derived(filteredPlots.find(p => p.id === selectedPlotId));
  let isAdmin = $derived(data.user?.role === 'admin');

  // --- HELPERS ---
  const getCategoryIcon = (cat: PlotCategory) => {
    switch(cat) {
      case 'HOUSE': return Home;
      case 'COMPANY': return Building2;
      case 'GROUND': return Trees;
      default: return Map;
    }
  };

  const getCategoryLabel = (cat: PlotCategory) => {
    switch(cat) {
      case 'HOUSE': return 'Maison / Villa';
      case 'COMPANY': return 'Local Commercial';
      case 'GROUND': return 'Terrain Nu';
      default: return 'Autre';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    copiedId = true;
    setTimeout(() => copiedId = false, 2000);
  };

  $effect(() => {
    if (form?.success) {
      isEditing = false;
      showSuccessToast = true;
      setTimeout(() => showSuccessToast = false, 3000);
    }
  });
</script>

{#if data.user}
  <div class="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden relative">
    
    <!-- ========================================== -->
    <!-- COLONNE GAUCHE : EXPLORATEUR (380px)       -->
    <!-- ========================================== -->
    <Card class="w-95 flex flex-col shrink-0 bg-proprios-dark/50">
      <div class="p-5 border-b border-white/5 space-y-4">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-bold text-white mb-0.5">Registre Foncier</h2>
            <p class="text-xs text-slate-400">{filteredPlots.length} biens répertoriés</p>
          </div>
          <div class="w-10 h-10 bg-proprios-mint/10 text-proprios-mint rounded-xl flex items-center justify-center border border-proprios-mint/20">
            <Map size={20} />
          </div>
        </div>

        <div class="relative">
          <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            bind:value={searchQuery}
            type="text" 
            placeholder="ID, Client, Ville..." 
            class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-proprios-mint/50 transition-colors"
          />
        </div>

        <div class="grid grid-cols-2 gap-2">
          {#each [{id: 'ALL', label: 'Tous'}, {id: 'CERTIFIED', label: 'Certifiés'}, {id: 'PENDING', label: 'En attente'}, {id: 'FOR_SALE', label: 'À Vendre'}] as filter (filter.id)}
            <button 
              type="button"
              onclick={() => activeFilter = filter.id as FilterStatus}
              class="py-2 px-3 text-xs font-medium rounded-xl transition-all border {activeFilter === filter.id ? 'bg-proprios-card text-white border-white/10 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'}">
              {filter.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        {#each filteredPlots as plot (plot.id)}
          {@const Icon = getCategoryIcon(plot.categoryId)}
          <button 
            type="button"
            onclick={() => { selectedPlotId = plot.id; isEditing = false; }}
            class="w-full text-left p-3 rounded-2xl transition-all flex gap-3 group border {selectedPlotId === plot.id ? 'bg-proprios-mint/5 border-proprios-mint/30 shadow-[0_0_15px_rgba(2,225,177,0.05)]' : 'bg-white/1 border-white/5 hover:bg-white/3'}">
            
            <!-- Thumbnail -->
            <div class="w-16 h-16 rounded-xl overflow-hidden bg-proprios-dark shrink-0 relative border border-white/10">
              {#if plot.images.length > 0}
                <img src={plot.images[0].url} alt="Aperçu" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              {:else}
                <div class="w-full h-full flex items-center justify-center text-slate-600"><Icon size={24} /></div>
              {/if}
              {#if plot.certified}
                <div class="absolute bottom-1 right-1 bg-proprios-dark rounded-full p-0.5"><div class="bg-proprios-mint text-proprios-dark rounded-full p-0.5"><ShieldCheck size={10} /></div></div>
              {/if}
            </div>
            
            <!-- Info -->
            <div class="flex-1 min-w-0 py-0.5">
              <div class="flex justify-between items-start mb-1">
                <span class="text-xs font-bold text-white truncate pr-2">#{plot.id.slice(-6).toUpperCase()}</span>
                {#if plot.canSell}
                  <span class="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" title="À Vendre"></span>
                {/if}
              </div>
              <p class="text-[11px] text-slate-400 truncate mb-1.5">{plot.proprio.name}</p>
              
              <!-- Mini Progress bar pour les non-certifiés -->
              {#if !plot.certified}
                <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-500 transition-all" style="width: {(plot.certifStep / 4) * 100}%"></div>
                </div>
              {:else}
                <div class="flex items-center gap-1 text-[10px] text-slate-500"><MapPin size={10} /> {plot.city || 'Ville inconnue'}</div>
              {/if}
            </div>
          </button>
        {/each}
        
        {#if filteredPlots.length === 0}
          <div class="p-8 text-center flex flex-col items-center justify-center text-slate-500 gap-3 mt-10">
            <Filter size={32} class="opacity-30" />
            <p class="text-sm">Aucun bien ne correspond aux filtres.</p>
          </div>
        {/if}
      </div>
    </Card>

    <!-- ========================================== -->
    <!-- COLONNE DROITE : LE VISUALISEUR (BENTO)    -->
    <!-- ========================================== -->
    <Card class="flex-1 flex flex-col min-w-0 bg-proprios-card relative overflow-hidden shadow-2xl">
      {#if !activePlot}
        <div class="flex-1 flex flex-col items-center justify-center text-slate-500">
          <div class="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
            <Map size={40} class="text-slate-600" />
          </div>
          <h3 class="text-xl font-medium text-white mb-2">Détails de la Parcelle</h3>
          <p class="text-sm">Explorez le registre foncier en sélectionnant un bien.</p>
        </div>
      {:else}
        {@const Icon = getCategoryIcon(activePlot.categoryId)}
        
        <!-- HEADER PARCELLE (Hero Section) -->
        <div class="h-40 shrink-0 relative bg-proprios-dark">
          <!-- Background Image Blur -->
          {#if activePlot.images.length > 0}
            <img src={activePlot.images[0].url} alt="Cover" class="absolute inset-0 w-full h-full object-cover opacity-30" />
            <div class="absolute inset-0 bg-linear-to-t from-proprios-card to-transparent"></div>
          {/if}

          <div class="absolute inset-0 p-6 flex flex-col justify-end">
            <div class="flex items-end justify-between">
              <div class="flex items-center gap-5">
                <div class="w-16 h-16 bg-proprios-card border border-white/10 rounded-2xl flex items-center justify-center shadow-lg relative z-10 text-white">
                  <Icon size={28} />
                </div>
                <div class="relative z-10">
                  <div class="flex items-center gap-3 mb-1">
                    <h2 class="text-3xl font-black text-white tracking-tight">#{activePlot.id.slice(-6).toUpperCase()}</h2>
                    <button type="button" onclick={() => copyToClipboard(activePlot.id)} class="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors" title="Copier l'ID complet">
                      {#if copiedId}<CheckCircle size={14} class="text-proprios-mint" />{:else}<Copy size={14} />{/if}
                    </button>
                    {#if activePlot.certified}
                      <Badge variant="success">Certifié PropriOS</Badge>
                    {:else}
                      <Badge variant="warning">Étape {activePlot.certifStep}/4</Badge>
                    {/if}
                  </div>
                  <p class="text-slate-300 font-medium flex items-center gap-2">
                    <MapPin size={14} class="text-proprios-mint" /> 
                    {activePlot.address || 'Adresse non spécifiée'}, {activePlot.city || 'Ville non spécifiée'}
                  </p>
                </div>
              </div>

              <!-- Action Bar Top Right -->
              <div class="flex gap-2 relative z-10">
                {#if !isEditing}
                  <button type="button" onclick={() => isEditing = true} class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors border border-white/10 flex items-center gap-2">
                    <Edit3 size={16} /> Éditer
                  </button>
                {:else}
                  <button type="button" onclick={() => isEditing = false} class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-bold rounded-xl transition-colors border border-red-500/20 flex items-center gap-2">
                    <X size={16} /> Annuler
                  </button>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- CONTENU PRINCIPAL (Bento Grid) -->
        <div class="flex-1 overflow-y-auto p-6">
          {#if isEditing}
            <!-- MODE ÉDITION (Formulaire) -->
            <form method="POST" action="?/updatePlot" use:enhance class="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4">
              <input type="hidden" name="plotId" value={activePlot.id} />
              
              <div class="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 class="text-lg font-bold text-white flex items-center gap-2"><Edit3 size={18} class="text-proprios-mint" /> Modifier les informations</h3>
                <button type="submit" class="px-6 py-2.5 bg-proprios-mint hover:bg-proprios-mint-hover text-proprios-dark text-sm font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(2,225,177,0.3)] flex items-center gap-2">
                  <Save size={16} /> Enregistrer
                </button>
              </div>

              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label for="categoryId" class="block text-xs font-bold text-slate-400 uppercase">Type de Bien</label>
                  <select id="categoryId" name="categoryId" class="w-full bg-proprios-dark border border-white/10 rounded-xl p-3 text-sm text-white focus:border-proprios-mint/50 focus:outline-none">
                    <option value="HOUSE" selected={activePlot.categoryId === 'HOUSE'}>Maison / Villa</option>
                    <option value="COMPANY" selected={activePlot.categoryId === 'COMPANY'}>Local Commercial</option>
                    <option value="GROUND" selected={activePlot.categoryId === 'GROUND'}>Terrain Nu</option>
                    <option value="OTHER" selected={activePlot.categoryId === 'OTHER'}>Autre</option>
                  </select>
                </div>

                <div class="space-y-2">
                  <label for="price" class="block text-xs font-bold text-slate-400 uppercase">Prix Estimé ($)</label>
                  <div class="relative">
                    <DollarSign size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="number" id="price" name="price" value={activePlot.price || ''} placeholder="0" class="w-full bg-proprios-dark border border-white/10 rounded-xl p-3 pl-9 text-sm text-white focus:border-proprios-mint/50 focus:outline-none" />
                  </div>
                </div>

                <div class="space-y-2">
                  <label for="width" class="block text-xs font-bold text-slate-400 uppercase">Largeur (m)</label>
                  <input type="number" id="width" name="width" value={activePlot.width || ''} class="w-full bg-proprios-dark border border-white/10 rounded-xl p-3 text-sm text-white focus:border-proprios-mint/50 focus:outline-none" />
                </div>
                
                <div class="space-y-2">
                  <label for="height" class="block text-xs font-bold text-slate-400 uppercase">Longueur (m)</label>
                  <input type="number" id="height" name="height" value={activePlot.height || ''} class="w-full bg-proprios-dark border border-white/10 rounded-xl p-3 text-sm text-white focus:border-proprios-mint/50 focus:outline-none" />
                </div>

                <div class="space-y-2">
                  <label for="city" class="block text-xs font-bold text-slate-400 uppercase">Ville</label>
                  <input type="text" id="city" name="city" value={activePlot.city || ''} class="w-full bg-proprios-dark border border-white/10 rounded-xl p-3 text-sm text-white focus:border-proprios-mint/50 focus:outline-none" />
                </div>

                <div class="space-y-2">
                  <label for="address" class="block text-xs font-bold text-slate-400 uppercase">Adresse Complète</label>
                  <input type="text" id="address" name="address" value={activePlot.address || ''} class="w-full bg-proprios-dark border border-white/10 rounded-xl p-3 text-sm text-white focus:border-proprios-mint/50 focus:outline-none" />
                </div>

                <div class="col-span-2 mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-bold text-white">Mettre en Vente</h4>
                    <p class="text-xs text-slate-400 mt-1">Autoriser l'affichage de cette parcelle sur la marketplace publique.</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="canSell" value="true" checked={activePlot.canSell} class="sr-only peer">
                    <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
              </div>
            </form>

            {#if isAdmin}
              <form method="POST" action="?/deletePlot" use:enhance class="mt-8 border-t border-red-500/20 pt-8">
                <input type="hidden" name="plotId" value={activePlot.id} />
                <h4 class="text-sm font-bold text-red-500 mb-2">Zone Dangereuse</h4>
                <p class="text-xs text-slate-400 mb-4">Cette action est irréversible. La suppression effacera toutes les images et documents liés.</p>
                <button type="submit" class="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold rounded-xl transition-colors border border-red-500/20 flex items-center gap-2">
                  <Trash2 size={16} /> Supprimer la parcelle
                </button>
              </form>
            {/if}

          {:else}
            <!-- MODE LECTURE (Bento Grid) -->
            <div class="grid grid-cols-3 gap-4 auto-rows-30 animate-in fade-in zoom-in-95 duration-300">
              
              <!-- BENTO 1 : Stats Principales (2 colonnes) -->
              <div class="col-span-2 row-span-1 bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center justify-around relative overflow-hidden">
                <div class="absolute -right-10 -top-10 w-32 h-32 bg-proprios-mint/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div class="text-center">
                  <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 flex justify-center"><DollarSign size={14} class="text-proprios-mint" /></p>
                  <p class="text-2xl font-black text-white">{activePlot.price ? `${activePlot.price.toLocaleString()} $` : 'N/A'}</p>
                  <p class="text-[10px] text-slate-500">Valeur Estimée</p>
                </div>
                
                <div class="w-px h-12 bg-white/10"></div>
                
                <div class="text-center">
                  <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 flex justify-center"><Maximize size={14} class="text-proprios-mint" /></p>
                  <p class="text-2xl font-black text-white">{activePlot.width && activePlot.height ? (activePlot.width * activePlot.height) : 0} <span class="text-sm font-medium">m²</span></p>
                  <p class="text-[10px] text-slate-500">{activePlot.width || 0}m x {activePlot.height || 0}m</p>
                </div>

                <div class="w-px h-12 bg-white/10"></div>

                <div class="text-center">
                  <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 flex justify-center"><Navigation size={14} class="text-proprios-mint" /></p>
                  <p class="text-lg font-black text-white mt-1">{getCategoryLabel(activePlot.categoryId)}</p>
                  <p class="text-[10px] text-slate-500">Type de Bien</p>
                </div>
              </div>

              <!-- BENTO 2 : Propriétaire (1 colonne, 2 rows) -->
              <div class="col-span-1 row-span-2 bg-linear-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-5 flex flex-col">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Propriétaire</h3>
                <div class="flex flex-col items-center flex-1 justify-center text-center">
                  <div class="relative mb-3">
                    <img src={activePlot.proprio.image || `https://api.dicebear.com/7.x/initials/svg?seed=${activePlot.proprio.name}`} class="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-lg" alt="Proprio" />
                    {#if activePlot.proprio.certified}
                      <div class="absolute -bottom-2 -right-2 bg-proprios-card rounded-full p-1"><div class="bg-proprios-mint text-proprios-dark rounded-full p-0.5"><CheckCircle size={14} /></div></div>
                    {/if}
                  </div>
                  <p class="text-white font-bold">{activePlot.proprio.name}</p>
                  <p class="text-xs text-slate-400 mb-4">{activePlot.proprio.telephone || 'Pas de numéro'}</p>
                  
                  <a href="/admin/messages?user={activePlot.proprio.id}" class="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2">
                    <MessageSquare size={14} /> Contacter
                  </a>
                </div>
              </div>

              <!-- BENTO 3 : Galerie d'Images (2 colonnes, 2 rows) -->
              <div class="col-span-2 row-span-2 bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Camera size={14} /> Galerie ({activePlot.images.length})</h3>
                </div>
                
                {#if activePlot.images.length > 0}
                  <div class="flex-1 grid grid-cols-3 gap-3 overflow-hidden rounded-xl">
                    <!-- Image Principale prend 2 places -->
                    <div class="col-span-2 row-span-2 rounded-xl overflow-hidden relative group">
                      <img src={activePlot.images[0].url} alt="Vue 1" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <!-- Miniatures -->
                    {#each activePlot.images.slice(1, 3) as img (img.id)}
                      <div class="rounded-xl overflow-hidden relative group">
                        <img src={img.url} alt="Vue secondaire" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    {/each}
                    <!-- Placeholder si moins de 3 images -->
                    {#if activePlot.images.length < 3}
                       
                       {#each Array(3 - activePlot.images.length) as _, index (index)}
                         <div class="bg-black/20 rounded-xl border border-white/5 flex items-center justify-center text-slate-600"><Camera size={20} /></div>
                       {/each}
                    {/if}
                  </div>
                {:else}
                  <div class="flex-1 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500">
                    <Camera size={32} class="mb-2 opacity-50" />
                    <p class="text-xs">Aucune photo du terrain</p>
                  </div>
                {/if}
              </div>

              <!-- BENTO 4 : Documents Légaux (1 colonne, 1 row) -->
              <div class="col-span-1 row-span-1 bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col justify-center">
                <div class="flex justify-between items-center mb-3">
                  <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><FileText size={14} /> Documents</h3>
                  <Badge variant={activePlot.documents.length > 0 ? 'success' : 'warning'}>{activePlot.documents.length}</Badge>
                </div>
                {#if activePlot.documents.length > 0}
                  <div class="flex -space-x-2">
                    {#each activePlot.documents.slice(0,3) as doc (doc.id)}
                      <div class="w-10 h-10 rounded-xl bg-slate-800 border-2 border-proprios-card flex items-center justify-center text-slate-300 z-10"><FileText size={16}/></div>
                    {/each}
                  </div>
                  <a href="/admin/certifications?plot={activePlot.id}" class="text-[10px] text-proprios-mint mt-3 hover:underline">Ouvrir le dossier légal &rarr;</a>
                {:else}
                  <p class="text-xs text-amber-500 flex items-center gap-1"><AlertTriangle size={12}/> Dossier vide</p>
                {/if}
              </div>

            </div>
          {/if}
        </div>
      {/if}

      <!-- TOAST SUCCESS (Designé pour s'intégrer parfaitement) -->
      {#if showSuccessToast}
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 bg-proprios-mint text-proprios-dark px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(2,225,177,0.4)] font-bold flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in duration-300 z-50 border border-white/20">
          <CheckCircle size={20} /> Modifications enregistrées !
        </div>
      {/if}
    </Card>
  </div>
{/if}
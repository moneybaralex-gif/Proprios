<script lang="ts">
  import { enhance } from '$app/forms';
  import Card from '$lib/components/admin/ui/Card.svelte';
  import Badge from '$lib/components/admin/ui/Badge.svelte';
  import { 
    Search, User as UserIcon, Map, Ban, CheckCircle, 
    Save, Mail, Phone, Fingerprint, Lock, ShieldAlert, AlertTriangle,
    ExternalLink, ShieldCheck, Clock3, XCircle
  } from '@lucide/svelte';
  import type { PageData, ActionData } from './$types';

  interface CurrentUser {
    id: string;
    name: string;
    email: string;
    role: string | null;
    type?: string;
    image?: string | null;
  }

  type UserFilter = 'ALL' | 'PROPRIO' | 'EMPLOYEE' | 'KYC_PENDING' | 'BANNED';
  type TabType = 'PROFILE' | 'KYC' | 'SECURITY';

  interface UserData {
    id: string;
    name: string;
    email: string;
    telephone: string | null;
    image: string | null;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    createdAt: string;
    type: string;
    cardID: string | null;
    typeID: string | null;
    certified: boolean;
    identityCardPhotoUrl: string | null;
    portraitPhotoUrl: string | null;
    cardHoldingPhotoUrl: string | null;
    kycSubmittedAt: string | null;
    kycReviewedAt: string | null;
    kycRejectionReason: string | null;
    _count: { plots: number; visits: number };
  }

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let currentUser = $derived(data.currentUser as unknown as CurrentUser | null);
  let activeFilter = $state<UserFilter>('ALL');
  let activeTab = $state<TabType>('PROFILE');
  let searchQuery = $state('');
  let selectedUserId = $state<string | null>(null);
  let showRejectForm = $state(false);

  const FILTERS: UserFilter[] = ['ALL', 'PROPRIO', 'EMPLOYEE', 'KYC_PENDING', 'BANNED'];

  let typedUsers = $derived(data.users as unknown as UserData[]);

  let filteredUsers = $derived(
    typedUsers.filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
                          
      if (activeFilter === 'PROPRIO') return matchSearch && user.type === 'PROPRIO';
      if (activeFilter === 'EMPLOYEE') return matchSearch && (user.role === 'employee' || user.role === 'admin');
      if (activeFilter === 'KYC_PENDING') return matchSearch && Boolean(user.kycSubmittedAt && !user.certified && !user.kycRejectionReason);
      if (activeFilter === 'BANNED') return matchSearch && user.banned === true;
      return matchSearch;
    })
  );

  let activeUser = $derived(typedUsers.find((u) => u.id === selectedUserId));
  let isAdmin = $derived(currentUser?.role === 'admin');
  
  let showSuccessToast = $state(false);
  $effect(() => {
    if (form?.success) {
      showSuccessToast = true;
      showRejectForm = false;
      setTimeout(() => (showSuccessToast = false), 3500);
    }
  });
</script>

{#if currentUser}
  <div class="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden relative">
    
    <!-- COLONNE 1 : LISTE DES UTILISATEURS -->
    <Card class="w-88 flex flex-col shrink-0 bg-slate-900/60 border-white/10">
      <div class="p-4 border-b border-white/5 space-y-4">
        <div>
          <h2 class="text-lg font-bold text-white mb-1">Utilisateurs</h2>
          <p class="text-xs text-slate-400">{filteredUsers.length} compte(s) listé(s)</p>
        </div>

        <div class="relative">
          <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            bind:value={searchQuery}
            type="text" 
            placeholder="Rechercher nom, email..." 
            class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
          />
        </div>

        <div class="flex gap-1 bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {#each FILTERS as filter (filter)}
            <button 
              type="button"
              onclick={() => (activeFilter = filter)}
              class="px-3 py-1.5 text-[11px] font-bold rounded-lg whitespace-nowrap transition-all {activeFilter === filter ? 'bg-emerald-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}">
              {filter === 'ALL' ? 'Tous' : filter === 'PROPRIO' ? 'Proprios' : filter === 'EMPLOYEE' ? 'Équipe' : filter === 'KYC_PENDING' ? 'KYC Attente' : 'Bannis'}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        {#each filteredUsers as user (user.id)}
          <button 
            type="button"
            onclick={() => { selectedUserId = user.id; activeTab = 'PROFILE'; }}
            class="w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 {selectedUserId === user.id ? 'bg-emerald-400/15 border border-emerald-400/30' : 'hover:bg-white/5 border border-transparent'}">
            
            <div class="relative">
              <img 
                src={user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                alt={user.name} 
                class="w-10 h-10 rounded-full border border-white/10 object-cover" 
              />
              {#if user.certified}
                <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
              {:else if user.kycSubmittedAt && !user.kycRejectionReason}
                <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-slate-900 rounded-full animate-pulse"></span>
              {/if}
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-0.5">
                <span class="text-sm font-semibold text-white truncate {user.banned ? 'line-through opacity-50' : ''}">{user.name}</span>
                {#if user.kycSubmittedAt && !user.certified && !user.kycRejectionReason}
                  <span class="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">KYC</span>
                {/if}
              </div>
              <p class="text-xs text-slate-400 truncate flex items-center gap-1">
                {user.type} • {user._count.plots} parcelles
              </p>
            </div>
          </button>
        {/each}
        
        {#if filteredUsers.length === 0}
          <div class="p-8 text-center flex flex-col items-center justify-center text-slate-500 gap-3">
            <UserIcon size={32} class="opacity-30" />
            <p class="text-sm">Aucun utilisateur trouvé.</p>
          </div>
        {/if}
      </div>
    </Card>

    <!-- COLONNE 2 : DÉTAILS, KYC & ÉDITION -->
    <Card class="flex-1 flex flex-col min-w-0 bg-slate-900/60 border-white/10 relative overflow-hidden">
      {#if !activeUser}
        <div class="flex-1 flex flex-col items-center justify-center text-slate-500">
          <UserIcon size={64} class="mb-4 opacity-20" />
          <h3 class="text-lg font-medium text-white mb-1">Sélectionnez un compte</h3>
          <p class="text-sm">Consultez et validez les dossiers KYC et gérez les accès.</p>
        </div>
      {:else}
        
        <!-- HEADER UTILISATEUR ACTIF -->
        <div class="p-6 border-b border-white/5 flex items-start justify-between bg-white/2">
          <div class="flex items-center gap-5">
            <div class="relative">
              <img 
                src={activeUser.image || `https://api.dicebear.com/7.x/initials/svg?seed=${activeUser.name}`} 
                alt={activeUser.name} 
                class="w-16 h-16 rounded-2xl border border-white/10 object-cover" 
              />
              {#if activeUser.certified}
                <div class="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-1">
                  <div class="bg-emerald-400 text-slate-950 rounded-full p-0.5"><CheckCircle size={14} /></div>
                </div>
              {/if}
            </div>
            
            <div>
              <h2 class="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                {activeUser.name}
                {#if activeUser.certified}
                  <Badge variant="success">Certifié</Badge>
                {:else if activeUser.kycSubmittedAt && !activeUser.kycRejectionReason}
                  <Badge variant="warning">KYC en attente</Badge>
                {:else if activeUser.kycRejectionReason}
                  <Badge variant="danger">KYC Rejeté</Badge>
                {/if}
                {#if activeUser.banned}
                  <Badge variant="danger">Banni</Badge>
                {/if}
              </h2>
              <div class="flex items-center gap-3 text-xs text-slate-400">
                <span class="flex items-center gap-1"><Mail size={13}/> {activeUser.email}</span>
                <span>•</span>
                <span class="flex items-center gap-1"><Map size={13}/> {activeUser._count.plots} parcelles</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ONGLETS -->
        <div class="flex px-6 border-b border-white/5 bg-slate-950/20">
          {#each [
            { id: 'PROFILE', label: 'Profil Général' },
            { id: 'KYC', label: 'Dossier KYC & Pièces' },
            { id: 'SECURITY', label: 'Sécurité & Rôles' }
          ] as tab (tab.id)}
            <button 
              type="button"
              onclick={() => (activeTab = tab.id as TabType)}
              class="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors {activeTab === tab.id ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}">
              {tab.label}
            </button>
          {/each}
        </div>

        <!-- CONTENU DE L'ONGLET -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- 1. ONGLET PROFIL -->
          {#if activeTab === 'PROFILE'}
            <form method="POST" action="?/updateProfile" use:enhance class="max-w-2xl space-y-6">
              <input type="hidden" name="userId" value={activeUser.id} />
              
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label for="name" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Nom Complet</label>
                  <input type="text" id="name" name="name" value={activeUser.name} required class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400/50" />
                </div>
                
                <div class="space-y-1.5">
                  <label for="email" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                  <input type="email" id="email" name="email" value={activeUser.email} required class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400/50" />
                </div>

                <div class="space-y-1.5">
                  <label for="telephone" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Téléphone</label>
                  <div class="relative">
                    <Phone size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" id="telephone" name="telephone" value={activeUser.telephone || ''} placeholder="+243..." class="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-9 text-sm text-white focus:outline-none focus:border-emerald-400/50" />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label for="typeID" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Type de Pièce</label>
                  <select id="typeID" name="typeID" class="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400/50">
                    <option value="" selected={!activeUser.typeID}>Non spécifié</option>
                    <option value="NATIONAL" selected={activeUser.typeID === 'NATIONAL'}>Carte Nationale / Électeur</option>
                    <option value="PASSPORT" selected={activeUser.typeID === 'PASSPORT'}>Passeport</option>
                    <option value="DRIVING" selected={activeUser.typeID === 'DRIVING'}>Permis de Conduire</option>
                  </select>
                </div>

                <div class="col-span-2 space-y-1.5">
                  <label for="cardID" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Numéro de la Pièce (ID)</label>
                  <div class="relative">
                    <Fingerprint size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" id="cardID" name="cardID" value={activeUser.cardID || ''} placeholder="Numéro ID" class="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-9 text-sm text-white focus:outline-none focus:border-emerald-400/50" />
                  </div>
                </div>
              </div>

              <div class="pt-2 flex justify-end">
                <button type="submit" class="px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl transition-colors flex items-center gap-2">
                  <Save size={16} /> Enregistrer Profil
                </button>
              </div>
            </form>
            
          <!-- 2. ONGLET KYC & PIÈCES JUSTIFICATIVES -->
          {:else if activeTab === 'KYC'}
            <div class="space-y-6">
              
              <!-- STATUT ET RÉSUMÉ DU DOSSIER -->
              <div class="rounded-2xl border border-white/10 bg-white/2 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="space-y-1">
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">État actuel du dossier</span>
                  <div class="flex items-center gap-2">
                    {#if activeUser.certified}
                      <span class="text-base font-bold text-emerald-400 flex items-center gap-1.5"><ShieldCheck size={18} /> Compte Officiellement Certifié</span>
                    {:else if activeUser.kycSubmittedAt && !activeUser.kycRejectionReason}
                      <span class="text-base font-bold text-amber-400 flex items-center gap-1.5"><Clock3 size={18} /> Soumis le {new Date(activeUser.kycSubmittedAt).toLocaleDateString('fr-FR')} - En attente d'examen</span>
                    {:else if activeUser.kycRejectionReason}
                      <span class="text-base font-bold text-rose-400 flex items-center gap-1.5"><XCircle size={18} /> Rejeté : {activeUser.kycRejectionReason}</span>
                    {:else}
                      <span class="text-base font-bold text-slate-400">Aucun document soumis</span>
                    {/if}
                  </div>
                </div>

                <!-- ACTIONS ADMINISTRATIVES SUR LE KYC -->
                <div class="flex items-center gap-2">
                  {#if !activeUser.certified}
                    <form method="POST" action="?/approveKyc" use:enhance>
                      <input type="hidden" name="userId" value={activeUser.id} />
                      <button type="submit" class="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-400/20">
                        <CheckCircle size={14} /> Valider la Certification
                      </button>
                    </form>

                    <button 
                      type="button" 
                      onclick={() => (showRejectForm = !showRejectForm)}
                      class="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
                      <XCircle size={14} /> Rejeter le dossier
                    </button>
                  {/if}
                </div>
              </div>

              <!-- FORMULAIRE DE REJET AVEC MOTIF -->
              {#if showRejectForm}
                <form method="POST" action="?/rejectKyc" use:enhance class="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
                  <input type="hidden" name="userId" value={activeUser.id} />
                  <label for="reason" class="block text-xs font-bold text-rose-400 uppercase tracking-wider">Motif du rejet (notifié à l'utilisateur)</label>
                  <textarea 
                    id="reason" 
                    name="reason" 
                    rows={2} 
                    required 
                    placeholder="Ex: Photo de la pièce floue, document expiré, portrait non conforme..." 
                    class="w-full bg-slate-950 border border-rose-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                  ></textarea>
                  <div class="flex justify-end gap-2">
                    <button type="button" onclick={() => (showRejectForm = false)} class="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Annuler</button>
                    <button type="submit" class="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl">Confirmer le rejet</button>
                  </div>
                </form>
              {/if}

              <!-- GALERIE DES 3 DOCUMENTS SOUMIS -->
              <div class="grid gap-4 sm:grid-cols-3">
                <!-- 1. PIÈCE D'IDENTITÉ -->
                <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-white">1. Pièce d'identité</span>
                    {#if activeUser.identityCardPhotoUrl}
                      <a href={activeUser.identityCardPhotoUrl} target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline text-xs flex items-center gap-1">
                        Agrandir <ExternalLink size={12} />
                      </a>
                    {/if}
                  </div>
                  {#if activeUser.identityCardPhotoUrl}
                    <div class="h-48 w-full rounded-xl overflow-hidden border border-white/10">
                      <img src={activeUser.identityCardPhotoUrl} alt="Pièce ID" class="h-full w-full object-cover" />
                    </div>
                  {:else}
                    <div class="h-48 w-full rounded-xl bg-white/5 flex items-center justify-center text-xs text-slate-500">Non fournie</div>
                  {/if}
                </div>

                <!-- 2. PORTRAIT -->
                <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-white">2. Portrait / Selfie</span>
                    {#if activeUser.portraitPhotoUrl}
                      <a href={activeUser.portraitPhotoUrl} target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline text-xs flex items-center gap-1">
                        Agrandir <ExternalLink size={12} />
                      </a>
                    {/if}
                  </div>
                  {#if activeUser.portraitPhotoUrl}
                    <div class="h-48 w-full rounded-xl overflow-hidden border border-white/10">
                      <img src={activeUser.portraitPhotoUrl} alt="Portrait" class="h-full w-full object-cover" />
                    </div>
                  {:else}
                    <div class="h-48 w-full rounded-xl bg-white/5 flex items-center justify-center text-xs text-slate-500">Non fournie</div>
                  {/if}
                </div>

                <!-- 3. CARTE EN MAIN -->
                <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-white">3. Carte en main</span>
                    {#if activeUser.cardHoldingPhotoUrl}
                      <a href={activeUser.cardHoldingPhotoUrl} target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline text-xs flex items-center gap-1">
                        Agrandir <ExternalLink size={12} />
                      </a>
                    {/if}
                  </div>
                  {#if activeUser.cardHoldingPhotoUrl}
                    <div class="h-48 w-full rounded-xl overflow-hidden border border-white/10">
                      <img src={activeUser.cardHoldingPhotoUrl} alt="Carte en main" class="h-full w-full object-cover" />
                    </div>
                  {:else}
                    <div class="h-48 w-full rounded-xl bg-white/5 flex items-center justify-center text-xs text-slate-500">Non fournie</div>
                  {/if}
                </div>
              </div>
            </div>

          <!-- 3. ONGLET SÉCURITÉ & RÔLES -->
          {:else if activeTab === 'SECURITY'}
            <div class="max-w-2xl space-y-6">
              <div class="p-6 border border-white/10 rounded-2xl bg-white/2">
                <h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2"><Lock size={16} class="text-emerald-400" /> Rôle et Type de compte</h3>
                
                {#if isAdmin}
                  <form method="POST" action="?/updateAccess" use:enhance class="grid grid-cols-2 gap-4">
                    <input type="hidden" name="userId" value={activeUser.id} />
                    
                    <div class="space-y-1.5">
                      <label for="role" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Niveau d'Accès</label>
                      <select id="role" name="role" class="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400/50">
                        <option value="user" selected={activeUser.role === 'user'}>Utilisateur Standard</option>
                        <option value="employee" selected={activeUser.role === 'employee'}>Employé / Agent</option>
                        <option value="admin" selected={activeUser.role === 'admin'}>Administrateur</option>
                      </select>
                    </div>

                    <div class="space-y-1.5">
                      <label for="type" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Catégorie Client</label>
                      <select id="type" name="type" class="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400/50">
                        <option value="GUEST" selected={activeUser.type === 'GUEST'}>Invité</option>
                        <option value="PROPRIO" selected={activeUser.type === 'PROPRIO'}>Propriétaire</option>
                        <option value="LAWYER" selected={activeUser.type === 'LAWYER'}>Avocat</option>
                        <option value="AGENT" selected={activeUser.type === 'AGENT'}>Agent Immo</option>
                        <option value="EMPLOYEE" selected={activeUser.type === 'EMPLOYEE'}>Employé</option>
                      </select>
                    </div>

                    <div class="col-span-2 pt-2">
                      <button type="submit" class="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors">
                        Mettre à jour les accès
                      </button>
                    </div>
                  </form>
                {:else}
                  <div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-300 text-xs">
                    <AlertTriangle size={16} /> Seul un Administrateur peut modifier ces paramètres.
                  </div>
                {/if}
              </div>

              <!-- BANLISSEMENT -->
              <div class="p-6 border border-rose-500/20 rounded-2xl bg-rose-500/5">
                <h3 class="text-sm font-bold text-rose-400 mb-4 flex items-center gap-2"><ShieldAlert size={16} /> Zone de Gestion des Sanctions</h3>
                
                <form method="POST" action="?/toggleBan" use:enhance class="space-y-4">
                  <input type="hidden" name="userId" value={activeUser.id} />
                  <input type="hidden" name="isCurrentlyBanned" value={activeUser.banned ? 'true' : 'false'} />
                  
                  {#if !activeUser.banned}
                    <div class="space-y-1.5">
                      <label for="banReason" class="block text-xs font-bold text-rose-400 uppercase tracking-wider">Raison du bannissement</label>
                      <input type="text" id="banReason" name="banReason" placeholder="Fraude, faux documents..." required class="w-full bg-slate-950 border border-rose-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500" />
                    </div>
                  {:else}
                    <div class="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30 text-xs text-rose-200">
                      <b>Raison actuelle :</b> {activeUser.banReason || 'Non spécifiée'}
                    </div>
                  {/if}

                  <button type="submit" class="px-6 py-2.5 {activeUser.banned ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'} text-xs font-bold rounded-xl transition-colors flex items-center gap-2">
                    <Ban size={14} /> {activeUser.banned ? 'Révoquer le bannissement' : 'Bannir l’utilisateur'}
                  </button>
                </form>
              </div>
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- TOAST DE SUCCÈS -->
      {#if showSuccessToast}
        <div class="absolute bottom-6 right-6 bg-emerald-400 text-slate-950 px-4 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle size={18} /> {form?.message || 'Opération effectuée avec succès !'}
        </div>
      {/if}

    </Card>
  </div>
{/if}
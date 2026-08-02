<script lang="ts">
  import { enhance } from '$app/forms';
  import Card from '$lib/components/admin/ui/Card.svelte';
  import Badge from '$lib/components/admin/ui/Badge.svelte';
  import { 
    Search, User as UserIcon, Shield, Map, Ban, CheckCircle, 
    Save, Mail, Phone, Fingerprint, Lock, ShieldAlert, AlertTriangle
  } from '@lucide/svelte';
  
  import type { PageData } from './$types';

  // 1. TYPAGE MANUEL DU FORM POUR ÉVITER L'ERREUR 'ActionData'
  interface FormResult {
    success?: boolean;
    message?: string;
    action?: string;
  }

  // 2. TYPAGE EXPLICITE DU CURRENT USER (Corrige l'erreur 'role does not exist')
  interface CurrentUser {
    id: string;
    name: string;
    email: string;
    role: string | null;
    type?: string;
    image?: string | null;
  }

  let { data, form }: { data: PageData; form: FormResult | null } = $props();

  // On cast currentUser pour forcer TypeScript à reconnaître nos champs personnalisés
  let currentUser = $derived(data.currentUser as unknown as CurrentUser | null);

  // --- TYPES STRICTS DES DONNÉES ---
  type UserFilter = 'ALL' | 'PROPRIO' | 'EMPLOYEE' | 'BANNED';
  type TabType = 'PROFILE' | 'SECURITY';

  interface UserData {
    id: string;
    name: string;
    email: string;
    telephone: string | null;
    image: string | null;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    createdAt: Date;
    type: string;
    cardID: string | null;
    typeID: string | null;
    certified: boolean;
    _count: { plots: number; visits: number };
  }

  // --- ÉTATS (Runes) ---
  let activeFilter = $state<UserFilter>('ALL');
  let activeTab = $state<TabType>('PROFILE');
  let searchQuery = $state('');
  let selectedUserId = $state<string | null>(null);

  const FILTERS: UserFilter[] = ['ALL', 'PROPRIO', 'EMPLOYEE', 'BANNED'];

  // --- LOGIQUE DÉRIVÉE ---
  // Cast sécurisé des utilisateurs provenant de la base de données
  let typedUsers = $derived(data.users as unknown as UserData[]);

  let filteredUsers = $derived(
    typedUsers.filter(user => {
      const matchSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
                          
      if (activeFilter === 'PROPRIO') return matchSearch && user.type === 'PROPRIO';
      if (activeFilter === 'EMPLOYEE') return matchSearch && (user.role === 'employee' || user.role === 'admin');
      if (activeFilter === 'BANNED') return matchSearch && user.banned === true;
      return matchSearch;
    })
  );

  let activeUser = $derived(filteredUsers.find(u => u.id === selectedUserId));
  
  // Utilisation sécurisée de currentUser.role
  let isAdmin = $derived(currentUser?.role === 'admin');
  
  // Notification d'état après soumission de formulaire
  let showSuccessToast = $state(false);
  $effect(() => {
    if (form?.success) {
      showSuccessToast = true;
      setTimeout(() => showSuccessToast = false, 3000);
    }
  });
</script>

{#if currentUser}
  <div class="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden relative">
    
    <!-- COLONNE 1 : LISTE DES UTILISATEURS -->
    <Card class="w-87.5 flex flex-col shrink-0 bg-proprios-dark/50">
      <div class="p-4 border-b border-white/5 space-y-4">
        <div>
          <h2 class="text-lg font-bold text-white mb-1">Utilisateurs</h2>
          <p class="text-xs text-slate-400">{filteredUsers.length} comptes trouvés</p>
        </div>

        <div class="relative">
          <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            bind:value={searchQuery}
            type="text" 
            placeholder="Rechercher nom, email..." 
            class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-proprios-mint/50 transition-colors"
          />
        </div>

        <div class="flex gap-1 bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {#each FILTERS as filter (filter)}
            <button 
              type="button"
              onclick={() => activeFilter = filter}
              class="px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap transition-all {activeFilter === filter ? 'bg-proprios-card text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}">
              {filter === 'ALL' ? 'Tous' : filter === 'PROPRIO' ? 'Propriétaires' : filter === 'EMPLOYEE' ? 'Équipe' : 'Bannis'}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        {#each filteredUsers as user (user.id)}
          <button 
            type="button"
            onclick={() => { selectedUserId = user.id; activeTab = 'PROFILE'; }}
            class="w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 group {selectedUserId === user.id ? 'bg-proprios-mint/10 border border-proprios-mint/20' : 'hover:bg-white/5 border border-transparent'}">
            
            <div class="relative">
              <img src={user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} class="w-10 h-10 rounded-full border border-white/10" />
              {#if user.banned}
                <span class="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 border-2 border-proprios-dark rounded-full"></span>
              {:else if user.role === 'admin' || user.role === 'employee'}
                <span class="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-proprios-dark rounded-full"></span>
              {/if}
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-0.5">
                <span class="text-sm font-medium text-white truncate {user.banned ? 'line-through opacity-50' : ''}">{user.name}</span>
              </div>
              <p class="text-xs text-slate-400 truncate flex items-center gap-1">
                {user.type} • {user._count.plots} Parcelles
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

    <!-- COLONNE 2 : DÉTAILS & ÉDITION -->
    <Card class="flex-1 flex flex-col min-w-0 bg-proprios-card relative overflow-hidden">
      {#if !activeUser}
        <div class="flex-1 flex flex-col items-center justify-center text-slate-500">
          <UserIcon size={64} class="mb-4 opacity-20" />
          <h3 class="text-lg font-medium text-white mb-2">Gestion des Utilisateurs</h3>
          <p class="text-sm">Sélectionnez un compte pour voir et modifier ses informations.</p>
        </div>
      {:else}
        
        <div class="p-6 border-b border-white/5 flex items-start justify-between bg-linear-to-r from-proprios-dark/50 to-transparent">
          <div class="flex items-center gap-5">
            <div class="relative">
              <img src={activeUser.image || `https://api.dicebear.com/7.x/initials/svg?seed=${activeUser.name}`} alt={activeUser.name} class="w-20 h-20 rounded-2xl border border-white/10 shadow-lg object-cover" />
              {#if activeUser.certified}
                <div class="absolute -bottom-2 -right-2 bg-proprios-dark rounded-full p-1"><div class="bg-proprios-mint text-proprios-dark rounded-full p-0.5"><CheckCircle size={16} /></div></div>
              {/if}
            </div>
            
            <div>
              <h2 class="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                {activeUser.name}
                {#if activeUser.banned}
                  <Badge variant="danger">Banni</Badge>
                {/if}
              </h2>
              <div class="flex items-center gap-3 text-sm text-slate-400">
                <span class="flex items-center gap-1"><Mail size={14}/> {activeUser.email}</span>
                <span>•</span>
                <span class="flex items-center gap-1"><Map size={14}/> {activeUser._count.plots} parcelles</span>
              </div>
            </div>
          </div>
          
          <div class="flex gap-2">
            {#if !activeUser.certified}
              <form method="POST" action="?/verifyIdentity" use:enhance>
                <input type="hidden" name="userId" value={activeUser.id} />
                <button type="submit" class="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors border border-white/10 flex items-center gap-2">
                  <Shield size={14} /> Vérifier Identité
                </button>
              </form>
            {/if}
          </div>
        </div>

        <div class="flex px-6 border-b border-white/5">
          {#each [{id: 'PROFILE', label: 'Profil Général'}, {id: 'SECURITY', label: 'Sécurité & Accès'}] as tab (tab.id)}
            <button 
              type="button"
              onclick={() => activeTab = tab.id as TabType}
              class="px-4 py-4 text-sm font-medium border-b-2 transition-colors {activeTab === tab.id ? 'border-proprios-mint text-proprios-mint' : 'border-transparent text-slate-400 hover:text-white'}">
              {tab.label}
            </button>
          {/each}
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          {#if activeTab === 'PROFILE'}
            <form method="POST" action="?/updateProfile" use:enhance class="max-w-2xl space-y-6">
              <input type="hidden" name="userId" value={activeUser.id} />
              
              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label for="name" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Nom Complet</label>
                  <input type="text" id="name" name="name" value={activeUser.name} required class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-proprios-mint/50" />
                </div>
                
                <div class="space-y-2">
                  <label for="email" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                  <input type="email" id="email" name="email" value={activeUser.email} required class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-proprios-mint/50" />
                </div>

                <div class="space-y-2">
                  <label for="telephone" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Téléphone</label>
                  <div class="relative">
                    <Phone size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" id="telephone" name="telephone" value={activeUser.telephone || ''} placeholder="+243..." class="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-9 text-sm text-white focus:outline-none focus:border-proprios-mint/50" />
                  </div>
                </div>

                <div class="space-y-2">
                  <label for="typeID" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Type de Pièce</label>
                  <select id="typeID" name="typeID" class="w-full bg-proprios-dark border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-proprios-mint/50">
                    <option value="" selected={!activeUser.typeID}>Non spécifié</option>
                    <option value="NATIONAL" selected={activeUser.typeID === 'NATIONAL'}>Carte Nationale</option>
                    <option value="PASSPORT" selected={activeUser.typeID === 'PASSPORT'}>Passeport</option>
                    <option value="DRIVING" selected={activeUser.typeID === 'DRIVING'}>Permis de Conduire</option>
                  </select>
                </div>

                <div class="col-span-2 space-y-2">
                  <label for="cardID" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Numéro de la Pièce (ID)</label>
                  <div class="relative">
                    <Fingerprint size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" id="cardID" name="cardID" value={activeUser.cardID || ''} placeholder="Ex: 0123456789" class="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-9 text-sm text-white focus:outline-none focus:border-proprios-mint/50" />
                  </div>
                </div>
              </div>

              <div class="pt-4 flex justify-end">
                <button type="submit" class="px-6 py-2.5 bg-proprios-mint hover:bg-proprios-mint-hover text-proprios-dark font-bold rounded-xl transition-colors flex items-center gap-2">
                  <Save size={18} /> Sauvegarder Profil
                </button>
              </div>
            </form>
            
          {:else if activeTab === 'SECURITY'}
            <div class="max-w-2xl space-y-8">
              
              <div class="p-6 border border-white/10 rounded-2xl bg-white/2">
                <h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2"><Lock size={18} class="text-proprios-mint" /> Rôle et Type de compte</h3>
                
                {#if isAdmin}
                  <form method="POST" action="?/updateAccess" use:enhance class="grid grid-cols-2 gap-6">
                    <input type="hidden" name="userId" value={activeUser.id} />
                    
                    <div class="space-y-2">
                      <label for="role" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Niveau d'Accès</label>
                      <select id="role" name="role" class="w-full bg-proprios-dark border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-proprios-mint/50">
                        <option value="user" selected={activeUser.role === 'user'}>Utilisateur Standard</option>
                        <option value="employee" selected={activeUser.role === 'employee'}>Employé / Agent</option>
                        <option value="admin" selected={activeUser.role === 'admin'}>Administrateur</option>
                      </select>
                    </div>

                    <div class="space-y-2">
                      <label for="type" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Catégorie Client</label>
                      <select id="type" name="type" class="w-full bg-proprios-dark border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-proprios-mint/50">
                        <option value="GUEST" selected={activeUser.type === 'GUEST'}>Invité</option>
                        <option value="PROPRIO" selected={activeUser.type === 'PROPRIO'}>Propriétaire</option>
                        <option value="LAWYER" selected={activeUser.type === 'LAWYER'}>Avocat</option>
                        <option value="AGENT" selected={activeUser.type === 'AGENT'}>Agent Immo</option>
                        <option value="EMPLOYEE" selected={activeUser.type === 'EMPLOYEE'}>Employé</option>
                      </select>
                    </div>

                    <div class="col-span-2 pt-2">
                      <button type="submit" class="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors">
                        Mettre à jour les accès
                      </button>
                    </div>
                  </form>
                {:else}
                  <div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-500/80 text-sm">
                    <AlertTriangle size={18} /> Seul un Administrateur peut modifier ces paramètres.
                  </div>
                {/if}
              </div>

              <!-- ZONE DE BANNISSEMENT -->
              <div class="p-6 border border-red-500/20 rounded-2xl bg-red-500/5">
                <h3 class="text-sm font-bold text-red-500 mb-4 flex items-center gap-2"><ShieldAlert size={18} /> Zone de Danger</h3>
                
                <form method="POST" action="?/toggleBan" use:enhance class="space-y-4">
                  <input type="hidden" name="userId" value={activeUser.id} />
                  <input type="hidden" name="isCurrentlyBanned" value={activeUser.banned ? 'true' : 'false'} />
                  
                  {#if !activeUser.banned}
                    <div class="space-y-2">
                      <label for="banReason" class="block text-xs font-bold text-red-400 uppercase tracking-wider">Raison du bannissement</label>
                      <input type="text" id="banReason" name="banReason" placeholder="Fraude, violation..." required class="w-full bg-proprios-dark border border-red-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500" />
                    </div>
                  {:else}
                    <div class="p-4 bg-red-500/20 rounded-xl border border-red-500/30 text-sm text-white">
                      <span class="font-bold text-red-400">Raison actuelle :</span> {activeUser.banReason || 'Non spécifiée'}
                    </div>
                  {/if}

                  <button type="submit" class="px-6 py-2.5 {activeUser.banned ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} text-sm font-bold rounded-xl transition-colors flex items-center gap-2">
                    <Ban size={16} /> {activeUser.banned ? 'Révoquer le bannissement' : 'Bannir l\'utilisateur'}
                  </button>
                </form>
              </div>

            </div>
          {/if}
        </div>
      {/if}
      
      {#if showSuccessToast}
        <div class="absolute bottom-6 right-6 bg-proprios-mint text-proprios-dark px-4 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle size={18} /> Modifications enregistrées !
        </div>
      {/if}

    </Card>
  </div>
{/if}
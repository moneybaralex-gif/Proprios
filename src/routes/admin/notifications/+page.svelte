<script lang="ts">
  import { enhance } from '$app/forms';
  import Card from '$lib/components/admin/ui/Card.svelte';
  import Badge from '$lib/components/admin/ui/Badge.svelte';
  import { 
    Search, BellRing, Users, User, Send, CheckCircle, 
    AlertCircle, MessageSquareText, RadioTower, Globe
  } from '@lucide/svelte';
  
  import type { PageData } from './$types';

  // --- INTERFACES STRICTES ---
  interface FormResult { success?: boolean; message?: string; }
  
  interface UserMin { id: string; name: string; email: string; type: string; image?: string | null; }
  
  interface NotificationData {
    id: string;
    title: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
    user: UserMin;
  }

  let { data, form }: { data: PageData; form: FormResult | null } = $props();

  // --- ÉTATS (Runes) ---
  let targetType = $state<'ALL' | 'SPECIFIC'>('ALL');
  let selectedUserId = $state<string>('');
  let titleInput = $state('');
  let contentInput = $state('');
  let searchHistory = $state('');
  
  // UI States
  let isSending = $state(false);
  let showSuccessToast = $state(false);
  let toastMsg = $state('');

  // --- LOGIQUE DÉRIVÉE ---
  let history = $derived(data.recentNotifications as unknown as NotificationData[]);
  let usersList = $derived(data.usersList as unknown as UserMin[]);
  
  let filteredHistory = $derived(
    history.filter(notif => 
      notif.title.toLowerCase().includes(searchHistory.toLowerCase()) ||
      notif.user.name.toLowerCase().includes(searchHistory.toLowerCase())
    )
  );

  let isFormValid = $derived(
    titleInput.trim().length > 0 && 
    contentInput.trim().length > 0 && 
    (targetType === 'ALL' || (targetType === 'SPECIFIC' && selectedUserId !== ''))
  );

  // --- EFFETS ---
  $effect(() => {
    if (form) {
      isSending = false;
      if (form.success) {
        showSuccessToast = true;
        toastMsg = form.message || 'Envoyé';
        // Reset form
        titleInput = '';
        contentInput = '';
        selectedUserId = '';
        
        setTimeout(() => showSuccessToast = false, 4000);
      }
    }
  });
</script>

{#if data.currentUser}
  <div class="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden relative">
    
    <!-- ========================================== -->
    <!-- COLONNE GAUCHE : HISTORIQUE (380px)        -->
    <!-- ========================================== -->
    <Card class="w-95 flex flex-col shrink-0 bg-proprios-dark/50 border-r border-white/5">
      <div class="p-5 border-b border-white/5 space-y-4 bg-linear-to-b from-white/2 to-transparent">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-bold text-white mb-0.5">Historique</h2>
            <p class="text-xs text-slate-400">Derniers envois récents</p>
          </div>
          <div class="w-10 h-10 bg-white/5 text-slate-400 rounded-xl flex items-center justify-center border border-white/10">
            <RadioTower size={20} />
          </div>
        </div>

        <div class="relative">
          <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            bind:value={searchHistory}
            type="text" 
            placeholder="Rechercher (Titre, Utilisateur)..." 
            class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-proprios-mint/50 transition-colors"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        {#each filteredHistory as notif (notif.id)}
          <div class="p-4 bg-white/2 border border-white/5 rounded-2xl flex flex-col gap-2 hover:bg-white/4 transition-colors">
            
            <div class="flex justify-between items-start">
              <h3 class="text-sm font-bold text-white line-clamp-1 flex-1 pr-2">{notif.title}</h3>
              <span class="text-[10px] text-slate-500 shrink-0 mt-0.5">
                {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
            
            <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">{notif.content}</p>
            
            <div class="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
              <div class="flex items-center gap-2">
                <img src={notif.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${notif.user.name}`} alt="Destinataire" class="w-5 h-5 rounded-full border border-white/10" />
                <span class="text-[10px] font-medium text-slate-300 truncate max-w-37.5">{notif.user.name}</span>
              </div>
              
              {#if notif.isRead}
                <span class="text-[9px] text-proprios-mint flex items-center gap-1 font-bold uppercase tracking-wider"><CheckCircle size={10} /> Lue</span>
              {:else}
                <span class="text-[9px] text-slate-500 flex items-center gap-1 font-bold uppercase tracking-wider">Non lue</span>
              {/if}
            </div>
          </div>
        {/each}
        
        {#if filteredHistory.length === 0}
          <div class="pt-10 text-center flex flex-col items-center text-slate-500 text-sm gap-2">
            <MessageSquareText size={32} class="opacity-30" />
            <p>Aucune notification trouvée.</p>
          </div>
        {/if}
      </div>
    </Card>

    <!-- ========================================== -->
    <!-- COLONNE DROITE : CENTRE DE DIFFUSION       -->
    <!-- ========================================== -->
    <Card class="flex-1 flex flex-col min-w-0 bg-proprios-card relative overflow-hidden shadow-2xl">
      
      <!-- HEADER -->
      <div class="p-8 border-b border-white/5 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-proprios-mint/10 via-proprios-card to-proprios-dark">
        <div class="max-w-3xl mx-auto">
          <div class="flex items-center gap-4 mb-2">
            <div class="w-12 h-12 bg-proprios-mint text-proprios-dark rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(2,225,177,0.3)]">
              <BellRing size={24} />
            </div>
            <div>
              <h1 class="text-2xl font-black text-white tracking-tight">Centre de Diffusion</h1>
              <p class="text-sm text-slate-400">Envoyez des alertes push et in-app instantanées.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- COMPOSER -->
      <div class="flex-1 overflow-y-auto p-8">
        <div class="max-w-3xl mx-auto">
          
          <form 
            method="POST" 
            action="?/sendNotification" 
            use:enhance={() => {
              isSending = true;
              return async ({ update }) => {
                await update({ reset: false }); // On gère le reset manuellement dans l'effet
              };
            }} 
            class="space-y-8"
          >
            
            <!-- ÉTAPE 1 : CHOIX DE LA CIBLE (Bento Style) -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">1. Audience Cible</h3>
              
              <div class="grid grid-cols-2 gap-4">
                <!-- Option : TOUS -->
                <label class="relative cursor-pointer">
                  <input type="radio" name="targetType" value="ALL" bind:group={targetType} class="peer sr-only" />
                  <div class="p-5 rounded-2xl border-2 transition-all {targetType === 'ALL' ? 'bg-proprios-mint/5 border-proprios-mint shadow-[0_0_15px_rgba(2,225,177,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}">
                    <div class="flex justify-between items-start mb-2">
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center {targetType === 'ALL' ? 'bg-proprios-mint text-proprios-dark' : 'bg-white/10 text-slate-400'}">
                        <Globe size={20} />
                      </div>
                      <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center {targetType === 'ALL' ? 'border-proprios-mint' : 'border-slate-600'}">
                        {#if targetType === 'ALL'}<div class="w-2.5 h-2.5 bg-proprios-mint rounded-full"></div>{/if}
                      </div>
                    </div>
                    <h4 class="text-white font-bold mb-1">Diffusion Générale</h4>
                    <p class="text-xs text-slate-400">Envoyer à la totalité des utilisateurs.</p>
                    <div class="mt-3">
                      <Badge variant="success">
                        <span class="inline-flex items-center gap-1">
                          <Users size={10} /> {data.totalUsers} Utilisateurs
                        </span>
                      </Badge>
                    </div>
                  </div>
                </label>

                <!-- Option : SPÉCIFIQUE -->
                <label class="relative cursor-pointer">
                  <input type="radio" name="targetType" value="SPECIFIC" bind:group={targetType} class="peer sr-only" />
                  <div class="p-5 rounded-2xl border-2 transition-all {targetType === 'SPECIFIC' ? 'bg-blue-500/5 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}">
                    <div class="flex justify-between items-start mb-2">
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center {targetType === 'SPECIFIC' ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'}">
                        <User size={20} />
                      </div>
                      <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center {targetType === 'SPECIFIC' ? 'border-blue-500' : 'border-slate-600'}">
                        {#if targetType === 'SPECIFIC'}<div class="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>{/if}
                      </div>
                    </div>
                    <h4 class="text-white font-bold mb-1">Envoi Ciblé</h4>
                    <p class="text-xs text-slate-400">Sélectionner un utilisateur précis.</p>
                  </div>
                </label>
              </div>

              <!-- Menu déroulant (S'affiche uniquement si SPECIFIC) -->
              {#if targetType === 'SPECIFIC'}
                <div class="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl animate-in slide-in-from-top-2 fade-in duration-200">
                  <label for="userId" class="block text-xs font-bold text-slate-400 mb-2">Sélectionnez le destinataire</label>
                  <div class="relative">
                    <select 
                      id="userId" 
                      name="userId" 
                      bind:value={selectedUserId}
                      class="w-full bg-proprios-dark border border-white/20 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                    >
                      <option value="" disabled selected>-- Choisir un client ou employé --</option>
                      {#each usersList as user (user.id)}
                        <option value={user.id}>{user.name} ({user.type}) - {user.email}</option>
                      {/each}
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
              {/if}
            </div>

            <hr class="border-white/5" />

            <!-- ÉTAPE 2 : CONTENU DU MESSAGE -->
            <div class="space-y-4">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">2. Contenu du Message</h3>
              
              <div class="space-y-4">
                <!-- Titre -->
                <div>
                  <label for="title" class="block text-xs font-bold text-slate-400 mb-2">Titre de la notification <span class="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    id="title" 
                    name="title" 
                    bind:value={titleInput}
                    placeholder="Ex: Votre parcelle a été certifiée !" 
                    maxlength={100}
                    required
                    class="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white font-medium focus:outline-none focus:border-proprios-mint/50 transition-colors placeholder-slate-600"
                  />
                </div>

                <!-- Message (Textarea) -->
                <div>
                  <div class="flex justify-between items-end mb-2">
                    <label for="content" class="block text-xs font-bold text-slate-400">Message détaillé <span class="text-red-500">*</span></label>
                    <span class="text-[10px] text-slate-500">{contentInput.length}/500</span>
                  </div>
                  <textarea 
                    id="content" 
                    name="content" 
                    bind:value={contentInput}
                    placeholder="Saisissez le corps de la notification..." 
                    rows={4}
                    maxlength={500}
                    required
                    class="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-proprios-mint/50 transition-colors resize-none placeholder-slate-600"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- BOUTON DE SOUMISSION -->
            <div class="pt-6">
              {#if form?.message && !form?.success}
                <div class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {form.message}
                </div>
              {/if}

              <button 
                type="submit" 
                disabled={!isFormValid || isSending}
                class="w-full py-4 text-proprios-dark font-black rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed
                  {targetType === 'ALL' ? 'bg-proprios-mint hover:bg-proprios-mint-hover shadow-[0_0_20px_rgba(2,225,177,0.2)]' : 'bg-blue-500 hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.2)] text-white'}"
              >
                {#if isSending}
                  <div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ENVOI EN COURS...
                {:else}
                  <Send size={20} />
                  {targetType === 'ALL' ? 'DIFFUSER À TOUT LE MONDE' : 'ENVOYER LA NOTIFICATION CIBLÉE'}
                {/if}
              </button>
              
              {#if targetType === 'ALL'}
                <p class="text-center text-[10px] text-amber-500/80 font-bold uppercase tracking-wider mt-3">
                  <AlertCircle size={10} class="inline mr-1 mb-0.5" /> Attention : Cette action notifiera simultanément {data.totalUsers} comptes.
                </p>
              {/if}
            </div>

          </form>
        </div>
      </div>

      <!-- TOAST DE SUCCÈS -->
      {#if showSuccessToast}
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 bg-proprios-card border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in duration-300 z-50">
          <CheckCircle size={20} class="text-proprios-mint" /> {toastMsg}
        </div>
      {/if}
    </Card>
  </div>
{/if}
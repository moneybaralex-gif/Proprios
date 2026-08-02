<script lang="ts">
  import { enhance } from '$app/forms';
  import Card from '$lib/components/admin/ui/Card.svelte';

  import { 
    User, Lock, ShieldCheck, Key, Laptop, Smartphone, CheckCircle, 
    AlertTriangle, Globe, Sliders, Mail, Trash2, Save,
  } from '@lucide/svelte';
  
  import type { PageData } from './$types';

  // --- INTERFACES STRICTES ---
  interface FormResult {
    success?: boolean;
    message?: string;
  }

  type TabType = 'PROFILE' | 'SECURITY' | 'SESSIONS' | 'PREFERENCES';

  interface SessionItem {
    id: string;
    token: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface UserProfileData {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    telephone: string | null;
    image: string | null;
    role: string | null;
    type: string;
    pin: number | null;
    certified: boolean;
    sessions: SessionItem[];
    accounts: { providerId: string; createdAt: Date }[];
  }

  let { data, form }: { data: PageData; form: FormResult | null } = $props();

  // --- ÉTATS (Runes) ---
  let activeTab = $state<TabType>('PROFILE');
  
  // Formulaires locaux
  let nameInput = $state('');
  let telephoneInput = $state('');
  let imageInput = $state('');
  
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let pinInput = $state('');

  // UI States
  let showSuccessToast = $state(false);
  let toastMsg = $state('');

  // --- LOGIQUE DÉRIVÉE ---
  let user = $derived(data.userProfile as unknown as UserProfileData);
  let isAdmin = $derived(user?.role === 'admin');

  // Synchronisation des valeurs du profil
  $effect(() => {
    if (user) {
      nameInput = user.name || '';
      telephoneInput = user.telephone || '';
      imageInput = user.image || '';
      pinInput = user.pin ? user.pin.toString() : '';
    }
  });

  // Validation mot de passe
  let isPasswordValid = $derived(
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword
  );

  // Helper pour parser le UserAgent
  const parseDevice = (userAgent: string | null) => {
    if (!userAgent) return { name: 'Appareil inconnu', icon: Laptop };
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return { name: 'Smartphone / Mobile', icon: Smartphone };
    }
    return { name: 'Ordinateur / Desktop', icon: Laptop };
  };

  // Gestion des retours formulaires
  $effect(() => {
    if (form) {
      if (form.success) {
        showSuccessToast = true;
        toastMsg = form.message || 'Modifications enregistrées !';
        // Vider les champs sensibles
        currentPassword = '';
        newPassword = '';
        confirmPassword = '';
        setTimeout(() => showSuccessToast = false, 4000);
      }
    }
  });
</script>

{#if data.user}
  <div class="h-[calc(100vh-8rem)] flex flex-col gap-6 overflow-hidden relative">
    
    <!-- HEADER WORKSPACE -->
    <div class="flex items-center justify-between bg-proprios-card p-6 rounded-3xl border border-white/5 shadow-xl shrink-0">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-proprios-mint text-proprios-dark rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(2,225,177,0.3)]">
          <Sliders size={24} />
        </div>
        <div>
          <h1 class="text-2xl font-black text-white tracking-tight">Paramètres du Compte</h1>
          <p class="text-xs text-slate-400">Gérez vos informations Better Auth, la sécurité et vos préférences.</p>
        </div>
      </div>

      <!-- ONGLETS NAVIGATION -->
      <div class="flex bg-white/5 p-1 rounded-2xl border border-white/10">
        {#each [
          { id: 'PROFILE', label: 'Mon Profil', icon: User },
          { id: 'SECURITY', label: 'Sécurité & Auth', icon: Lock },
          { id: 'SESSIONS', label: 'Appareils (' + user.sessions.length + ')', icon: Laptop },
          { id: 'PREFERENCES', label: 'Préférences', icon: Globe }
        ] as tab (tab.id)}
          {@const Icon = tab.icon}
          <button 
            type="button"
            onclick={() => activeTab = tab.id as TabType}
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 {activeTab === tab.id ? 'bg-proprios-mint text-proprios-dark shadow-md' : 'text-slate-400 hover:text-white'}">
            <Icon size={14} /> {tab.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- CONTENU PRINCIPAL (Scrollable) -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <div class="max-w-4xl mx-auto py-2">
        
        <!-- ================= ========================== -->
        <!-- TAB 1 : MON PROFIL                           -->
        <!-- ============================================ -->
        {#if activeTab === 'PROFILE'}
          <div class="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            <!-- Carte Alerte Vérification Email -->
            {#if !user.emailVerified}
              <Card class="p-5 bg-amber-500/10 border-amber-500/20 flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-white">Adresse email non vérifiée</h3>
                    <p class="text-xs text-slate-400 mt-0.5">Vérifiez votre adresse Gmail ({user.email}) pour sécuriser votre compte.</p>
                  </div>
                </div>

                <form method="POST" action="?/sendVerificationEmail" use:enhance>
                  <button type="submit" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-proprios-dark font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5">
                    <Mail size={14} /> Renvoyer l'email
                  </button>
                </form>
              </Card>
            {/if}

            <Card class="p-8">
              <form method="POST" action="?/updateProfile" use:enhance class="space-y-6">
                
                <div class="flex items-center gap-6 pb-6 border-b border-white/5">
                  <img src={imageInput || `https://api.dicebear.com/7.x/initials/svg?seed=${nameInput}`} alt="Avatar" class="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-lg" />
                  <div class="flex-1 space-y-2">
                    <label for="image" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">URL de la Photo de Profil</label>
                    <input type="text" id="image" name="image" bind:value={imageInput} placeholder="https://..." class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-proprios-mint/50" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label for="name" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Nom Complet</label>
                    <input type="text" id="name" name="name" bind:value={nameInput} required class="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-proprios-mint/50" />
                  </div>

                  <div class="space-y-2">
                    <label for="email" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Email (Better Auth)</label>
                    <div class="relative">
                      <input type="email" id="email" value={user.email} disabled class="w-full bg-white/2 border border-white/5 rounded-xl p-3.5 text-sm text-slate-500 cursor-not-allowed" />
                      {#if user.emailVerified}
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-proprios-mint text-xs font-bold flex items-center gap-1"><CheckCircle size={14} /> Vérifié</span>
                      {/if}
                    </div>
                  </div>

                  <div class="space-y-2">
                    <label for="telephone" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Numéro de Téléphone</label>
                    <input type="text" id="telephone" name="telephone" bind:value={telephoneInput} placeholder="+243..." class="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-proprios-mint/50" />
                  </div>

                  <div class="space-y-2">
                    <label for="role" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Rôle système</label>
                    <input type="text" id="role" value={user.role || 'user'} disabled class="w-full bg-white/2 border border-white/5 rounded-xl p-3.5 text-sm text-slate-500 capitalize cursor-not-allowed" />
                  </div>
                </div>

                <div class="pt-4 flex justify-end">
                  <button type="submit" class="px-6 py-3 bg-proprios-mint hover:bg-proprios-mint-hover text-proprios-dark font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(2,225,177,0.2)] flex items-center gap-2">
                    <Save size={18} /> Sauvegarder le profil
                  </button>
                </div>
              </form>
            </Card>
          </div>

        <!-- ============================================ -->
        <!-- TAB 2 : SÉCURITÉ & AUTH (Better Auth)        -->
        <!-- ============================================ -->
        {:else if activeTab === 'SECURITY'}
          <div class="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            <!-- Formulaire Changer de Mot de Passe -->
            <Card class="p-8">
              <h3 class="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                <Lock size={18} class="text-proprios-mint" /> Modifier le Mot de Passe
              </h3>

              <form method="POST" action="?/changePassword" use:enhance class="space-y-5 max-w-xl">
                <div class="space-y-2">
                  <label for="currentPassword" class="block text-xs font-bold text-slate-400 uppercase">Mot de passe actuel</label>
                  <input type="password" id="currentPassword" name="currentPassword" bind:value={currentPassword} required class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-proprios-mint/50" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label for="newPassword" class="block text-xs font-bold text-slate-400 uppercase">Nouveau mot de passe</label>
                    <input type="password" id="newPassword" name="newPassword" bind:value={newPassword} required minlength={8} class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-proprios-mint/50" />
                  </div>

                  <div class="space-y-2">
                    <label for="confirmPassword" class="block text-xs font-bold text-slate-400 uppercase">Confirmer</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" bind:value={confirmPassword} required minlength={8} class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-proprios-mint/50" />
                  </div>
                </div>

                <div class="pt-2">
                  <button type="submit" disabled={!isPasswordValid} class="px-6 py-2.5 bg-proprios-mint hover:bg-proprios-mint-hover text-proprios-dark font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                    Mettre à jour le mot de passe
                  </button>
                </div>
              </form>
            </Card>

            <!-- Code PIN Sécurité -->
            <Card class="p-8">
              <h3 class="text-sm font-bold text-white mb-2 flex items-center gap-2 uppercase tracking-wider">
                <Key size={18} class="text-proprios-mint" /> Code PIN d'Approbation (4 chiffres)
              </h3>
              <p class="text-xs text-slate-400 mb-6">Utilisé pour la validation rapide des descentes et la signature électronique.</p>

              <form method="POST" action="?/updatePin" use:enhance class="flex items-center gap-4 max-w-md">
                <input type="password" name="pin" bind:value={pinInput} placeholder="1234" maxlength={4} pattern="\d{4}" required class="w-32 bg-white/5 border border-white/10 rounded-xl p-3 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-proprios-mint/50" />
                <button type="submit" class="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors">
                  Enregistrer PIN
                </button>
              </form>
            </Card>
          </div>

        <!-- ============================================ -->
        <!-- TAB 3 : APPAREILS & SESSIONS (Better Auth)   -->
        <!-- ============================================ -->
        {:else if activeTab === 'SESSIONS'}
          <div class="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <Card class="p-8">
              <div class="flex justify-between items-center mb-6">
                <div>
                  <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Laptop size={18} class="text-proprios-mint" /> Appareils Connectés ({user.sessions.length})
                  </h3>
                  <p class="text-xs text-slate-400 mt-1">Liste des sessions actives gérées par Better Auth.</p>
                </div>
              </div>

              <div class="space-y-3">
                {#each user.sessions as sess (sess.id)}
                  {@const device = parseDevice(sess.userAgent)}
                  {@const DeviceIcon = device.icon}
                  
                  <div class="p-4 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/4 transition-colors">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 bg-white/5 text-proprios-mint rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                        <DeviceIcon size={22} />
                      </div>
                      <div>
                        <p class="text-sm font-bold text-white">{device.name}</p>
                        <p class="text-xs text-slate-400 mt-0.5 font-mono">
                          IP: {sess.ipAddress || 'Masquée'} • Actif le {new Date(sess.updatedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <form method="POST" action="?/revokeSession" use:enhance>
                      <input type="hidden" name="sessionId" value={sess.id} />
                      <button type="submit" class="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors border border-red-500/20 flex items-center gap-1.5">
                        <Trash2 size={14} /> Déconnecter
                      </button>
                    </form>
                  </div>
                {/each}
              </div>
            </Card>
          </div>

        <!-- ============================================ -->
        <!-- TAB 4 : PRÉFÉRENCES ÉCOSYSTÈME (RDC)         -->
        <!-- ============================================ -->
        {:else if activeTab === 'PREFERENCES'}
          <div class="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <Card class="p-8 space-y-6">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe size={18} class="text-proprios-mint" /> Régionalisation & Devise
              </h3>

              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label for="currency" class="block text-xs font-bold text-slate-400 uppercase">Devise Principale</label>
                  <select id="currency" class="w-full bg-proprios-dark border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-proprios-mint/50">
                    <option value="USD" selected>Dollar Américain ($ USD)</option>
                    <option value="CDF">Franc Congolais (FC CDF)</option>
                  </select>
                </div>

                <div class="space-y-2">
                  <label for="province" class="block text-xs font-bold text-slate-400 uppercase">Province Défaut</label>
                  <select id="province" class="w-full bg-proprios-dark border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-proprios-mint/50">
                    <option value="KINSHASA" selected>Kinshasa</option>
                    <option value="SUD-KIVU" selected>Sud-Kivu</option>
                    <option value="NORD_KIVU">Nord-Kivu (Goma)</option>
                    <option value="HAUT_KATANGA">Haut-Katanga (Lubumbashi)</option>
                    <option value="KONGO_CENTRAL">Kongo Central (Matadi)</option>
                  </select>
                </div>
              </div>
            </Card>

            {#if isAdmin}
              <Card class="p-8 space-y-6 bg-linear-to-br from-proprios-card to-proprios-dark border-proprios-mint/20">
                <h3 class="text-sm font-bold text-proprios-mint uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={18} /> Configuration Plateforme (Admin)
                </h3>

                <div class="grid grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label for="commission" class="block text-xs font-bold text-slate-400 uppercase">Taux de Commission Vente (%)</label>
                    <input type="number" id="commission" value="5" class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white" />
                  </div>

                  <div class="space-y-2">
                    <label for="fee" class="block text-xs font-bold text-slate-400 uppercase">Frais Fiscaux Descente ($)</label>
                    <input type="number" id="fee" value="50" class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white" />
                  </div>
                </div>
              </Card>
            {/if}
          </div>
        {/if}

      </div>
    </div>

    <!-- TOAST DE CONFIRMATION -->
    {#if showSuccessToast}
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 bg-proprios-mint text-proprios-dark px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(2,225,177,0.4)] font-bold flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in duration-300 z-50 border border-white/20">
        <CheckCircle size={20} /> {toastMsg}
      </div>
    {/if}

  </div>
{/if}
<script lang="ts">
  import { enhance } from '$app/forms';
  import Card from '$lib/components/admin/ui/Card.svelte';
  import Badge from '$lib/components/admin/ui/Badge.svelte';
  import { 
    Mail, Users, Send, Eye, Edit3, CheckCircle, 
    Sparkles, AlertCircle, ShieldCheck, FileText, Layout, UserCheck, Scale, Building2
  } from '@lucide/svelte';
  
  import type { PageData } from './$types';

  // --- INTERFACES STRICTES ---
  interface FormResult {
    success?: boolean;
    message?: string;
    recipientCount?: number;
  }

  type SegmentType = 'ALL' | 'PROPRIO' | 'LAWYER' | 'AGENT' | 'CERTIFIED';
  type ViewMode = 'EDITOR' | 'PREVIEW';

  interface SegmentConfig {
    id: SegmentType;
    title: string;
    description: string;
    icon: typeof Users;
    color: string;
  }

  let { data, form }: { data: PageData; form: FormResult | null } = $props();

  // --- ÉTATS (Runes) ---
  let selectedSegment = $state<SegmentType>('ALL');
  let viewMode = $state<ViewMode>('EDITOR');
  
  // Champs Formulaire
  let subjectInput = $state('');
  let preheaderInput = $state('');
  let bodyInput = $state('');
  
  // UI States
  let isSending = $state(false);
  let showSuccessToast = $state(false);
  let toastMessage = $state('');

  // Configuration des segments cibles
  const SEGMENTS: SegmentConfig[] = [
    { id: 'ALL', title: 'Toute la communauté', description: 'Envoi global à tous les inscrits', icon: Users, color: 'text-proprios-mint' },
    { id: 'PROPRIO', title: 'Propriétaires', description: 'Uniquement les détenteurs de biens', icon: Building2, color: 'text-purple-400' },
    { id: 'LAWYER', title: 'Avocats & Notaires', description: 'Corps juridique partenaire', icon: Scale, color: 'text-blue-400' },
    { id: 'AGENT', title: 'Agents Immobiliers', description: 'Agents de terrain', icon: UserCheck, color: 'text-amber-400' },
    { id: 'CERTIFIED', title: 'Comptes Certifiés', description: 'Utilisateurs avec KYC validé', icon: ShieldCheck, color: 'text-emerald-400' }
  ];

  // --- LOGIQUE DÉRIVÉE ---
  let currentUser = $derived(data.user);
  let counts = $derived(data.counts);

  let currentAudienceCount = $derived(counts[selectedSegment] || 0);

  let isFormValid = $derived(
    subjectInput.trim().length > 0 &&
    bodyInput.trim().length > 0 &&
    currentAudienceCount > 0
  );

  // Injection de Modèles de Mail Rapides
  const applyTemplate = (templateType: 'SECURITY' | 'UPDATE' | 'PROMO') => {
    if (templateType === 'SECURITY') {
      subjectInput = "🔒 Rappel Sécurité : Protégez vos titres de propriété";
      preheaderInput = "Consignes importantes pour la sécurisation de vos parcelles.";
      bodyInput = `Bonjour {{nom}},\n\nDans le cadre de la protection de vos biens fonciers en RDC, nous vous rappelons qu'aucun agent Proprios ne vous demandera jamais vos identifiants ou vos documents originaux en dehors des descentes officielles.\n\nAssurez-vous que vos parcelles enregistrées affichent le statut 'Certifié' dans votre application.\n\nL'équipe Sécurité Proprios.`;
    } else if (templateType === 'UPDATE') {
      subjectInput = "✨ Nouveautés sur Proprios : Certification simplifiée";
      preheaderInput = "Découvrez les nouvelles fonctionnalités de votre plateforme.";
      bodyInput = `Bonjour {{nom}},\n\nNous avons le plaisir de vous annoncer une mise à jour majeure de notre service de certification foncière.\n\nVous pouvez désormais suivre en temps réel la géolocalisation de nos agents lors des descentes sur le terrain !\n\nConnectez-vous à votre tableau de bord pour tester cette nouveauté.\n\nCordialement,\nL'équipe Proprios.`;
    } else if (templateType === 'PROMO') {
      subjectInput = "📢 Faites certifier votre seconde parcelle gratuitement";
      preheaderInput = "Offre exclusive réservée aux membres Proprios.";
      bodyInput = `Bonjour {{nom}},\n\nPour lutter activement contre les spoliations foncières, nous offrons ce mois-ci l'audit légal de votre deuxième parcelle.\n\nAjoutez dès aujourd'hui votre bien sur l'application et demandez une descente d'expertise.\n\nÀ très vite sur Proprios.`;
    }
  };

  // --- EFFETS ---
  $effect(() => {
    if (form) {
      isSending = false;
      if (form.success) {
        showSuccessToast = true;
        toastMessage = form.message || 'Campagne envoyée avec succès !';
        // Réinitialisation
        subjectInput = '';
        preheaderInput = '';
        bodyInput = '';
        setTimeout(() => showSuccessToast = false, 4000);
      }
    }
  });
</script>

{#if currentUser}
  <div class="h-[calc(100vh-8rem)] flex flex-col gap-6 overflow-hidden relative">
    
    <!-- HEADER WORKSPACE -->
    <div class="flex items-center justify-between bg-proprios-card p-6 rounded-3xl border border-white/5 shadow-xl shrink-0">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-proprios-mint text-proprios-dark rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(2,225,177,0.3)]">
          <Mail size={24} />
        </div>
        <div>
          <h1 class="text-2xl font-black text-white tracking-tight">Campagnes Email</h1>
          <p class="text-xs text-slate-400">Rédigez et diffusez des emails ciblés à grande échelle.</p>
        </div>
      </div>

      <!-- Mode de vue (Éditeur vs Prévisualisation) -->
      <div class="flex bg-white/5 p-1 rounded-2xl border border-white/10">
        <button 
          type="button"
          onclick={() => viewMode = 'EDITOR'}
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 {viewMode === 'EDITOR' ? 'bg-proprios-mint text-proprios-dark shadow-md' : 'text-slate-400 hover:text-white'}">
          <Edit3 size={14} /> Éditeur
        </button>
        <button 
          type="button"
          onclick={() => viewMode = 'PREVIEW'}
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 {viewMode === 'PREVIEW' ? 'bg-proprios-mint text-proprios-dark shadow-md' : 'text-slate-400 hover:text-white'}">
          <Eye size={14} /> Aperçu Direct
        </button>
      </div>
    </div>

    <!-- ZONE PRINCIPALE (Scrollable) -->
    <div class="flex-1 overflow-y-auto min-h-0 pr-1">
      {#if viewMode === 'EDITOR'}
        <!-- MODE ÉDITEUR -->
        <form 
          method="POST" 
          action="?/sendCampaign" 
          use:enhance={() => {
            isSending = true;
            return async ({ update }) => {
              await update({ reset: false });
            };
          }}
          class="grid grid-cols-3 gap-6"
        >
          <!-- COLONNE 1 & 2 : COMPOSITEUR (2/3) -->
          <div class="col-span-2 space-y-6">
            
            <!-- Modèles Rapides (Templates) -->
            <Card class="p-5 bg-linear-to-r from-proprios-card to-proprios-dark">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} class="text-proprios-mint" /> Modèles Rapides
                </span>
                <span class="text-[10px] text-slate-500">Un clic pour remplir l'éditeur</span>
              </div>
              <div class="flex gap-3">
                <button type="button" onclick={() => applyTemplate('SECURITY')} class="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-xl border border-white/10 transition-colors flex items-center gap-1.5">
                  <FileText size={12} class="text-red-400" /> Alerte Sécurité
                </button>
                <button type="button" onclick={() => applyTemplate('UPDATE')} class="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-xl border border-white/10 transition-colors flex items-center gap-1.5">
                  <Layout size={12} class="text-proprios-mint" /> Nouveauté
                </button>
                <button type="button" onclick={() => applyTemplate('PROMO')} class="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-xl border border-white/10 transition-colors flex items-center gap-1.5">
                  <Sparkles size={12} class="text-amber-400" /> Offre Spéciale
                </button>
              </div>
            </Card>

            <!-- Formulaire de rédaction -->
            <Card class="p-6 space-y-5">
              <!-- Objet -->
              <div class="space-y-2">
                <label for="subject" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Objet de l'email <span class="text-red-500">*</span></label>
                <input 
                  type="text" 
                  id="subject" 
                  name="subject" 
                  bind:value={subjectInput}
                  placeholder="Ex: Confirmation importante concernant votre parcelle..." 
                  required
                  class="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white font-medium focus:outline-none focus:border-proprios-mint/50 transition-colors"
                />
              </div>

              <!-- Préen-tête (Preheader) -->
              <div class="space-y-2">
                <label for="preheader" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Pré-en-tête (Texte d'aperçu dans la boîte de réception)</label>
                <input 
                  type="text" 
                  id="preheader" 
                  name="preheader" 
                  bind:value={preheaderInput}
                  placeholder="Ex: Résumé rapide visible avant l'ouverture de l'email..." 
                  class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-proprios-mint/50 transition-colors placeholder-slate-600"
                />
              </div>

              <!-- Corps de l'Email -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <label for="body" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Corps du message <span class="text-red-500">*</span></label>
                  <span class="text-[10px] text-slate-500">Variables dispo: <code class="text-proprios-mint font-mono">&#123;&#123;nom&#125;&#125;</code></span>
                </div>
                <textarea 
                  id="body" 
                  name="body" 
                  bind:value={bodyInput}
                  rows={10}
                  placeholder="Rédigez votre message ici..." 
                  required
                  class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-proprios-mint/50 transition-colors resize-none leading-relaxed font-sans"
                ></textarea>
              </div>
            </Card>

          </div>

          <!-- COLONNE 3 : SEGMENTATION & ENVOI (1/3) -->
          <div class="col-span-1 space-y-6">
            
            <!-- Sélecteur de Segment -->
            <Card class="p-5 space-y-4">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Cible d'Audience</h3>
              
              <!-- Input masqué pour la soumission -->
              <input type="hidden" name="segment" value={selectedSegment} />

              <div class="space-y-2">
                {#each SEGMENTS as seg (seg.id)}
                  {@const Icon = seg.icon}
                  {@const isSelected = selectedSegment === seg.id}
                  {@const count = counts[seg.id] || 0}
                  
                  <button 
                    type="button"
                    onclick={() => selectedSegment = seg.id}
                    class="w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between group {isSelected ? 'bg-proprios-mint/10 border-proprios-mint/40 shadow-lg' : 'bg-white/2 border-white/5 hover:bg-white/5'}">
                    
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 {isSelected ? 'bg-proprios-mint text-proprios-dark' : 'bg-white/10 text-slate-400'}">
                        <Icon size={16} />
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-bold text-white truncate">{seg.title}</p>
                        <p class="text-[10px] text-slate-400 truncate">{seg.description}</p>
                      </div>
                    </div>

                    <span class="shrink-0">
                      <Badge variant={isSelected ? 'success' : 'default'}>
                        {count}
                      </Badge>
                    </span>
                  </button>
                {/each}
              </div>
            </Card>

            <!-- Résumé d'Envoi -->
            <Card class="p-5 space-y-4 bg-linear-to-br from-proprios-card to-proprios-dark border-proprios-mint/20">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Résumé de l'Envoi</h3>
              
              <div class="space-y-2 text-xs">
                <div class="flex justify-between py-1 border-b border-white/5">
                  <span class="text-slate-400">Audience :</span>
                  <span class="text-white font-bold">{currentAudienceCount} destinataires</span>
                </div>
                <div class="flex justify-between py-1 border-b border-white/5">
                  <span class="text-slate-400">Canal :</span>
                  <span class="text-proprios-mint font-bold">Email Haute Délivrabilité</span>
                </div>
              </div>

              {#if form?.message && !form?.success}
                <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} /> {form.message}
                </div>
              {/if}

              <button 
                type="submit"
                disabled={!isFormValid || isSending}
                class="w-full py-4 bg-proprios-mint hover:bg-proprios-mint-hover text-proprios-dark font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(2,225,177,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {#if isSending}
                  <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ENVOI EN COURS...
                {:else}
                  <Send size={18} />
                  LANCER LA CAMPAGNE
                {/if}
              </button>
            </Card>

          </div>
        </form>

      {:else}
        <!-- MODE PRÉVISUALISATION (Live Mockup Email Client) -->
        <div class="max-w-2xl mx-auto py-6 animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            
            <!-- Header Client Email (Mockup) -->
            <div class="bg-slate-100 p-4 border-b border-slate-200 text-xs text-slate-600 space-y-1">
              <div class="flex justify-between">
                <span>De : <strong class="text-slate-900">Proprios RDC &lt;no-reply@proprios.cd&gt;</strong></span>
                <span class="text-slate-400">Aujourd'hui, 14:30</span>
              </div>
              <div>À : <strong class="text-slate-900">Jean Dupont &lt;jean.dupont@email.cd&gt;</strong></div>
              <div>Objet : <strong class="text-slate-900">{subjectInput || '(Sans objet)'}</strong></div>
              {#if preheaderInput}
                <div class="text-[11px] text-slate-400 italic pt-1 truncate">
                  {preheaderInput}
                </div>
              {/if}
            </div>

            <!-- Corps Email avec Branding Proprios -->
            <div class="p-8 space-y-6">
              <!-- Banner Logo Proprios -->
              <div class="flex items-center gap-2 border-b border-slate-100 pb-4">
                <div class="w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center">
                  P
                </div>
                <span class="text-lg font-black tracking-wider text-slate-900">PROPRIOS</span>
              </div>

              <!-- Contenu -->
              <div class="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                {bodyInput || "Le contenu de votre email s'affichera ici..."}
              </div>

              <!-- Footer Email -->
              <div class="border-t border-slate-100 pt-6 text-[11px] text-slate-400 text-center space-y-2">
                <p>© 2026 Proprios RDC. Plateforme de sécurisation foncière et immobilière.</p>
                <p>Vous recevez cet email car vous êtes inscrit sur Proprios.</p>
              </div>
            </div>

          </div>
        </div>
      {/if}
    </div>

    <!-- TOAST DE SUCCÈS -->
    {#if showSuccessToast}
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 bg-proprios-card border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in duration-300 z-50">
        <CheckCircle size={20} class="text-proprios-mint" /> {toastMessage}
      </div>
    {/if}

  </div>
{/if}
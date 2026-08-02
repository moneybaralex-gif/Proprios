<script lang="ts">
  import { enhance } from '$app/forms';
  import Card from '$lib/components/admin/ui/Card.svelte';
  import Badge from '$lib/components/admin/ui/Badge.svelte';
  import { 
    Search, Send, Paperclip, MapPin, ShieldAlert, 
    CheckCircle, Clock, EyeOff, Info
  } from '@lucide/svelte';
  
  // SvelteKit génère ce type automatiquement basé sur +page.server.ts
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  
  // --- TYPES STRICTS ---
  type TabType = 'ALL' | 'UNASSIGNED' | 'MINE';
  type MessageType = 'TEXT' | 'INTERNAL_NOTE' | 'SYSTEM';
  
  interface UIMessage {
    id?: string;
    conversationId: string;
    senderId: string;
    type: MessageType;
    content: string;
    plotId?: string | null;
    createdAt: string;
  }

  // --- ÉTATS (Runes) ---
  let ws: WebSocket | null = null;
  let activeTab = $state<TabType>('UNASSIGNED');
  let searchQuery = $state('');
  
  // Conversation active
  let selectedConvId = $state<string | null>(null);
  let activeConversation = $derived(data.conversations.find(c => c.id === selectedConvId));
  
  // Messages locaux
  let currentMessages = $state<UIMessage[]>([]); 
  
  // Inputs
  let messageInput = $state('');
  let isInternalNote = $state(false);
  let attachedPlotId = $state<string | null>(null);

  // Typage strict pour bind:this
  let chatContainer = $state<HTMLElement | null>(null);
  
  // Les onglets pour la boucle #each
  const TABS: TabType[] = ['UNASSIGNED', 'MINE', 'ALL'];

  // --- LOGIQUE DÉRIVÉE ---
  let filteredConversations = $derived(
    data.conversations.filter(c => {
      const matchSearch = c.user.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Sécurité TS : currentUser peut être indéfini lors du SSR initial selon la config
      const userId = data.currentUser?.id;
      
      if (activeTab === 'UNASSIGNED') return matchSearch && c.status === 'UNASSIGNED';
      if (activeTab === 'MINE') return matchSearch && c.assignedToId === userId;
      return matchSearch;
    })
  );

  // --- EFFETS ---
  // 1. Auto-scroll
  $effect(() => {
    if (currentMessages.length > 0 && chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  // 2. Connexion WebSocket
  $effect(() => {
    if (!selectedConvId || !data.currentUser) return;
    
    // Remplacer par l'URL réelle du serveur Bun
    ws = new WebSocket(`wss://api.proprios.cd/chat/${selectedConvId}?token=${data.currentUser.id}`);
    
    ws.onmessage = (event: MessageEvent) => {
      try {
        const newMsg: UIMessage = JSON.parse(event.data);
        currentMessages.push(newMsg);
      } catch (error) {
        console.error("Erreur de parsing WS:", error);
      }
    };

    return () => {
      ws?.close();
    };
  });

  // --- ACTIONS ---
  const sendMessage = () => {
    if ((!messageInput.trim() && !attachedPlotId) || !selectedConvId || !data.currentUser) return;
    
    const payload: UIMessage = {
      id: crypto.randomUUID(), // ID temporaire local
      conversationId: selectedConvId,
      senderId: data.currentUser.id,
      type: isInternalNote ? 'INTERNAL_NOTE' : 'TEXT',
      content: messageInput,
      plotId: attachedPlotId,
      createdAt: new Date().toISOString()
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
    
    currentMessages.push(payload);
    
    messageInput = '';
    attachedPlotId = null;
  };
  
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      sendMessage(); 
    }
  };
</script>

<!-- Sécurité : Si pas de session, ne rien afficher (ou gérer autrement) -->
{#if data.currentUser}
  <div class="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden">
    
    <!-- COLONNE 1 : LISTE DES CONVERSATIONS -->
    <Card class="w-87.5 flex flex-col shrink-0 bg-proprios-dark/50">
      <div class="p-4 border-b border-white/5 space-y-4">
        <div class="relative">
          <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            bind:value={searchQuery}
            type="text" 
            placeholder="Rechercher un client..." 
            class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-proprios-mint/50 transition-colors"
          />
        </div>

        <div class="flex bg-white/5 p-1 rounded-xl">
          <!-- BOUCLE AVEC CLÉ (tab) -->
          {#each TABS as tab (tab)}
            <button 
              type="button"
              onclick={() => activeTab = tab}
              class="flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-all {activeTab === tab ? 'bg-proprios-card text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}">
              {tab === 'UNASSIGNED' ? 'En attente' : tab === 'MINE' ? 'Mes dossiers' : 'Tous'}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <!-- BOUCLE AVEC CLÉ (conv.id) -->
        {#each filteredConversations as conv (conv.id)}
          <button 
            type="button"
            onclick={() => selectedConvId = conv.id}
            class="w-full text-left p-3 rounded-xl transition-all flex gap-3 items-start group {selectedConvId === conv.id ? 'bg-proprios-mint/10 border border-proprios-mint/20' : 'hover:bg-white/5 border border-transparent'}">
            
            <div class="relative">
              <img src={conv.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.user.name}`} alt={`Avatar de ${conv.user.name}`} class="w-10 h-10 rounded-full border border-white/10" />
              {#if conv.status === 'UNASSIGNED'}
                <span class="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 border-2 border-proprios-dark rounded-full"></span>
              {/if}
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium text-white truncate">{conv.user.name}</span>
              </div>
              <p class="text-xs text-slate-400 truncate">
                {conv.messages[0]?.type === 'SYSTEM' ? '🤖 Message système' : conv.messages[0]?.content || 'Nouvelle conversation'}
              </p>
            </div>
          </button>
        {/each}
        
        {#if filteredConversations.length === 0}
          <div class="p-6 text-center text-slate-500 text-sm">
            Aucune conversation trouvée.
          </div>
        {/if}
      </div>
    </Card>

    <!-- COLONNE 2 : ZONE DE CHAT -->
    <Card class="flex-1 flex flex-col min-w-0 bg-proprios-card relative">
      {#if !activeConversation}
        <div class="flex-1 flex flex-col items-center justify-center text-slate-500">
          <ShieldAlert size={48} class="mb-4 opacity-20" />
          <p>Sélectionnez un dossier pour commencer à discuter</p>
        </div>
      {:else}
        <!-- Header Chat -->
        <div class="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-white/1">
          <div class="flex items-center gap-4">
            <div>
              <h2 class="text-lg font-semibold text-white flex items-center gap-2">
                {activeConversation.user.name}
                {#if activeConversation.user.certified}
                  <CheckCircle size={16} class="text-proprios-mint" />
                {/if}
              </h2>
              <p class="text-xs text-slate-400">Dossier: #{activeConversation.id.slice(-6).toUpperCase()}</p>
            </div>
            
            {#if activeConversation.status === 'UNASSIGNED'}
              <form method="POST" action="?/assignConversation" use:enhance>
                <input type="hidden" name="conversationId" value={activeConversation.id} />
                <button type="submit" class="ml-4 px-3 py-1.5 bg-proprios-mint text-proprios-dark text-xs font-bold rounded-lg hover:bg-proprios-mint-hover transition-colors">
                  Prendre en charge
                </button>
              </form>
            {:else}
               <Badge variant="default">En cours</Badge>
            {/if}
          </div>
        </div>

        <!-- Messages Area -->
        <div bind:this={chatContainer} class="flex-1 overflow-y-auto p-6 space-y-6">
          <div class="flex justify-center">
            <span class="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] font-medium text-slate-400 flex items-center gap-2">
              <Clock size={12} /> Début de la conversation
            </span>
          </div>

          <!-- BOUCLE AVEC CLÉ (msg.id ou timestamp en fallback) -->
          {#each currentMessages as msg (msg.id || msg.createdAt)}
            {#if msg.type === 'SYSTEM'}
              <div class="flex justify-center">
                <span class="px-3 py-1 bg-proprios-mint/10 border border-proprios-mint/20 text-proprios-mint rounded-full text-xs text-center max-w-[80%]">
                  {msg.content}
                </span>
              </div>
            {:else}
              {@const isMe = msg.senderId === data.currentUser.id}
              {@const isNote = msg.type === 'INTERNAL_NOTE'}
              
              <div class="flex flex-col {isMe ? 'items-end' : 'items-start'}">
                <div class="flex items-end gap-2 max-w-[75%] {isMe ? 'flex-row-reverse' : 'flex-row'}">
                  
                  {#if !isMe}
                    <img src={activeConversation.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${activeConversation.user.name}`} class="w-8 h-8 rounded-full mb-1" alt="Avatar client" />
                  {/if}

                  <div class="p-3.5 flex flex-col gap-2 relative group {isNote ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-2xl' : isMe ? 'bg-proprios-mint text-proprios-dark rounded-2xl rounded-br-sm' : 'bg-white/5 border border-white/5 text-slate-200 rounded-2xl rounded-bl-sm'}">
                    
                    {#if isNote}
                      <div class="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-500 mb-1">
                        <EyeOff size={12} /> Note Interne
                      </div>
                    {/if}

                    <span class="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</span>
                    
                    {#if msg.plotId}
                      <div class="mt-2 p-2.5 rounded-xl border flex items-center gap-3 transition-colors {isMe && !isNote ? 'bg-black/10 border-black/10 hover:bg-black/20' : 'bg-black/30 border-white/10 hover:bg-black/50'}">
                        <div class="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p class="text-xs font-bold {isMe && !isNote ? 'text-proprios-dark' : 'text-white'}">Parcelle #{msg.plotId.slice(-4)}</p>
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>

        <!-- Input Area -->
        <div class="p-4 border-t border-white/5 bg-proprios-dark/30">
          {#if attachedPlotId}
            <div class="mb-3 p-2 bg-white/5 border border-white/10 rounded-lg flex justify-between items-center max-w-sm">
              <div class="flex items-center gap-2 text-sm text-white">
                <MapPin size={14} class="text-proprios-mint" /> 
                Parcelle attachée: #{attachedPlotId.slice(-4)}
              </div>
              <button type="button" onclick={() => attachedPlotId = null} class="text-slate-500 hover:text-red-400">✕</button>
            </div>
          {/if}

          <div class="flex items-end gap-3 relative">
            <div class="flex items-center pb-2 pl-2">
              <button type="button" class="p-2 text-slate-400 hover:text-proprios-mint rounded-lg transition-colors group relative">
                <Paperclip size={20} />
              </button>
            </div>

            <div class="flex-1 bg-white/5 border {isInternalNote ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-white/10'} rounded-2xl relative transition-all">
              <textarea 
                bind:value={messageInput}
                onkeydown={handleKeydown}
                placeholder={isInternalNote ? "Écrivez une note interne..." : "Répondez au client..."}
                class="w-full bg-transparent p-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none resize-none min-h-12.5 max-h-37.5"
                rows={1}
              ></textarea>

              <button 
                type="button"
                onclick={() => isInternalNote = !isInternalNote}
                class="absolute right-3 bottom-3 p-1.5 rounded-lg transition-colors {isInternalNote ? 'bg-amber-500/20 text-amber-500' : 'text-slate-500 hover:bg-white/10 hover:text-white'}"
                title="Mode Note Interne">
                <EyeOff size={16} />
              </button>
            </div>

            <button 
              type="button"
              onclick={sendMessage}
              disabled={!messageInput.trim() && !attachedPlotId}
              class="w-12 h-12 mb-1 shrink-0 {isInternalNote ? 'bg-amber-500 hover:bg-amber-400' : 'bg-proprios-mint hover:bg-proprios-mint-hover'} text-proprios-dark rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={20} class="ml-1" />
            </button>
          </div>
        </div>
      {/if}
    </Card>

    <!-- COLONNE 3 : CONTEXTE CLIENT -->
    {#if activeConversation}
      <Card class="w-75 shrink-0 bg-proprios-dark/50 flex flex-col overflow-y-auto lg:flex">
        <div class="p-6 border-b border-white/5 flex flex-col items-center text-center">
          <img src={activeConversation.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${activeConversation.user.name}`} class="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-lg mb-4" alt="Profil client" />
          <h3 class="text-white font-semibold text-lg">{activeConversation.user.name}</h3>
          <p class="text-slate-400 text-sm mb-4">{activeConversation.user.telephone || 'Pas de téléphone'}</p>
        </div>

        <div class="p-6 flex-1 space-y-4">
          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            Parcelles ({activeConversation.user.plots?.length || 0})
          </h4>
          
          {#if activeConversation.user.plots && activeConversation.user.plots.length > 0}
            <!-- BOUCLE AVEC CLÉ (plot.id) -->
            {#each activeConversation.user.plots as plot (plot.id)}
              <div class="bg-white/5 border border-white/5 p-3 rounded-xl hover:border-proprios-mint/30 transition-colors cursor-pointer group">
                <div class="flex justify-between items-start mb-2">
                  <Badge variant={plot.certified ? 'success' : 'warning'}>
                    {plot.certified ? 'Certifiée' : 'En attente'}
                  </Badge>
                  <button 
                    type="button"
                    onclick={() => attachedPlotId = plot.id}
                    class="text-slate-500 group-hover:text-proprios-mint transition-colors" title="Joindre au chat">
                    <Paperclip size={14} />
                  </button>
                </div>
                <p class="text-sm text-white font-medium">#{plot.id.slice(-6).toUpperCase()}</p>
              </div>
            {/each}
          {:else}
            <div class="p-4 bg-white/5 rounded-xl border border-dashed border-white/10 flex items-center gap-3 text-slate-400 text-sm">
              <Info size={16} /> Aucune parcelle.
            </div>
          {/if}
        </div>
      </Card>
    {/if}
  </div>
{/if}
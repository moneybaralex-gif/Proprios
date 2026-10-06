<script lang="ts">
  import { enhance } from '$app/forms';
  import { tick } from 'svelte';
  import { wsService } from '$lib/client/ws.svelte';
  import { fade } from 'svelte/transition';
  import { 
    Search, ShieldAlert, CheckCircle, EyeOff,
    Loader2, Sparkles,

	MapPin,

	Send


  } from '@lucide/svelte';
  import Card from '$lib/components/admin/ui/Card.svelte';
  import Badge from '$lib/components/admin/ui/Badge.svelte';
  import type { PageData } from './$types';
  import type { Message, Conversation, User as PrismaUser, Plot } from '$lib/server/generated/prisma/client';

  type AdminConversation = Conversation & {
      user?: (PrismaUser & { plots?: Plot[] }) | null;
      messages: Message[];
  };

  type ExpectedData = PageData & {
      currentUser?: { id: string; name?: string; role?: string } | null;
      streamed?: {
          conversations: Promise<AdminConversation[]>;
      };
  };

  let { data }: { data: ExpectedData } = $props();
  
  type TabType = 'ALL' | 'UNASSIGNED' | 'MINE';
  const TABS: TabType[] = ['UNASSIGNED', 'MINE', 'ALL'];

  let activeTab = $state<TabType>('UNASSIGNED');
  let searchQuery = $state('');
  let selectedConvId = $state<string | null>(null);
  
  let conversationsData = $state<AdminConversation[]>([]);

  $effect(() => {
    if (data.streamed?.conversations) {
      data.streamed.conversations.then((res: AdminConversation[]) => { 
        conversationsData = res || []; 
        if (!selectedConvId && res && res.length > 0) {
          selectedConvId = res[0].id;
        }
      });
    }
  });

  let filteredConversations = $derived(
    conversationsData.filter(c => {
      const userName = c.user?.name || 'Utilisateur';
      const matchSearch = userName.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeTab === 'UNASSIGNED') return matchSearch && c.status === 'UNASSIGNED';
      if (activeTab === 'MINE') return matchSearch && c.assignedToId === data.currentUser?.id;
      return matchSearch;
    })
  );

  let activeConversation = $derived(
    conversationsData.find(c => c.id === selectedConvId)
  );
  
  let currentMessages = $state<Message[]>([]); 
  let messageInput = $state('');
  let isInternalNote = $state(false);
  let attachedPlotId = $state<string | null>(null);
  let isSending = $state(false);
  let chatContainer = $state<HTMLDivElement | null>(null);

  $effect(() => {
    if (activeConversation) {
      currentMessages = [...(activeConversation.messages || [])];
      activeConversation.unreadAdminCount = 0;
      tick().then(scrollToBottom);
    }
  });

  $effect(() => {
    if (!data.currentUser) return;
    
    wsService.connect();
    const socket = wsService.ws;
    if (!socket) return;
    
    const subscribeToActive = () => {
      if (selectedConvId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'subscribe', conversationId: selectedConvId }));
      }
    };

    if (socket.readyState === WebSocket.OPEN) subscribeToActive();
    else socket.addEventListener('open', subscribeToActive);

    const onMessage = (event: MessageEvent<string>) => {
      try {
        const ev = JSON.parse(event.data);
        if (ev.type === 'message.created' && ev.payload) {
          const newMsg = ev.payload as Message;

          if (newMsg.conversationId === selectedConvId) {
            if (!currentMessages.some(m => m.id === newMsg.id)) {
              currentMessages = [...currentMessages, newMsg];
              tick().then(scrollToBottom);
            }
          }

          const convIndex = conversationsData.findIndex(c => c.id === newMsg.conversationId);
          if (convIndex !== -1) {
            const conv = conversationsData[convIndex];
            if (!conv.messages.some(m => m.id === newMsg.id)) {
              conv.messages = [...conv.messages, newMsg];
              conv.lastMessageAt = new Date(newMsg.createdAt);
              if (selectedConvId !== newMsg.conversationId && newMsg.senderId !== data.currentUser?.id) {
                conv.unreadAdminCount = (conv.unreadAdminCount || 0) + 1;
              }
              conversationsData.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
              conversationsData = [...conversationsData];
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    socket.addEventListener('message', onMessage);
    
    return () => {
      socket.removeEventListener('open', subscribeToActive);
      socket.removeEventListener('message', onMessage);
    };
  });

  async function scrollToBottom() {
    await tick();
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  const sendMessage = async () => {
    if ((!messageInput.trim() && !attachedPlotId) || !selectedConvId || !data.currentUser || isSending) return;
    isSending = true;
    
    const contentToSend = messageInput;
    const plotToSend = attachedPlotId;
    const isNoteToSend = isInternalNote;
    messageInput = '';
    attachedPlotId = null;

    const formData = new FormData();
    formData.append('content', contentToSend);
    formData.append('conversationId', selectedConvId);
    if (isNoteToSend) formData.append('isInternal', 'true');
    if (plotToSend) formData.append('plotId', plotToSend);
    
    try {
      const res = await fetch('?/sendAdminMessage', { method: 'POST', body: formData });
      
      if (res.ok && isNoteToSend) {
        const localNote = {
          id: crypto.randomUUID(),
          conversationId: selectedConvId,
          senderId: data.currentUser.id,
          type: 'INTERNAL_NOTE',
          content: contentToSend,
          plotId: plotToSend,
          createdAt: new Date(),
          isRead: true
        } as Message;
        
        currentMessages = [...currentMessages, localNote];
        if (activeConversation) {
          activeConversation.messages = [...activeConversation.messages, localNote];
        }
        tick().then(scrollToBottom);
      }
    } catch(e) {
      console.error("Erreur d'envoi", e);
    } finally {
      isSending = false;
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      sendMessage(); 
    }
  };

  function formatTime(date: Date | string) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

{#if data.currentUser}
  {#if !data.streamed?.conversations}
    <div class="h-[calc(100vh-6rem)] flex items-center justify-center">
      <Loader2 size={40} class="animate-spin text-emerald-400" />
    </div>
  {:else}
    {#await data.streamed.conversations}
      <div class="h-[calc(100vh-6rem)] flex items-center justify-center">
        <Loader2 size={40} class="animate-spin text-emerald-400" />
      </div>
    {:then _}
      <div class="h-[calc(100vh-6rem)] flex gap-4 overflow-hidden p-2">
      
        <!-- COLONNE 1 : LISTE DES CONVERSATIONS -->
        <Card class="w-80 lg:w-96 flex flex-col shrink-0 bg-slate-950/40 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl overflow-hidden">
          <div class="p-4 border-b border-white/10 space-y-3.5 bg-black/20">
            <div class="relative group">
              <Search size={16} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
              <input 
                bind:value={searchQuery}
                type="text" 
                placeholder="Rechercher un client..." 
                class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50 transition-all"
              />
            </div>

            <div class="flex bg-white/5 p-1 rounded-xl border border-white/5">
              {#each TABS as tab (tab)}
                <button 
                  type="button"
                  onclick={() => activeTab = tab}
                  class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 {activeTab === tab ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}">
                  {tab === 'UNASSIGNED' ? 'En attente' : tab === 'MINE' ? 'Mes dossiers' : 'Tous'}
                </button>
              {/each}
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {#each filteredConversations as conv (conv.id)}
              {@const userName = conv.user?.name || 'Client Inconnu'}
              {@const userImage = conv.user?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}`}
              {@const lastMsg = conv.messages?.[conv.messages.length - 1]}
              {@const hasUnread = (conv.unreadAdminCount ?? 0) > 0}
              {@const isSelected = selectedConvId === conv.id}
              
              <button 
                type="button"
                onclick={() => { selectedConvId = conv.id; }}
                class="w-full text-left p-3 rounded-2xl transition-all duration-200 flex gap-3 items-center group relative {isSelected ? 'bg-emerald-400/15 border border-emerald-400/30 shadow-inner' : 'hover:bg-white/5 border border-transparent'}">
                
                <div class="relative shrink-0">
                  <img 
                    src={userImage} 
                    alt="Avatar" 
                    class="w-11 h-11 rounded-full border-2 {isSelected ? 'border-emerald-400' : 'border-white/10'} object-cover" 
                  />
                  {#if hasUnread}
                    <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
                    </span>
                  {/if}
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-bold text-white truncate">
                      {userName}
                    </span>
                    {#if lastMsg}
                      <span class="text-[10px] text-slate-400 shrink-0 ml-1">
                        {formatTime(lastMsg.createdAt)}
                      </span>
                    {/if}
                  </div>
                  
                  <div class="flex items-center justify-between gap-1">
                    <p class="text-xs truncate {hasUnread ? 'text-white font-semibold' : 'text-slate-400'}">
                      {#if lastMsg}
                        {lastMsg.content}
                      {:else}
                        <span class="italic text-slate-500">Nouvelle discussion</span>
                      {/if}
                    </p>

                    {#if hasUnread}
                      <span class="shrink-0 bg-emerald-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                        {conv.unreadAdminCount}
                      </span>
                    {/if}
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </Card>

        <!-- COLONNE 2 : ZONE DE CHAT -->
        <Card class="flex-1 flex flex-col min-w-0 bg-slate-950/40 backdrop-blur-2xl border-white/10 relative shadow-2xl rounded-3xl overflow-hidden">
          {#if !activeConversation}
            <div class="flex-1 flex flex-col items-center justify-center text-slate-500" in:fade>
              <ShieldAlert size={56} class="mb-4 opacity-20 text-emerald-400" />
              <p class="text-base font-semibold text-white">Sélectionnez une discussion</p>
            </div>
          {:else}
            {@const activeUserName = activeConversation.user?.name || 'Client Inconnu'}
            {@const activeUserImage = activeConversation.user?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeUserName)}`}
            
            <!-- EN-TÊTE DU CHAT ACTIF -->
            <div class="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-black/30 backdrop-blur-md z-10" in:fade>
              <div class="flex items-center gap-3">
                <img 
                  src={activeUserImage} 
                  class="w-10 h-10 rounded-full border border-white/10 object-cover" 
                  alt="Client" 
                />
                <div>
                  <h2 class="text-sm font-bold text-white flex items-center gap-1.5">
                    {activeUserName}
                    {#if activeConversation.user?.certified}
                      <CheckCircle size={14} class="text-emerald-400" />
                    {/if}
                  </h2>
                  <p class="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span> En ligne
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                {#if activeConversation.status === 'UNASSIGNED'}
                  <form method="POST" action="?/assignConversation" use:enhance>
                    <input type="hidden" name="conversationId" value={activeConversation.id} />
                    <button type="submit" class="px-3 py-1.5 bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-300 transition-all flex items-center gap-1.5">
                      <Sparkles size={13} /> Prendre en charge
                    </button>
                  </form>
                {:else}
                  <Badge variant="default">Dossier en cours</Badge>
                {/if}
              </div>
            </div>

            <!-- HISTORIQUE DES MESSAGES BIEN POSITIONNÉS (DROITE/GAUCHE) -->
            <div bind:this={chatContainer} class="flex-1 overflow-y-auto p-6 space-y-3.5 scroll-smooth">
              {#each currentMessages as msg (msg.id)}
                {@const isMe = msg.senderId === data.currentUser?.id}
                {@const isNote = msg.type === 'INTERNAL_NOTE'}
                
                {#if msg.type === 'SYSTEM'}
                  <div class="flex justify-center my-3">
                    <span class="px-3.5 py-1.5 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 rounded-xl text-xs text-center max-w-[80%]">
                      🤖 {msg.content}
                    </span>
                  </div>
                {:else}
                  <!-- ALIGNEMENT : DROITE POUR L'ADMINISTRATEUR (isMe) / GAUCHE POUR LE CLIENT -->
                  <div class="flex w-full {isMe ? 'justify-end' : 'justify-start'} my-1">
                    <div class="flex flex-col max-w-[80%] sm:max-w-[70%] {isMe ? 'items-end' : 'items-start'}">
                      
                      <!-- BULLE -->
                      <div class="p-3.5 shadow-md {isNote ? 'bg-amber-500/15 border border-amber-500/30 text-amber-100 rounded-3xl' : isMe ? 'bg-emerald-400 text-slate-950 font-medium rounded-3xl rounded-tr-xs' : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-3xl rounded-tl-xs'}">
                        
                        {#if isNote}
                          <div class="flex items-center gap-1 text-[10px] uppercase font-black text-amber-400 mb-1">
                            <EyeOff size={11} /> Note Interne (Confidentiel)
                          </div>
                        {/if}

                        <span class="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{msg.content}</span>
                        
                        {#if msg.plotId}
                          <div class="mt-2 p-2 rounded-xl border flex items-center gap-2 {isMe && !isNote ? 'bg-black/10 border-black/10 text-slate-950' : 'bg-black/40 border-white/10 text-emerald-300'}">
                            <MapPin size={14} class="shrink-0" />
                            <span class="text-xs font-bold">Réf. Parcelle #{msg.plotId.slice(-6)}</span>
                          </div>
                        {/if}
                      </div>
                      
                      <!-- HEURE -->
                      <span class="text-[10px] text-slate-500 mt-1 px-2">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>

            <!-- ZONE DE SAISIE -->
            <div class="p-3 border-t border-white/10 bg-black/30 backdrop-blur-xl z-10">
              <div class="flex items-center gap-2.5">
                <div class="flex-1 bg-black/40 border {isInternalNote ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-white/10'} rounded-2xl relative flex items-center">
                  <textarea 
                    bind:value={messageInput}
                    onkeydown={handleKeydown}
                    placeholder={isInternalNote ? "Rédiger une note interne..." : "Écrire au client..."}
                    class="w-full bg-transparent py-2.5 pl-4 pr-11 text-xs text-white placeholder-slate-500 focus:outline-none resize-none min-h-10 max-h-32"
                    rows={1}
                  ></textarea>

                  <button 
                    type="button"
                    onclick={() => isInternalNote = !isInternalNote}
                    class="absolute right-2.5 p-1.5 rounded-lg transition-all {isInternalNote ? 'bg-amber-500/20 text-amber-400 scale-105' : 'text-slate-500 hover:text-white'}"
                    title="Basculer Mode Note Interne">
                    <EyeOff size={15} />
                  </button>
                </div>

                <button 
                  type="button"
                  onclick={sendMessage}
                  disabled={!messageInput.trim() || isSending}
                  class="w-10 h-10 shrink-0 {isInternalNote ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-400 hover:bg-emerald-300'} text-slate-950 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {#if isSending}
                    <Loader2 size={16} class="animate-spin" />
                  {:else}
                    <Send size={16} />
                  {/if}
                </button>
              </div>
            </div>
          {/if}
        </Card>     
      </div>
    {/await}
  {/if}
{/if}
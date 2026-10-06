<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { page } from '$app/state';
	import { wsService } from '$lib/client/ws.svelte';
	import { Send, Pencil, CheckCheck, Circle, Loader2, MapPin, X } from '@lucide/svelte';
	import type { ActionResult } from '@sveltejs/kit';
	import type { PageData } from './$types';
	import type { Message, Conversation } from '$lib/server/generated/prisma/client';

	type ChatPayload = {
		conversation: Conversation;
		messages: Message[];
		hasMoreMessages: boolean;
	};

	type ExpectedData = PageData & {
		currentUserId?: string | null;
		user?: { id: string } | null;
		streamed?: {
			chatData: Promise<ChatPayload>;
		};
	};

	let { data } = $props<{ data: ExpectedData }>();

	// Identification réactive de l'utilisateur connecté
	const currentUserId = $derived(data.currentUserId ?? data.user?.id);

	let messages = $state<Message[]>([]);
	let loadedConversationId = $state<string | null>(null);

	let text = $state('');
	let editing = $state<Message | null>(null);
	let typing = $state(false);

	let chatContainer = $state<HTMLDivElement | null>(null);
	let isTyping = $derived(text.trim().length > 0);
	let lastSentTyping = $state(false);

	// Référence de parcelle transmise via URL (?plotId=...)
	let attachedPlotId = $state<string | null>(null);

	$effect(() => {
		const paramPlotId = page.url.searchParams.get('plotId');
		if (paramPlotId) {
			attachedPlotId = paramPlotId;
		}
	});

	const EDIT_WINDOW_MS = 60 * 60 * 1000;

	type ChatActionData = { success?: boolean; error?: string; message?: Message };

	function getActionData(result: ActionResult): ChatActionData | null {
		if (result.type !== 'success' && result.type !== 'failure') return null;
		return result.data as ChatActionData;
	}

	async function scrollToBottom() {
		await tick();
		if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
	}

	$effect(() => {
		if (data.streamed?.chatData) {
			data.streamed.chatData.then((res: ChatPayload) => {
				if (loadedConversationId !== res.conversation.id) {
					messages = res.messages;
					loadedConversationId = res.conversation.id;
					tick().then(scrollToBottom);
				}
			});
		} else {
			messages = [];
			loadedConversationId = null;
		}
	});

	$effect(() => {
		if (isTyping !== lastSentTyping) {
			sendTyping(isTyping);
			lastSentTyping = isTyping;
		}
	});

	$effect(() => {
		wsService.connect();
		const socket = wsService.ws;
		if (!socket || !loadedConversationId) return;

		const onOpen = () => {
			socket.send(JSON.stringify({ type: 'subscribe', conversationId: loadedConversationId }));
		};

		if (socket.readyState === 1) onOpen();
		else socket.addEventListener('open', onOpen);

		const onMessage = (event: MessageEvent<string>) => {
			try {
				const ev = JSON.parse(event.data);
				if (ev.type === 'message.created' && ev.payload) addMessage(ev.payload as Message);
				else if (ev.type === 'message.updated' && ev.payload) updateMessage(ev.payload as Message);
				else if (ev.type === 'typing' && ev.conversationId === loadedConversationId) {
					if (ev.userId !== currentUserId) typing = Boolean(ev.isTyping);
				}
			} catch (error) {
				console.error('Erreur WebSocket message:', error);
			}
		};

		socket.addEventListener('message', onMessage);
		return () => {
			socket.removeEventListener('open', onOpen);
			socket.removeEventListener('message', onMessage);
		};
	});

	function addMessage(message: Message) {
		if (message.conversationId !== loadedConversationId) return;
		if (messages.some((item) => item.id === message.id)) return;
		messages = [...messages, message];
		scrollToBottom();
	}

	function updateMessage(message: Message) {
		if (message.conversationId !== loadedConversationId) return;
		const index = messages.findIndex((item) => item.id === message.id);
		if (index !== -1) {
			const updated = [...messages];
			updated[index] = message;
			messages = updated;
		}
	}

	function isMyMessage(message: Message): boolean {
		if (!currentUserId) return false;
		return message.senderId === currentUserId;
	}

	function canEdit(message: Message): boolean {
		if (!isMyMessage(message) || message.type !== 'TEXT') return false;
		return Date.now() - new Date(message.createdAt).getTime() < EDIT_WINDOW_MS;
	}

	function sendTyping(isTypingState: boolean) {
		const socket = wsService.ws;
		if (!socket || socket.readyState !== 1 || !loadedConversationId) return;
		socket.send(
			JSON.stringify({
				type: 'typing',
				conversationId: loadedConversationId,
				isTyping: isTypingState
			})
		);
	}

	function startEditing(message: Message) {
		if (!canEdit(message)) return;
		editing = message;
		text = message.content;
		requestAnimationFrame(() =>
			document.querySelector<HTMLInputElement>('#chat-message-input')?.focus()
		);
	}

	function cancelEditing() {
		editing = null;
		text = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' || event.shiftKey) return;
		event.preventDefault();
		if (!isTyping) return;
		(event.currentTarget as HTMLInputElement).form?.requestSubmit();
	}
</script>

<svelte:head><title>Assistance & Chat — Proprios</title></svelte:head>

<div class="mx-auto flex h-[calc(100dvh-80px)] max-w-3xl flex-col px-4 py-4 pb-20">
	<div class="mb-3">
		<p class="text-sm font-semibold text-emerald-300">Assistance</p>
		<h1 class="text-3xl font-black text-white">Chat avec Proprios</h1>
	</div>

	<section
		class="card relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-2xl"
	>
		<!-- EN-TÊTE DU CHAT -->
		<div class="flex items-center gap-3 border-b border-white/5 bg-black/40 p-4">
			<div
				class="grid size-10 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
			>
				<Circle size={12} fill="currentColor" />
			</div>
			<div>
				<b class="text-sm text-white">Support Foncier & Administratif</b>
				<p class="text-xs font-medium text-emerald-400">En ligne</p>
			</div>
		</div>

		<!-- LISTE DES MESSAGES -->
		{#if !data.streamed?.chatData}
			<div class="flex flex-1 flex-col items-center justify-center">
				<Loader2 size={32} class="animate-spin text-emerald-400" />
			</div>
		{:else}
			{#await data.streamed.chatData}
				<div class="flex flex-1 flex-col items-center justify-center">
					<Loader2 size={32} class="animate-spin text-emerald-400" />
				</div>
			{:then _}
				<div bind:this={chatContainer} class="flex-1 space-y-4 overflow-y-auto scroll-smooth p-4">
					{#each messages as message (message.id)}
						{@const mine = isMyMessage(message)}

						<!-- CONTENEUR DU MESSAGE : DROITE POUR MOI / GAUCHE POUR LE CONSEILLER -->
						<div class="flex w-full {mine ? 'justify-end' : 'justify-start'}">
							<div
								class="flex max-w-[85%] items-end gap-2.5 sm:max-w-[75%] {mine
									? 'flex-row-reverse'
									: 'flex-row'}"
							>
								<!-- AVATAR DU CONSEILLER (POUR LES MESSAGES REÇUS) -->
								{#if !mine}
									<div
										class="mb-1 grid size-7 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-[10px] font-black text-emerald-300 ring-1 ring-emerald-400/30"
									>
										P
									</div>
								{/if}

								<div class="flex flex-col {mine ? 'items-end' : 'items-start'} min-w-0">
									<!-- LIBELLÉ EXPÉDITEUR POUR LES MESSAGES REÇUS -->
									{#if !mine}
										<span class="mb-1 px-1 text-[11px] font-bold text-slate-400"
											>Support Proprios</span
										>
									{/if}

									<!-- BULLE DE MESSAGE -->
									<div
										class="px-4 py-2.5 text-sm shadow-md transition-all {mine
											? 'rounded-2xl rounded-tr-xs bg-emerald-400 font-medium text-slate-950'
											: 'rounded-2xl rounded-tl-xs border border-slate-700/80 bg-slate-800/90 text-slate-100'}"
									>
										<p class="leading-relaxed wrap-break-word whitespace-pre-wrap">{message.content}</p>

										<!-- PIÈCE JOINTE PARCELLE -->
										{#if message.plotId}
											<div
												class="mt-2 flex items-center gap-2 rounded-xl p-2 {mine
													? 'bg-black/10 text-slate-950'
													: 'border border-white/10 bg-black/40 text-emerald-300'}"
											>
												<MapPin size={14} class="shrink-0" />
												<span class="text-xs font-bold"
													>Réf. Parcelle #{message.plotId.slice(-6)}</span
												>
											</div>
										{/if}
									</div>

									<!-- HEURE & STATUT -->
									<div
										class="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-slate-400 {mine
											? 'justify-end'
											: 'justify-start'}"
									>
										<span>
											{new Date(message.createdAt).toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit'
											})}
										</span>
										{#if mine}
											<CheckCheck size={13} class="text-emerald-400" />
										{/if}
										{#if canEdit(message)}
											<button
												type="button"
												aria-label="Modifier"
												onclick={() => startEditing(message)}
												class="ml-1 text-slate-400 transition-colors hover:text-emerald-300"
											>
												<Pencil size={11} />
											</button>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}

					{#if typing}
						<div class="flex w-full justify-start">
							<div
								class="flex animate-pulse items-center gap-2 rounded-2xl rounded-tl-xs border border-slate-700/50 bg-slate-800/80 px-3.5 py-2 text-xs text-slate-300 italic"
							>
								<span class="size-1.5 animate-ping rounded-full bg-emerald-400"></span>
								Le conseiller écrit…
							</div>
						</div>
					{/if}
				</div>
			{/await}
		{/if}

		<!-- BANNIÈRE PARCELLE JOINTE -->
		{#if attachedPlotId}
			<div
				class="flex items-center justify-between border-t border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300"
			>
				<div class="flex items-center gap-2">
					<MapPin size={14} />
					<span>Discussion liée à la parcelle <b>#{attachedPlotId.slice(-6)}</b></span>
				</div>
				<button
					type="button"
					onclick={() => (attachedPlotId = null)}
					class="icon-btn size-6 hover:text-rose-400"
					aria-label="Retirer la référence"
				>
					<X size={14} />
				</button>
			</div>
		{/if}

		<!-- FORMULAIRE DE SAISIE -->
		<form
			method="POST"
			action={editing ? '?/edit' : '?/send'}
			use:enhance={() => {
				return async ({ result, update }) => {
					const actionData = getActionData(result);
					if (result.type === 'success' && actionData?.message) {
						if (editing) updateMessage(actionData.message);
						else addMessage(actionData.message);
						text = '';
						editing = null;
					}
					await update({ invalidateAll: false, reset: false });
				};
			}}
			class="flex items-center gap-2 border-t border-white/5 bg-black/40 p-3"
		>
			<input type="hidden" name="conversationId" value={loadedConversationId ?? ''} />
			{#if attachedPlotId}<input type="hidden" name="plotId" value={attachedPlotId} />{/if}
			{#if editing}<input type="hidden" name="messageId" value={editing.id} />{/if}

			<input
				id="chat-message-input"
				class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-colors focus:border-emerald-400/50 focus:outline-none"
				name="content"
				bind:value={text}
				onkeydown={handleKeydown}
				placeholder={editing ? 'Modifier votre message...' : 'Écrivez votre question ici...'}
				autocomplete="off"
				disabled={!loadedConversationId}
			/>
			<button
				type="submit"
				disabled={!isTyping || !loadedConversationId}
				aria-label="Envoyer"
				class="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/20 transition-all hover:bg-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
			>
				<Send size={18} />
			</button>
			{#if editing}
				<button
					type="button"
					class="px-2 text-lg font-bold text-slate-400 hover:text-white"
					aria-label="Annuler"
					onclick={cancelEditing}>×</button
				>
			{/if}
		</form>
	</section>
</div>

<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { fromStore } from 'svelte/store';

	const sessionState = fromStore(authClient.useSession());

	// Extraction sécurisée du user
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const sessionData = $derived(sessionState.current.data as any);
	const user = $derived(sessionData && 'user' in sessionData ? sessionData.user : null);
</script>

{#if user}
	<div class="flex items-center gap-2">
		{#if user.image}
			<img src={user.image} alt="Profile" class="w-10 h-10 rounded-full" />
		{/if}
		<div class="flex flex-col">
			<p class="text-sm font-medium">{user.name}</p>
			<p class="text-sm text-gray-500">{user.email}</p>
		</div>
	</div>
{/if}
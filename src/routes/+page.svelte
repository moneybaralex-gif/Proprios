<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let { data } = $props();

	async function handleSignOut() {
		await authClient.signOut();
		goto('/login');
	}
</script>

<h1>Tableau de bord</h1>
<p>Bienvenue, <strong>{data.user.name}</strong> ({data.user.email}) !</p>

{#if data.user.image}
	<img src={data.user.image} alt="Avatar" width="80" style="border-radius: 50%" />
{/if}

<button onclick={handleSignOut}>Se déconnecter</button>

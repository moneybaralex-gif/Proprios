<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import NotificationContainer from '$lib/components/Notification.svelte';
	import ClientHeader from '$lib/components/client/ClientHeader.svelte';
	import BottomNav from '$lib/components/client/BottomNav.svelte';
	let { children } = $props();
	const isClient = $derived(
		!page.url.pathname.startsWith('/admin') && page.url.pathname !== '/login'
	);
</script>

<NotificationContainer />
{#if isClient}<ClientHeader />{/if}
<main class:is-client={isClient}>{@render children()}</main>
{#if isClient}<BottomNav />{/if}
<svelte:head
	><meta name="theme-color" content="#070b14" /><meta
		name="viewport"
		content="width=device-width, initial-scale=1, viewport-fit=cover"
	/></svelte:head
>

<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
    import NotificationContainer from '$lib/components/Notification.svelte'

	let { children } = $props();
</script>

<NotificationContainer />

{@render children()}
<svelte:head><link rel="icon" href={favicon} /></svelte:head>


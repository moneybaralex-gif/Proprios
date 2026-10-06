<script lang="ts">
	import { type Snippet } from 'svelte';
	import Sidebar from '$lib/components/admin/layout/Sidebar.svelte';
	import Topbar from '$lib/components/admin/layout/Topbar.svelte';

	let {
		children,
		data
	}: {
		children: Snippet;
		data: { user: { name: string; role: 'admin' | 'employee'; image: string } };
	} = $props();
</script>

<svelte:head>
	<title>Proprios Admin</title>
</svelte:head>

<div class="flex min-h-screen bg-proprios-dark">
	<Sidebar userRole={data.user.role} />

	<main class="relative ml-64 flex flex-1 flex-col">
		<Topbar user={data.user} />

		<div class="flex-1 overflow-x-hidden p-8">
			{@render children()}
		</div>
	</main>
</div>

<script lang="ts">
  import { type Snippet } from 'svelte';
  import Sidebar from '$lib/components/admin/layout/Sidebar.svelte';
  import Topbar from '$lib/components/admin/layout/Topbar.svelte';

  let { children, data }: {
    children: Snippet;
    data: { user: { name: string; role: 'admin' | 'employee'; image: string } };
  } = $props();
</script>

<div class="min-h-screen flex bg-proprios-dark">
  <Sidebar userRole={data.user.role} />
  
  <main class="flex-1 ml-64 flex flex-col relative">
    <Topbar user={data.user} />
    
    <div class="p-8 flex-1 overflow-x-hidden">
      {@render children()}
    </div>
  </main>
</div>
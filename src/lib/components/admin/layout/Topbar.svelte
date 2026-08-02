<script lang="ts">
  import { Search, Bell } from '@lucide/svelte';
  let { user }: { user: { name: string, role: string, image: string } } = $props();
</script>

<header class="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-proprios-dark/80 backdrop-blur-md sticky top-0 z-10">
  <div class="relative w-96">
    <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input 
      type="text" 
      placeholder="Rechercher un dossier, une parcelle, un client..." 
      class="w-full bg-white/5 border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-proprios-mint/50 text-white placeholder-slate-500 transition-colors"
    />
  </div>

  <div class="flex items-center gap-6">
    <button class="relative text-slate-400 hover:text-white transition-colors">
      <Bell size={20} />
      <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-proprios-mint rounded-full border-2 border-proprios-dark"></span>
    </button>
    
    <div class="flex items-center gap-3 border-l border-white/10 pl-6">
      <div class="text-right">
        <p class="text-sm font-medium text-white">{user.name}</p>
        <p class="text-xs text-proprios-mint capitalize">{user.role}</p>
      </div>
      <img src={user.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Proprios'} alt="Avatar" class="w-10 h-10 rounded-full border border-white/10" />
    </div>
  </div>
</header>
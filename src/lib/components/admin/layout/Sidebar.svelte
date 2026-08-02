<script lang="ts">
  import { page } from '$app/stores';
  import { 
    LayoutDashboard, MessageSquare, ShieldCheck, Users, 
    Map, MapPin, Wallet, Bell, Mail, Settings, LogOut 
  } from '@lucide/svelte';

  let { userRole }: { userRole: 'admin' | 'employee' } = $props();

  const menu = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Messagerie', icon: MessageSquare, href: '/admin/messages' },
    { name: 'Certifications', icon: ShieldCheck, href: '/admin/certifications' },
    { name: 'Utilisateurs', icon: Users, href: '/admin/users' },
    { name: 'Parcelles', icon: Map, href: '/admin/plots' },
    { name: 'Descentes', icon: MapPin, href: '/admin/visits' },
    // Conditionnel selon le rôle
    
    // eslint-disable-next-line svelte/no-unused-svelte-ignore
    // svelte-ignore state_referenced_locally
    ...(userRole === 'admin' ? [{ name: 'Finance', icon: Wallet, href: '/admin/finance' }] : []),
    { name: 'Notifications', icon: Bell, href: '/admin/notifications' },
    { name: 'Campagnes', icon: Mail, href: '/admin/campaigns' },
    { name: 'Paramètres', icon: Settings, href: '/admin/settings' },
  ];
</script>

<aside class="w-64 h-screen bg-proprios-card border-r border-white/5 flex flex-col fixed left-0 top-0">
  <div class="h-20 flex items-center px-6 border-b border-white/5">
    <!-- Logo inspiré de ta maquette -->
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-proprios-mint text-proprios-dark font-bold flex items-center justify-center">
        P
      </div>
      <span class="text-xl font-bold text-white tracking-wider">PROPRIOS</span>
    </div>
  </div>

  <nav class="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
    {#each menu as item, index (index)}
      {@const isActive = $page.url.pathname === item.href}
      <a href={item.href} class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 {isActive ? 'bg-proprios-mint/10 text-proprios-mint font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
        <item.icon size={18} />
        {item.name}
      </a>
    {/each}
  </nav>

  <div class="p-4 border-t border-white/5">
    <button class="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 transition-colors rounded-xl hover:bg-white/5">
      <LogOut size={18} />
      Déconnexion
    </button>
  </div>
</aside>
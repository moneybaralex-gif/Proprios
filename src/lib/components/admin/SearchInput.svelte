<script lang="ts">
    import { Search } from '@lucide/svelte';

    let {
        SearchName,
        searchId,
        placeholder
    }: { 
        SearchName: string; 
        searchId: string; 
        placeholder: string;
    } = $props();
</script>

<form
    class="group flex h-10 w-full items-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10"
    action=""
>
    <!-- Champ de saisie -->
    <input 
        class="h-full w-full bg-transparent pl-4 pr-2 text-sm text-slate-700 outline-none placeholder:text-slate-400" 
        type="search" 
        {placeholder} 
        name={SearchName} 
        id={searchId} 
    />
    
    <!-- Bouton de soumission avec icône -->
    <button 
        type="submit"
        class="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-700 text-cyan-50 transition-colors hover:bg-cyan-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1"
        aria-label="Rechercher"
    >
        <Search class="size-4" strokeWidth={2.5} />
    </button>
</form>
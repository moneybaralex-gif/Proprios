<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children, variant = 'default' }: { children: Snippet, variant?: 'default'|'success'|'danger'|'warning' } = $props();

  let styles = $derived({
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-proprios-mint/10 text-proprios-mint border-proprios-mint/20',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  }[variant]);
</script>

<span class="px-2.5 py-0.5 rounded-full text-xs font-medium border {styles}">
  {@render children()}
</span>
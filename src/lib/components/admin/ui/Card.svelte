<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children, class: className = '' }: { children: Snippet, class?: string } = $props();
</script>

<div class="bg-proprios-card border border-white/5 rounded-2xl shadow-xl {className}">
  {@render children()}
</div>
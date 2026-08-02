<script lang="ts">
    import { LoaderCircle } from "@lucide/svelte";

    type ButtonFetchingProps = {
        color?: string;
        title: string;
        isFetching?: boolean;
        height?: string;
        onclick?: (event: MouseEvent) => void;
        type?: "button" | "submit" | "reset";
    };

    let { 
        color = "bg-black", 
        title, 
        isFetching = false, 
        height, 
        onclick, 
        type = "submit" 
    }: ButtonFetchingProps = $props();
</script>

<button 
    disabled={isFetching} 
    {onclick} 
    {type} 
    class={`relative w-full ${height} flex items-center justify-center gap-3 rounded-xl ${color} cursor-pointer disabled:bg-neutral-400 hover:scale-95 transition-transform active:scale-90 disabled:cursor-not-allowed disabled:hover:scale-100 `}
>
    <div class="transition">{title}</div>
    {#if isFetching}
        <LoaderCircle class="absolute right-2 animate-spin"/>
    {/if}
</button>
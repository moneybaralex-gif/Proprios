<script lang="ts">
	import {NotebookText } from "@lucide/svelte";

    interface TypeLiens {
        nom : string
        lien : string
    }
    let {liens, cloture} : {liens: TypeLiens[], cloture?:string} = $props()
</script>
<div class=" sticky flex justify-between items-center pl-3 z-3">
    <div class=" text-cyan-900 font-bold rounded-2xl bg-cyan-100/50 border-2 border-cyan-200 px-2 py-1">BOUTIQUE</div>
    <div class=" fixed right-0 flex gap-3 rounded-l-lg text-cyan-100 bg-linear-to-l from-cyan-950 to-cyan-800">
        {#each liens as  lien, index (index)}
            <a href={`${lien.lien}`}>
            {lien.nom}
        </a>
        {/each}
        {#if cloture}
            <button class=" flex justify-center items-center gap-3 px-3 text-amber-100 bg-amber-600 cursor-pointer hover:bg-amber-700">
                <NotebookText class="text-amber-100" />
                {cloture}
            </button>
        {/if}
    </div>
</div>

<style>
    a {
        padding: 10px;
        &:hover {
            background-color: cadetblue;
        }
    }
</style>
<script lang="ts">
	import { Eye, EyeOff } from '@lucide/svelte';

	let {
		value = $bindable(),
		label,
        inputStyle,
		type = $bindable("text"),
		name,
		completion = 'off',
		erreur,
		theme = 'light',
	}: { value: string | number; label: string; type?: string, inputStyle?:string, name?: string, completion?: HTMLInputElement['autocomplete'], erreur?: string, theme?: 'light' | 'dark' } = $props();

	let id = $state('input-' + Math.random().toString(36).substring(2, 9));
	let typePassword = $state('password');

	function changeType(e:Event) {
		e.preventDefault()
		if (type === 'text') {
			type = typePassword;
		} else {
			type = 'text';
		}
	}
</script>

<div class="w-full flex flex-col gap-1">
	{#if erreur}<p class=" w-full text-red-200 text-sm bg-black/30 text-center rounded-xl">{erreur}</p>{/if}
	<div class=" relative flex w-full">

	<input
		{type}
		{id}
		{name}
		bind:value
		autoComplete={completion}
		placeholder=" "
		class={`w-full rounded-l-xl border-2 ${inputStyle === "password"? "border-r-0" : " rounded-r-xl"} ${erreur ? "border-red-300/60 border-dashed" : theme === 'light'? 'border-neutral-100/80 bg-neutral-700/30' : 'border-cyan-100/60'} px-3 pt-4 pb-2 text-md text-white/90 outline-0 focus:${theme === 'light'? 'border-cyan-800' : 'border-cyan-400'} focus:shadow-md`}
	/>
	<label for={id} class=" absolute text-white/90 left-3 top-[50%] translate-y-[-50%] pointer-events-none transition-all duration-300">{label}</label>
	{#if (inputStyle === 'password')}
		<button onclick={changeType} class=" bg-neutral-800/50 px-3 rounded-r-xl cursor-pointer hover:bg-black/50">
			{#if type === "text"}
                <Eye/>
            {:else}
               <EyeOff /> 
            {/if}

		</button>
	{/if}
	
</div>

</div>
	
<style>
    input:focus ~ label,
    input:not(:placeholder-shown) ~ label {
        top: 0.8rem;
        font-size: 0.7rem;
        color: rgb(174, 255, 237);
        transform: translateY(0) !important;
    }
</style>

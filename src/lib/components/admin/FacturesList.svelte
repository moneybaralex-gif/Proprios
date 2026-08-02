<script>
	import ButtonFetching from './ButtonFetching.svelte';
	import FactureBox from './FactureBox.svelte';
	import ProduitBox from './ProduitBox.svelte';
	import SearchInput from './SearchInput.svelte';
	import Trie from './Trie.svelte';
	let triesFactures = ['Date', 'En attente', 'NT', 'Credit', 'Payer'];
	let triesProduits = ['Tout', 'Existant', 'Date', 'NT', 'Fini'];

	let isFetching = $state(false);
</script>

<div class="flex rounded-xl border-2 border-cyan-100 p-3 bg-white shadow-md shadow-neutral-300/50">
	<div class=" flex w-2/3 flex-col gap-2 pr-3">
		<h1>~ FACTURES</h1>
		<SearchInput
			SearchName="searchVoice"
			placeholder="Numero de facture ou Client ou Date"
			searchId="search"
		/>
		<div class=" flex gap-3">
			<Trie options={triesFactures} direction="vertical" />
			<ButtonFetching title="N. Facture" {isFetching} color="bg-green-500 text-white font-semibold" />
		</div>
		<div>
			<FactureBox />
		</div>
	</div>
	<div class=" flex w-1/3 flex-col gap-2 border-l-2 border-neutral-400 pl-3">
		<h1>~ PRODUITS</h1>
		<SearchInput SearchName="searchVoice" placeholder="Le nom du produit" searchId="search" />
		<Trie options={triesProduits} direction="vertical" />
		<div>
			<ProduitBox />
		</div>
	</div>
</div>

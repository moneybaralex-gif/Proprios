export function extrairePublicIds(urls: string[]): string[] {
	return urls
		.map((url) => {
			try {
				// 1. On sépare la chaîne au niveau de "/upload/"
				const parts = url.split('/upload/');
				if (parts.length < 2) return ''; // Ce n'est pas une URL Cloudinary valide

				let chemin = parts[1]; // ex: "v1691234567/produits/images/mon-produit.jpg"

				// 2. On retire le numéro de version s'il existe (commence par "v", suivi de chiffres, suivi de "/")
				if (chemin.match(/^v\d+\//)) {
					chemin = chemin.replace(/^v\d+\//, ''); // ex: "produits/images/mon-produit.jpg"
				}

				// 3. On cherche le dernier point pour retirer l'extension (.jpg, .png...)
				const dernierPoint = chemin.lastIndexOf('.');
				if (dernierPoint !== -1) {
					chemin = chemin.substring(0, dernierPoint); // ex: "produits/images/mon-produit"
				}

				return chemin;
			} catch (error) {
				console.error('Erreur lors de la découpe de l\'URL:', url, error);
				return ''; // Retourne une chaîne vide en cas d'erreur
			}
		})
		// 4. On filtre pour enlever les éventuels résultats vides (en cas d'URL invalide)
		.filter((id) => id !== '');
}
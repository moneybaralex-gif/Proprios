// src/lib/utils/confetti.ts
import confetti from 'canvas-confetti';

// Petite fonction utilitaire pour générer un nombre aléatoire
function randomInRange(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

// La fonction principale d'animation
export function lancerFeuArtifice() {
	const duration = 3 * 1000; // L'animation dure 3 secondes (3000 ms)
	const animationEnd = Date.now() + duration;
	
	// zIndex: 10000 permet d'être sûr que les confettis passent au-dessus de tout (modales, navbar...)
	const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 }; 

	// On crée un intervalle qui tire des confettis toutes les 250ms
	const interval = setInterval(function () {
		const timeLeft = animationEnd - Date.now();

		// Si le temps est écoulé, on arrête l'intervalle
		if (timeLeft <= 0) {
			return clearInterval(interval);
		}

		// Plus le temps passe, moins il y a de particules
		const particleCount = 50 * (timeLeft / duration);

		// Tir depuis le côté GAUCHE
		confetti(
			Object.assign({}, defaults, {
				particleCount,
				origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
			})
		);

		// Tir depuis le côté DROIT
		confetti(
			Object.assign({}, defaults, {
				particleCount,
				origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
			})
		);
	}, 250);
}



export function lancerConfettis() {
    confetti({
        particleCount: 150, // Nombre de confettis
        spread: 70,         // L'angle d'éparpillement
        origin: { y: 0.6 }, // D'où ça part (0.6 = légèrement en dessous du milieu)
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
    });
}
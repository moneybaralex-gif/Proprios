import { browser } from '$app/environment';

export type NetworkQuality = 'good' | 'poor' | 'offline';

export function useNetworkStatus() {
    let quality = $state<NetworkQuality>('good');
    let latency = $state<number | null>(null);
    let isTesting = $state(false); // Permet d'afficher un loader pendant le test

    const POOR_CONNECTION_THRESHOLD = 800; //  Au-delà de 800ms, on considère que c'est lent

    // Fonction exportée qui retourne une promesse avec le résultat du test
    async function testConnection(): Promise<NetworkQuality> {
        if (!browser) return 'good';

         // Si le navigateur sait déjà qu'il n'y a pas de Wi-Fi/4G
        if (!navigator.onLine) {
            quality = 'offline';
            latency = null;
            return 'offline';
        }

        isTesting = true;
        // On donne max 3 secondes au serveur pour répondre
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); 
        const start = performance.now();

        try {
            // Requête vers votre serveur avec anti-cache
            const response = await fetch(`/api/ping?t=${Date.now()}`, {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-store'
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const currentLatency = Math.round(performance.now() - start);
                latency = currentLatency;
                 // Définir la qualité en fonction du temps de réponse
                quality = currentLatency > POOR_CONNECTION_THRESHOLD ? 'poor' : 'good';
            } else {
                quality = 'offline';
                latency = null;
            }
        } catch (error) {
            console.log(error);
            
            clearTimeout(timeoutId);
            quality = 'offline';
            latency = null;
        } finally {
            isTesting = false;
        }

        return quality;
    }

    $effect(() => {
        if (!browser) return;

        // Test initial au chargement de la page (optionnel mais recommandé)
        testConnection();

        // On garde juste les écouteurs natifs car ils ne coûtent aucune ressource
        // et permettent de détecter instantanément si l'utilisateur coupe son Wi-Fi
        const handleOffline = () => {
            quality = 'offline';
            latency = null;
        };
        const handleOnline = () => testConnection();

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        // 1. Écouter les changements online/offline du navigateur
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    });

    return {
        get quality() { return quality; },
        get latency() { return latency; },
        get isOnline() { return quality !== 'offline'; },
        get isTesting() { return isTesting; },
        // On exporte la fonction pour pouvoir l'appeler depuis le composant !
        testConnection 
    };
}
// src/lib/services/notification.svelte.ts

export interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

class NotificationService {

    #notifications = $state<Notification[]>([]);

    get toutes() {
        return this.#notifications;
    }

    ajouter(message: string, type: Notification['type'] = 'info', duree = 4000) {
        const id = crypto.randomUUID();
        
        this.#notifications.push({ id, message, type });

        setTimeout(() => {
            this.supprimer(id);
        }, duree);
    }

    supprimer(id: string) {
        this.#notifications = this.#notifications.filter((n) => n.id !== id);
    }
}

export const toast = new NotificationService();
import { PUBLIC_WS_URL } from '$env/static/public';

class WebSocketService {
    ws = $state<WebSocket | null>(null);
    hasUnread = $state(false);
    
    connect() {
        if (typeof window === 'undefined') return;
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
        
        const url = PUBLIC_WS_URL || `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:3001/ws`;
        const socket = new WebSocket(url);
        
        socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'message.created') {
                    if (window.location.pathname !== '/chat' && window.location.pathname !== '/admin/messages') {
                        this.hasUnread = true;
                    }
                }
            } catch (e) {
                console.log(e);
                
            }
        });
        
        socket.addEventListener('close', () => {
            this.ws = null;
            setTimeout(() => this.connect(), 5000);
        });
        
        this.ws = socket;
    }
}

export const wsService = new WebSocketService();
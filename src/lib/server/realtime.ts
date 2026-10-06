import { WS_SERVER_URL } from '$env/static/private';

export type RealtimeEvent = {
  type: string;
  entity?: string;
  id?: string;
  payload?: unknown;
  targetUserId?: string;
};

export async function publishRealtime(event: RealtimeEvent) {
  try {
    const base = WS_SERVER_URL || 'http://localhost:3001';
    await fetch(`${base.replace(/\/$/, '')}/publish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-realtime-secret': process.env.REALTIME_SECRET ?? '' },
      body: JSON.stringify(event)
    });
  } catch (error) {
    console.warn('[realtime] publish failed:', error);
  }
}

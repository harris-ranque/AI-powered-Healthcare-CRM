import { io } from 'socket.io-client';

// Force the websocket transport so the connection skips socket.io's initial
// HTTP long-polling handshake, which would otherwise hit the ngrok free-tier
// browser interstitial (custom headers can't be set on a browser WS handshake).
export const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
  transports: ['websocket'],
});

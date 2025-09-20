import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function createNewsClient({ url, token, onMessage }) {
    const client = new Client({
        webSocketFactory: () => new SockJS(token ? `${url}?token=${encodeURIComponent(token)}` : url),
        reconnectDelay: 2000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
            client.subscribe('/topic/news', (msg) => {
                try {
                    onMessage(JSON.parse(msg.body));
                } catch (e) {
                    onMessage(msg.body);
                }
            });
        },
        onStompError: (frame) => console.error('STOMP error:', frame.headers, frame.body),
        onWebSocketClose: (evt) => console.warn('WS closed:', evt.code, evt.reason),
    });

    client.activate();
    return client;
}

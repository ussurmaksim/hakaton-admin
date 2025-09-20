import {makeAutoObservable, runInAction} from 'mobx';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export class NewsStore {
    items = [];
    isConnected = false;
    isConnecting = false;
    error = null;
    _client = null;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    connect({ url, token, topic = '/topic/news', maxItems = 200, useSockJS = true } = {}) {
        // 💡 жёсткие проверки, чтобы не спамить подключениями
        if (this.isConnected || this.isConnecting || this._client) return;

        this.isConnecting = true;
        this.error = null;

        const onMessage = (msg) => {
            let payload = msg.body;
            try { payload = JSON.parse(msg.body); } catch {}
            runInAction(() => {
                this.items.unshift(payload);
                if (this.items.length > maxItems) this.items.length = maxItems;
            });
        };

        const client = new Client({
            ...(useSockJS
                ? { webSocketFactory: () => new SockJS(token ? `${url}?token=${encodeURIComponent(token)}` : url) }
                : { brokerURL: url.replace(/^http/, 'ws'), connectHeaders: token ? { 'Sec-WebSocket-Protocol': token } : {} }),
            reconnectDelay: 0, // ❌ убираем автопереподключение, чтобы не было спама
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            onConnect: () => {
                client.subscribe(topic, onMessage);
                runInAction(() => {
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.error = null;
                });
            },
            onStompError: (frame) => {
                runInAction(() => {
                    this.error = frame.body || frame.headers['message'] || 'STOMP error';
                    this.isConnected = false;
                    this.isConnecting = false;
                });
            },
            onWebSocketClose: (evt) => {
                runInAction(() => {
                    this.error = evt?.reason || `WS closed (code ${evt?.code ?? '—'})`;
                    this.isConnected = false;
                    this.isConnecting = false;
                });
            },
        });

        this._client = client;
        client.activate();
    }

    disconnect() {
        if (this._client) {
            this._client.deactivate();
            this._client = null;
        }
        this.isConnected = false;
        this.isConnecting = false;
    }

    // 🔁 ручной реконнект: аккуратно закроем текущее и пересоздадим
    reconnect(opts) {
        this.disconnect();
        // малюсенькая пауза, чтобы SockJS/WS точно освободил ресурсы
        setTimeout(() => this.connect(opts), 300);
    }

    clear() {
        this.items = [];
    }
}

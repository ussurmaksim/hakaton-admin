import axios from 'axios';

export default class AdminNodesService {
    constructor(base = import.meta.env.VITE_API_URL) {
        this.base = (base || '').replace(/\/+$/, '');
    }

    // Собираем URL вида: http://gateway/node-a/actuator/health
    url(node, path) {
        const clean = String(path || '').startsWith('/') ? path : `/${path}`;
        return `${this.base}/${node}${clean}`;
    }

    // ----- REST -----

    // Стандартный Spring Boot Actuator
    getActuatorHealth(node, signal) {
        // через gateway: /node-*/actuator/health
        return axios.get(this.url(node, '/actuator/health'), { signal }).then(r => r.data);
    }

    // Публичный ping узла: { nodeId, regionCode, ip, peers[], status:"OK" }
    getPublicPing(node, signal) {
        // через gateway: /node-*/api/public/ping
        return axios.get(this.url(node, '/api/public/ping'), { signal }).then(r => r.data);
    }

    // Локальный узел сам опрашивает соседей и отдаёт их health
    getPeersHealth(node, signal) {
        // через gateway: /node-*/api/public/peers/health
        return axios.get(this.url(node, '/api/public/peers/health'), { signal }).then(r => r.data);
    }

    // ----- SSE: /api/public/events -----
    // Возвращает функцию отписки () => void
    openEvents(node, { onAny, onPing, onOpen, onError } = {}) {
        // через gateway: /node-*/api/public/events
        const url = this.url(node, '/api/public/events');
        const es = new EventSource(url, { withCredentials: false });

        es.onopen = () => {
            onOpen && onOpen(node);
        };

        es.onmessage = (ev) => {
            // Пытаемся парсить JSON всегда — приходят PING/incident/camera-alert и т.д.
            let payload = null;
            try {
                payload = ev?.data ? JSON.parse(ev.data) : null;
            } catch {
                /* ignore parse error */
            }

            onAny && onAny(node, payload, ev);

            // Нормализованный признак ping
            const t = (payload && (payload.type || payload.kind || payload.event || payload.name)) || ev?.type;
            if (String(t || '').toUpperCase().includes('PING')) {
                onPing && onPing(node, payload);
            }
        };

        es.onerror = (err) => {
            onError && onError(node, err);
            // EventSource сам будет пытаться реконнектиться.
        };

        return () => {
            try { es.close(); } catch {}
        };
    }
}
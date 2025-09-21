import { useEffect, useMemo, useRef, useState, createContext } from 'react';
import { observer } from 'mobx-react-lite';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useStore } from '@/shared/hooks/useStore.js';

export const SocketContext = createContext(null);

export const SocketProvider = observer(({ children }) => {
    const { newsStore, incidentStore, sensors, aiDigest } = useStore();

    const [connected, setConnected] = useState(false);
    const stompRef = useRef(null);
    const sockRef = useRef(null);
    const retryRef = useRef({ timer: null, explicitlyClosed: false, attempt: 0 });

    // ===== pending RPC =====
    const pendingRef = useRef(new Map()); // corrId -> {resolve, reject, timer, match?}

    const base = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
    const node = import.meta.env.VITE_API_NODE || 'node-a';
    const rawWsUrl = `${base}/${node}/ws`;
    const token = localStorage.getItem('accessToken') || '';
    const wsUrl = token ? `${rawWsUrl}?token=${encodeURIComponent(token)}` : rawWsUrl;

    const clearRetryTimer = () => { if (retryRef.current.timer) { clearTimeout(retryRef.current.timer); retryRef.current = { ...retryRef.current, timer: null }; } };
    const scheduleReconnect = () => {
        if (retryRef.current.explicitlyClosed) return;
        const attempt = (retryRef.current.attempt = (retryRef.current.attempt || 0) + 1);
        const delay = Math.min(30000, 1000 * Math.pow(2, attempt - 1));
        clearRetryTimer();
        retryRef.current.timer = setTimeout(connect, delay);
    };

    const normalize = (payload, arrayKey) => {
        if (!payload) return [];
        if (arrayKey && Array.isArray(payload[arrayKey])) return payload[arrayKey];
        if (Array.isArray(payload)) return payload;
        return [payload];
    };

    const onMessageIncidents = (message) => {
        try {
            const p = JSON.parse(message.body);
            const items = normalize(p, 'incidents');
            if (items.length) incidentStore.setIncidents(items);
        } catch (e) { console.warn('bad incident payload', e); }
    };

    const onMessageNews = (message) => {
        try {
            const p = JSON.parse(message.body);
            const items = normalize(p, 'news');
            if (items.length) newsStore.setNews(items);
            aiDigest?.mergeFromNewsWs?.(items);
        } catch (e) { console.warn('bad news payload', e); }
    };

    const onMessageSensors = (message) => {
        try {
            const p = JSON.parse(message.body);
            const items = normalize(p, 'sensors');
            if (items.length) sensors.mergeFromWs(items);
        } catch (e) { console.warn('bad sensors payload', e); }
    };

    // ЕДИНЫЙ роутер для персональных ответов
    const onUserQueue = (message) => {
        try {
            const body = JSON.parse(message.body);
            const headers = message.headers || {};
            const corr = body?.correlationId || headers['x-correlation-id'] || headers['correlation-id'];
            // match по sensorId, если корреляции нет
            const sensorId = body?.sensorId ?? body?.id;

            // 1) сперва по корреляции
            if (corr && pendingRef.current.has(corr)) {
                const p = pendingRef.current.get(corr);
                pendingRef.current.delete(corr);
                clearTimeout(p.timer);
                try { p.resolve(body); } catch {}
                return;
            }

            // 2) затем — все, кто ждёт по match()
            for (const [key, p] of Array.from(pendingRef.current.entries())) {
                try {
                    if (p.match && p.match(body, headers)) {
                        pendingRef.current.delete(key);
                        clearTimeout(p.timer);
                        p.resolve(body);
                    }
                } catch {}
            }
        } catch (e) {
            console.warn('bad /user/queue payload', e);
        }
    };

    const routeAggregated = (message) => {
        try {
            const p = JSON.parse(message.body);
            if (Array.isArray(p?.incidents)) return onMessageIncidents({ body: JSON.stringify(p) });
            if (Array.isArray(p?.news)) return onMessageNews({ body: JSON.stringify(p) });
            if (Array.isArray(p?.sensors)) return onMessageSensors({ body: JSON.stringify(p) });

            if (Array.isArray(p) && p.length) {
                const smp = p[0];
                if (smp?.level || smp?.kind) return onMessageIncidents({ body: JSON.stringify({ incidents: p }) });
                if (smp?.title || smp?.body) return onMessageNews({ body: JSON.stringify({ news: p }) });
                if (smp?.sensorId || smp?.type || smp?.region || smp?.status) return onMessageSensors({ body: JSON.stringify({ sensors: p }) });
            }
        } catch (e) { console.warn('bad /topic/all payload', e); }
    };

    const cleanUp = () => {
        // отменяем все ожидающие промисы
        for (const [key, p] of pendingRef.current.entries()) {
            try { clearTimeout(p.timer); p.reject?.(new Error('WS disconnected')); } catch {}
        }
        pendingRef.current.clear();

        clearRetryTimer();
        try { stompRef.current?.disconnect?.(() => {}); } catch {}
        try { sockRef.current?.close?.(); } catch {}
        stompRef.current = null;
        sockRef.current = null;
        setConnected(false);
    };

    const connect = () => {
        if (stompRef.current || sockRef.current) cleanUp();
        retryRef.current.explicitlyClosed = false;

        const sock = new SockJS(wsUrl, null, {
            transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
            transportOptions: { 'xhr-streaming': { withCredentials: true }, 'xhr-polling': { withCredentials: true } },
            timeout: 10000,
        });

        const stomp = Stomp.over(sock);
        stomp.debug = () => {};
        stomp.heartbeat.outgoing = 20000;
        stomp.heartbeat.incoming = 0;

        const onConnect = () => {
            retryRef.current.attempt = 0;
            setConnected(true);

            [
                { topic: '/topic/incidents', handler: onMessageIncidents },
                { topic: '/topic/news', handler: onMessageNews },
                { topic: '/topic/sensors', handler: onMessageSensors },
            ].forEach(({ topic, handler }) => {
                try { stomp.subscribe(topic, handler); } catch (e) { console.warn('subscribe failed', topic, e); }
            });

            // агрегирующий канал
            try { stomp.subscribe('/topic/all', routeAggregated); } catch (e) { console.warn('subscribe /topic/all failed', e); }

            // ЕДИНАЯ постоянная подписка на user-очереди
            try { stomp.subscribe('/user/queue/sensors/policy', onUserQueue); } catch (e) { console.warn('subscribe /user/queue/sensors/policy failed', e); }
            try { stomp.subscribe('/user/queue/reply', onUserQueue); } catch (e) { /* optional */ }
        };

        const onError = (err) => { console.warn('STOMP error:', err); setConnected(false); scheduleReconnect(); };
        sock.onclose = (evt) => { if (retryRef.current.explicitlyClosed) return; console.warn('SockJS closed:', evt?.code, evt?.reason); setConnected(false); scheduleReconnect(); };

        const connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        try { stomp.connect(connectHeaders, onConnect, onError); } catch (e) { console.warn('connect threw:', e); scheduleReconnect(); }

        stompRef.current = stomp;
        sockRef.current = sock;
    };

    useEffect(() => { connect(); return () => { retryRef.current.explicitlyClosed = true; cleanUp(); }; }, [wsUrl]); // eslint-disable-line

    const value = useMemo(() => ({
        connected,
        stomp: stompRef.current,

        subscribe: (topic, handler) => {
            if (!stompRef.current) return () => {};
            try {
                const sub = stompRef.current.subscribe(topic, handler);
                return () => { try { sub?.unsubscribe?.(); } catch {} };
            } catch (e) { console.warn('subscribe failed', topic, e); return () => {}; }
        },

        send: (destination, body, headers = {}) => {
            if (!stompRef.current || !connected) return false;
            try {
                const payload = typeof body === 'string' ? body : JSON.stringify(body);
                stompRef.current.send(destination, headers, payload);
                return true;
            } catch (e) { console.warn('send failed', e); return false; }
        },

        /** RPC: регистрируем ожидание в pendingMap и ждём onUserQueue */
        request: ({ destination, body, timeoutMs = 4000, match }) =>
            new Promise((resolve, reject) => {
                if (!stompRef.current || !connected) return reject(new Error('WS not connected'));
                const corr = Math.random().toString(36).slice(2);
                const timer = setTimeout(() => {
                    if (pendingRef.current.has(corr)) pendingRef.current.delete(corr);
                    reject(new Error('WS request timeout'));
                }, timeoutMs);

                pendingRef.current.set(corr, { resolve, reject, timer, match });

                try {
                    const headers = { 'x-correlation-id': corr };
                    const payload = typeof body === 'string' ? body : JSON.stringify({ ...body, correlationId: corr });
                    stompRef.current.send(destination, headers, payload);
                } catch (e) {
                    clearTimeout(timer);
                    pendingRef.current.delete(corr);
                    reject(e);
                }
            }),

        reconnect: () => { retryRef.current.explicitlyClosed = false; retryRef.current.attempt = 0; connect(); },
        disconnect: () => { retryRef.current.explicitlyClosed = true; cleanUp(); },
    }), [connected]);

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
});

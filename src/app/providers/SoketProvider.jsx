import { useEffect, useMemo, useRef, useState, createContext } from 'react';
import { observer } from 'mobx-react-lite';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useStore } from '@/shared/hooks/useStore.js';

export const SocketContext = createContext(null);

export const SocketProvider = observer(({ children }) => {
    const { newsStore, incidentStore, newMapStore } = useStore();

    const [connected, setConnected] = useState(false);

    const stompRef = useRef(null);
    const sockRef  = useRef(null);

    const retryRef = useRef({
        timer: null,
        explicitlyClosed: false,
        attempt: 0, // для экспоненциального бэкофа
    });

    // VITE_API_URL = https://<gateway-domain>
    // VITE_API_NODE = node-a | node-b | node-c
    const base = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
    const node = import.meta.env.VITE_API_NODE || 'node-a';

    const rawWsUrl = `${base}/${node}/ws`;

    // добавим токен в query — на случай, если гейт так ждёт
    const token = localStorage.getItem('accessToken') || '';
    const wsUrl = token ? `${rawWsUrl}?token=${encodeURIComponent(token)}` : rawWsUrl;

    const clearRetryTimer = () => {
        if (retryRef.current.timer) {
            clearTimeout(retryRef.current.timer);
            retryRef.current.timer = null;
        }
    };

    const scheduleReconnect = () => {
        if (retryRef.current.explicitlyClosed) return;

        const attempt = retryRef.current.attempt = (retryRef.current.attempt || 0) + 1;
        const delay = Math.min(30000, 1000 * Math.pow(2, attempt - 1)); // 1s,2s,4s,...,30s

        clearRetryTimer();
        retryRef.current.timer = setTimeout(() => {
            connect(); // ⬅️ реальный повторный connect
        }, delay);
    };

    const onMessageIncidents = (message) => {
        try {
            const incident = JSON.parse(message.body);
            incidentStore.setIncidents([incident]);
            // если нужно — ещё и на карту
            // newMapStore?.pushIncident(incident)
        } catch (e) {
            console.warn('bad incident payload', e);
        }
    };

    const onMessageNews = (message) => {
        try {
            const news = JSON.parse(message.body);
            newsStore.setNews([news]);
        } catch (e) {
            console.warn('bad news payload', e);
        }
    };

    const onMessageSensors = (message) => {
        try {
            const sensor = JSON.parse(message.body);
            console.log('New sensor data:', sensor);
        } catch (e) {
            console.warn('bad sensor payload', e);
        }
    };

    const cleanUp = () => {
        clearRetryTimer();
        try {
            // корректный дисконнект STOMP
            stompRef.current?.disconnect?.(() => {});
        } catch {}
        try {
            // закрыть сам SockJS-транспорт
            sockRef.current?.close?.();
        } catch {}

        stompRef.current = null;
        sockRef.current = null;
        setConnected(false);
    };

    const connect = () => {
        // если уже есть клиент — сначала закроем
        if (stompRef.current || sockRef.current) cleanUp();

        retryRef.current.explicitlyClosed = false;

        // важные опции для CORS + SockJS
        const sock = new SockJS(wsUrl, null, {
            transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
            transportOptions: {
                'xhr-streaming': { withCredentials: true },
                'xhr-polling'  : { withCredentials: true },
            },
            timeout: 10000,
        });

        const stomp = Stomp.over(sock);
        stomp.debug = () => {};

        // heartbeats
        stomp.heartbeat.outgoing = 20000;
        stomp.heartbeat.incoming = 0;

        const onConnect = () => {
            retryRef.current.attempt = 0; // сбрасываем бэкоф
            setConnected(true);

            // подписки
            stomp.subscribe('/topic/all', onMessageIncidents);
            stomp.subscribe('/topic/all',      onMessageNews);
            stomp.subscribe('/topic/all',   onMessageSensors);
            // если на бэке есть агрегирующий топик:
            // stomp.subscribe('/topic/all', (m) => { ... });
        };

        const onError = (err) => {
            console.warn('STOMP error:', err);
            setConnected(false);
            scheduleReconnect();
        };

        // сетапим обработчик закрытия транспорта (важно!)
        sock.onclose = (evt) => {
            if (retryRef.current.explicitlyClosed) return;
            console.warn('SockJS closed:', evt?.code, evt?.reason);
            setConnected(false);
            scheduleReconnect();
        };

        // заголовок Authorization — если бэк его принимает
        const connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        try {
            stomp.connect(connectHeaders, onConnect, onError);
        } catch (e) {
            console.warn('connect threw:', e);
            scheduleReconnect();
        }

        stompRef.current = stomp;
        sockRef.current = sock;
    };

    useEffect(() => {
        connect();

        return () => {
            retryRef.current.explicitlyClosed = true;
            cleanUp();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wsUrl]); // пересоздание при смене узла/домена/токена в query

    const value = useMemo(
        () => ({
            connected,
            stomp: stompRef.current,
            newsStore,
            incidentStore,
            newMapStore,
            reconnect: () => {
                retryRef.current.explicitlyClosed = false;
                retryRef.current.attempt = 0;
                connect();
            },
            disconnect: () => {
                retryRef.current.explicitlyClosed = true;
                cleanUp();
            },
            send: (destination, body, headers = {}) => {
                // helper на отправку (если потребуется администраторам)
                if (!stompRef.current || !connected) return false;
                try {
                    const payload = typeof body === 'string' ? body : JSON.stringify(body);
                    stompRef.current.send(destination, headers, payload);
                    return true;
                } catch (e) {
                    console.warn('send failed', e);
                    return false;
                }
            },
        }),
        [connected, newsStore, incidentStore, newMapStore]
    );

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
});

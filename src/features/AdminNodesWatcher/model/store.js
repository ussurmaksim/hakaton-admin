// src/features/AdminNodes/model/store.js
import { makeAutoObservable, runInAction } from 'mobx';
import AdminNodesService from '../api/AdminNodesService.js';

// Тонкая настройка интервалов
const HEARTBEAT_TTL_MS = 45_000;  // если PING не приходил дольше — считаем, что узел "молчит"
const POLL_PING_MS     = 20_000;  // период опроса /api/public/ping
const POLL_PEERS_MS    = 30_000;  // период опроса /api/public/peers/health
const POLL_HEALTH_MS   = 20_000;  // период опроса /actuator/health (если включишь)

// Использовать ли опрос actuator (можно выключить, если не нужен)
const USE_ACTUATOR = false;

export class NodesStore {
    // nodeId -> состояние ноды
    nodes = new Map(); // { nodeId, ip, regionCode, peers[], lastPingTs, actuator, publicStatus, peersHealth[], sseConnected, online, error }
    _timers = new Map();   // nodeId -> { ping, peers, health? }
    _sseUnsubs = new Map(); // nodeId -> () => void
    _svc;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
        this._svc = new AdminNodesService();
    }

    // Отсортированный список для UI
    get list() {
        return Array.from(this.nodes.values()).sort((a, b) => a.nodeId.localeCompare(b.nodeId));
    }

    // Рассчитать агрегированный статус карточки: OK / DEGRADED / DOWN
    calcStatus(n) {
        const now = Date.now();
        const alive = n.lastPingTs && (now - n.lastPingTs) < HEARTBEAT_TTL_MS;

        // Если actuator не опрашивается — считаем только по alive
        if (!USE_ACTUATOR) {
            return alive ? 'OK' : 'DOWN';
        }

        const actuatorUp = (n.actuator?.status || n.actuator) === 'UP';
        if (alive && actuatorUp) return 'OK';
        if (!alive && !actuatorUp) return 'DOWN';
        return 'DEGRADED';
    }

    // ----- lifecycle -----

    start(nodes = ['node-a', 'node-b', 'node-c']) {
        nodes.forEach((nodeId) => {
            if (!this.nodes.has(nodeId)) {
                this.nodes.set(nodeId, {
                    nodeId,
                    ip: null,
                    regionCode: null,
                    peers: [],
                    lastPingTs: 0,
                    actuator: null,
                    publicStatus: null,
                    peersHealth: [],
                    sseConnected: false,
                    online: null,    // true / false / null (ещё не знаем)
                    error: null,
                });
            }
            this._startPolling(nodeId);
            this._openSse(nodeId);
        });
    }

    stop() {
        // Останавливаем таймеры
        for (const t of this._timers.values()) {
            try { clearInterval(t.ping); } catch {}
            try { clearInterval(t.peers); } catch {}
            try { clearInterval(t.health); } catch {}
        }
        this._timers.clear();

        // Гасим SSE
        for (const unsub of this._sseUnsubs.values()) {
            try { unsub(); } catch {}
        }
        this._sseUnsubs.clear();
    }

    // ----- internal -----

    _startPolling(nodeId) {
        // Сначала очистим старые интервалы (если были)
        const old = this._timers.get(nodeId);
        if (old) {
            try { clearInterval(old.ping); } catch {}
            try { clearInterval(old.peers); } catch {}
            try { clearInterval(old.health); } catch {}
        }

        // Первый мгновенный прогон
        this._pollPublicPing(nodeId);
        this._pollPeers(nodeId);
        if (USE_ACTUATOR) this._pollActuator(nodeId);

        // Периодические прогоны
        const ping = setInterval(() => this._pollPublicPing(nodeId), POLL_PING_MS);
        const peers = setInterval(() => this._pollPeers(nodeId), POLL_PEERS_MS);
        const record = { ping, peers };
        if (USE_ACTUATOR) {
            record.health = setInterval(() => this._pollActuator(nodeId), POLL_HEALTH_MS);
        }

        this._timers.set(nodeId, record);
    }

    _openSse(nodeId) {
        // Закрыть прежний, если был
        const prev = this._sseUnsubs.get(nodeId);
        if (prev) { try { prev(); } catch {} }

        const unsub = this._svc.openEvents(nodeId, {
            onOpen: () => runInAction(() => {
                const n = this.nodes.get(nodeId);
                if (n) { n.sseConnected = true; n.online = true; }
            }),
            onAny: () => { /* можно логировать сырой поток */ },
            onPing: () => runInAction(() => {
                const n = this.nodes.get(nodeId);
                if (n) { n.lastPingTs = Date.now(); n.online = true; }
            }),
            onError: () => runInAction(() => {
                const n = this.nodes.get(nodeId);
                if (n) n.sseConnected = false; // ONLINE решаем по REST-опросам
            }),
        });

        this._sseUnsubs.set(nodeId, unsub);
    }

    // ----- REST pollers -----

    async _pollPublicPing(nodeId) {
        try {
            const data = await this._svc.getPublicPing(nodeId);
            runInAction(() => {
                const n = this.nodes.get(nodeId);
                if (!n) return;
                n.publicStatus = data?.status || null;
                n.ip = data?.ip ?? n.ip;
                n.regionCode = data?.regionCode ?? n.regionCode;
                n.peers = Array.isArray(data?.peers) ? data.peers : n.peers;
                n.lastPingTs = Date.now();
                n.online = true;             // ✅ был успешный ответ
                n.error = null;
            });
        } catch (e) {
            runInAction(() => {
                const n = this.nodes.get(nodeId);
                if (!n) return;
                n.publicStatus = 'DOWN';
                n.online = false;            // ❌ запрос не удался — считаем OFFLINE
                n.error = e?.message || 'public ping failed';
            });
        }
    }

    async _pollPeers(nodeId) {
        try {
            const data = await this._svc.getPeersHealth(nodeId);
            runInAction(() => {
                const n = this.nodes.get(nodeId);
                if (!n) return;
                n.peersHealth = Array.isArray(data) ? data : [];
                n.online = true;             // ответ пришёл — online
            });
        } catch (e) {
            runInAction(() => {
                const n = this.nodes.get(nodeId);
                if (!n) return;
                n.peersHealth = [];
                n.online = false;            // ошибка — offline
                n.error = e?.message || 'peers health failed';
            });
        }
    }

    async _pollActuator(nodeId) {
        try {
            const data = await this._svc.getActuatorHealth(nodeId);
            runInAction(() => {
                const n = this.nodes.get(nodeId);
                if (!n) return;
                n.actuator = data;           // обычно { status: 'UP' }
                n.online = true;             // успешный ответ — online
            });
        } catch (e) {
            runInAction(() => {
                const n = this.nodes.get(nodeId);
                if (!n) return;
                n.actuator = { status: 'DOWN' };
                n.online = false;            // ошибка — offline
                n.error = e?.message || 'actuator failed';
            });
        }
    }
}

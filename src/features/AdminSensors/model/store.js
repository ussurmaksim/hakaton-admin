import { makeAutoObservable, runInAction } from 'mobx';
import SensorsService from '../api/SensorsService.js';

export class SensorsStore {
    _items = [];
    _isLoading = false;

    policyById = new Map();
    policyLoading = new Map();
    policyError = new Map();
    region = 'RU-MOW';

    constructor(root) {
        makeAutoObservable(this, {}, { autoBind: true });
        this.root = root;
    }

    get items() { return this._items; }
    get isLoading() { return this._isLoading; }

    async loadPublic() {
        this._isLoading = true;
        try {
            const res = await SensorsService.fetchPublic(this.region).catch(() => null);
            if (res?.data) {
                const arr = Array.isArray(res.data) ? res.data : [];
                runInAction(() => { this._items = upsertMany([], arr); });
            }
        } finally {
            runInAction(() => { this._isLoading = false; });
        }
    }

    initWs() {
        const socket = this.root.socket;
        if (!socket?.subscribe) return;

        this.unsubCreated?.(); this.unsubCreated = socket.subscribe('/topic/sensors/created', (msg) => {
            try { const sensor = JSON.parse(msg.body); runInAction(() => { this._items = upsertMany(this._items, [sensor]); }); }
            catch (e) { console.warn('bad created payload', e); }
        });

        this.unsubStatus?.(); this.unsubStatus = socket.subscribe('/topic/sensors/status', (msg) => {
            try {
                const status = JSON.parse(msg.body);
                runInAction(() => {
                    const i = this._items.findIndex(s => s.id === status.sensorId);
                    if (i >= 0) this._items[i] = { ...this._items[i], lastStatus: status };
                });
            } catch (e) { console.warn('bad status payload', e); }
        });

        // опционально: если бэк рассылает обновления политики в топик
        this.unsubPolicy?.(); this.unsubPolicy = socket.subscribe('/topic/sensors/policy', (msg) => {
            try { const p = JSON.parse(msg.body); if (p?.sensorId) runInAction(() => { this.policyById.set(p.sensorId, normalizePolicy(p)); }); }
            catch (e) { console.warn('bad policy payload', e); }
        });
    }

    destroyWs() {
        try { this.unsubCreated?.(); } catch {}
        try { this.unsubStatus?.(); } catch {}
        try { this.unsubPolicy?.(); } catch {}
        this.unsubCreated = this.unsubStatus = this.unsubPolicy = null;
    }

    mergeFromWs(list) {
        if (!Array.isArray(list) || !list.length) return;
        runInAction(() => { this._items = upsertMany(this._items, list); });
    }

    async registerSensor(dto) {
        const socket = this.root.socket;
        if (!socket?.send || !this.root.socket?.connected) throw new Error('WebSocket not connected');

        const payload = {
            ...dto,
            meta: typeof dto.meta === 'string' ? dto.meta : JSON.stringify(dto.meta ?? '{}'),
        };
        const ok = socket.send('/app/admin/sensors/register', payload);
        if (!ok) throw new Error('WS send failed');
        return { ok: true };
    }

    /** ===== политика: сначала WS, если таймаут — REST ===== */
    async getPolicy(sensorId) {
        this.policyLoading.set(sensorId, true);
        this.policyError.set(sensorId, null);

        try {
            // 1) попытка через WS
            const respWs = await this._tryWsRequest({
                destination: '/app/admin/sensors/policy/get',
                body: { sensorId },
                timeoutMs: 6000,
                match: (p) => (p?.sensorId ?? p?.id) === sensorId,
            });
            const payload = respWs ?? (await SensorsService.getPolicy(sensorId))?.data ?? null;

            const policy = normalizePolicy(payload);
            if (policy) this.policyById.set(sensorId, policy);
            return policy; // <— ВОЗВРАЩАЕМ САМУ ПОЛИТИКУ
        } catch (e) {
            this.policyError.set(sensorId, e?.message || 'Policy load error');
            throw e;
        } finally {
            this.policyLoading.set(sensorId, false);
        }
    }

    async savePolicy(sensorId, dto) {
        this.policyLoading.set(sensorId, true);
        this.policyError.set(sensorId, null);

        const payload = {
            sensorId,
            mode: dto.mode,
            alertAbove: toNumberOrNull(dto.alertAbove),
            warnAbove: toNumberOrNull(dto.warnAbove),
            clearBelow: toNumberOrNull(dto.clearBelow),
            ttlSec: toIntOrNull(dto.ttlSec),
        };

        try {
            // 1) попытка через WS
            const respWs = await this._tryWsRequest({
                destination: '/app/admin/sensors/policy/set',
                body: payload,
                timeoutMs: 6000,
                match: (p) => (p?.sensorId ?? p?.id) === sensorId,
            });
            const payloadOut = respWs ?? (await SensorsService.savePolicy(sensorId, payload))?.data ?? null;

            const policy = normalizePolicy(payloadOut);
            if (policy) this.policyById.set(sensorId, policy);
            return { ok: true, policy }; // <— policy внутри
        } catch (e) {
            this.policyError.set(sensorId, e?.message || 'Policy save error');
            throw e;
        } finally {
            this.policyLoading.set(sensorId, false);
        }
    }

    /** приватный помощник: безопасно пробует WS и возвращает payload либо null */
    async _tryWsRequest({ destination, body, timeoutMs, match }) {
        const socket = this.root.socket;
        if (!socket?.request || !this.root.socket?.connected) return null;
        try {
            const resp = await socket.request({ destination, body, timeoutMs, match });
            return resp ?? null;
        } catch {
            return null;
        }
    }
}

/** ===== helpers ===== */
const keyOf = (s) => s?.id ?? s?.sensorId ?? s?.externalId ?? null;
const upsertMany = (prev, arr) => {
    const byId = new Map(prev.map((x) => [keyOf(x), x]));
    for (const it of arr) {
        const k = keyOf(it);
        if (k == null) continue;
        byId.set(k, { ...(byId.get(k) || {}), ...it });
    }
    return Array.from(byId.values());
};
const toNumberOrNull = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const toIntOrNull = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };
const normalizePolicy = (p) => p ? ({
    sensorId: p.sensorId ?? p.id,
    mode: p.mode ?? 'AUTO',
    alertAbove: toNumberOrNull(p.alertAbove),
    warnAbove: toNumberOrNull(p.warnAbove),
    clearBelow: toNumberOrNull(p.clearBelow),
    ttlSec: toIntOrNull(p.ttlSec),
    ...p,
}) : null;

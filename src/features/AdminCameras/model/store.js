import { makeAutoObservable, runInAction } from 'mobx';
import CamerasService from '../api/CamerasService.js';

export class CamerasStore {
    _items = [];            // список камер со статусами
    _isLoading = false;

    policyById = new Map();
    policyLoading = new Map();
    policyError = new Map();

    alerts = []; // если бэк шлёт /topic/camera-alerts

    constructor(root) {
        makeAutoObservable(this, {}, { autoBind: true });
        this.root = root;
    }

    get items() { return this._items; }
    get isLoading() { return this._isLoading; }

    /** ===== начальная загрузка (REST public) ===== */
    async load() {
        this._isLoading = true;
        try {
            const res = await CamerasService.fetchStatus().catch(() => null);
            if (res?.data) {
                const arr = Array.isArray(res.data) ? res.data : [];
                runInAction(() => { this._items = upsertById([], arr); });
            }
        } finally {
            runInAction(() => { this._isLoading = false; });
        }
    }

    /** ===== WS подписки ===== */
    initWs() {
        const socket = this.root.socket;
        if (!socket?.subscribe) return;

        // обновления статуса камер
        this.unsubStatus?.(); this.unsubStatus = socket.subscribe('/topic/cameras/status', (msg) => {
            try {
                const payload = JSON.parse(msg.body);
                const list = Array.isArray(payload) ? payload : [payload];
                runInAction(() => { this._items = upsertById(this._items, list); });
            } catch (e) { console.warn('bad camera status payload', e); }
        });

        // (опц.) алерты от ИИ
        this.unsubAlerts?.(); this.unsubAlerts = socket.subscribe('/topic/camera-alerts', (msg) => {
            try {
                const a = JSON.parse(msg.body);
                runInAction(() => { this.alerts = [a, ...this.alerts].slice(0, 200); });
            } catch (e) { console.warn('bad camera alert payload', e); }
        });
    }

    destroyWs() {
        try { this.unsubStatus?.(); } catch {}
        try { this.unsubAlerts?.(); } catch {}
        this.unsubStatus = this.unsubAlerts = null;
    }

    /** ===== ручной мерж из SocketProvider, если придёт в /topic/all ===== */
    mergeFromWs(list) {
        if (!Array.isArray(list) || !list.length) return;
        runInAction(() => { this._items = upsertById(this._items, list); });
    }

    /** ===== Actions: WS → REST fallback ===== */
    async scanAll() {
        const ws = await this._tryWsRequest({
            destination: '/app/admin/camera/scan',
            body: { ts: Date.now() },
            timeoutMs: 6000,
        });
        if (ws) return { ok: true, via: 'ws' };
        await CamerasService.scanAll();
        return { ok: true, via: 'rest' };
    }

    async scanNow(cameraId) {
        const ws = await this._tryWsRequest({
            destination: '/app/admin/camera-ai/scan-now',
            body: { cameraId },
            timeoutMs: 6000,
            match: (p) => (p?.cameraId ?? p?.id) === cameraId,
        });
        if (ws) return { ok: true, via: 'ws', data: ws };
        const res = await CamerasService.scanNow(cameraId);
        return { ok: true, via: 'rest', data: res?.data };
    }

    async detect({ id, externalId, snapshotUrl, createIncident = true }) {
        const ws = await this._tryWsRequest({
            destination: '/app/admin/camera/detect',
            body: { id, externalId, snapshotUrl, createIncident },
            timeoutMs: 8000,
        });
        if (ws) return { ok: true, via: 'ws', data: ws };
        const res = await CamerasService.detect({ id, externalId, snapshotUrl, createIncident });
        return { ok: true, via: 'rest', data: res?.data };
    }

    /** ===== Policy: WS → REST fallback ===== */
    async getPolicy(cameraId) {
        this.policyLoading.set(cameraId, true);
        this.policyError.set(cameraId, null);
        try {
            const ws = await this._tryWsRequest({
                destination: '/app/admin/camera-policy/get',
                body: { cameraId },
                timeoutMs: 6000,
                match: (p) => (p?.cameraId ?? p?.id) === cameraId,
            });
            const payload = ws ?? (await CamerasService.getPolicy(cameraId))?.data ?? null;
            const policy = normalizePolicy(payload);
            if (policy) runInAction(() => { this.policyById.set(cameraId, policy); });
            return policy;
        } catch (e) {
            runInAction(() => { this.policyError.set(cameraId, e?.message || 'Policy load error'); });
            throw e;
        } finally {
            runInAction(() => { this.policyLoading.set(cameraId, false); });
        }
    }

    async savePolicy(cameraId, dto) {
        this.policyLoading.set(cameraId, true);
        this.policyError.set(cameraId, null);
        const body = {
            cameraId,
            enabled: !!dto.enabled,
            mode: dto.mode,
            intervalSec: intOrNull(dto.intervalSec),
            okRegex: dto.okRegex ?? null,
            hitRegex: dto.hitRegex ?? null,
            incidentKind: dto.incidentKind ?? null,
            incidentLevel: dto.incidentLevel ?? null,
            ttlSec: intOrNull(dto.ttlSec),
        };
        try {
            const ws = await this._tryWsRequest({
                destination: '/app/admin/camera-policy/set',
                body,
                timeoutMs: 8000,
                match: (p) => (p?.cameraId ?? p?.id) === cameraId,
            });
            const payload = ws ?? (await CamerasService.savePolicy(cameraId, body))?.data ?? null;
            const policy = normalizePolicy(payload);
            if (policy) runInAction(() => { this.policyById.set(cameraId, policy); });
            return { ok: true, policy };
        } catch (e) {
            runInAction(() => { this.policyError.set(cameraId, e?.message || 'Policy save error'); });
            throw e;
        } finally {
            runInAction(() => { this.policyLoading.set(cameraId, false); });
        }
    }

    /** ===== private: safe WS-RPC ===== */
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

/** helpers */
const idOf = (c) => c?.id ?? c?.cameraId ?? c?.externalId ?? null;
const upsertById = (prev, arr) => {
    const byId = new Map(prev.map((x) => [idOf(x), x]));
    for (const it of arr) {
        const k = idOf(it);
        if (k == null) continue;
        byId.set(k, { ...(byId.get(k) || {}), ...it });
    }
    return Array.from(byId.values());
};
const intOrNull = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
};
const normalizePolicy = (p) => p ? ({
    cameraId: p.cameraId ?? p.id,
    enabled: !!p.enabled,
    mode: p.mode ?? 'AUTO',
    intervalSec: intOrNull(p.intervalSec) ?? 60,
    okRegex: p.okRegex ?? '',
    hitRegex: p.hitRegex ?? '',
    incidentKind: p.incidentKind ?? 'FIRE',
    incidentLevel: p.incidentLevel ?? 'HIGH',
    ttlSec: intOrNull(p.ttlSec) ?? 900,
    ...p,
}) : null;

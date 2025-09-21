import { makeAutoObservable, runInAction } from 'mobx';
import AIDigestService from '../api/AIDigestService.js';

export class AIDigestStore {
    items = [];           // [{ id?, title?, message?, body?, ts?, region?, source:'AI' }, ...]
    isLoading = false;
    error = null;
    _seen = new Set();

    constructor(root) {
        makeAutoObservable(this, {}, { autoBind: true });
        this.root = root;
    }

    /** Initial load из /api/public/news?source=AI */
    async load(params = { page: 0, size: 50 }) {
        this.isLoading = true;
        this.error = null;
        try {
            const res = await AIDigestService.fetchAIDigests(params).catch(() => null);
            const raw = res?.data?.content ?? res?.data ?? [];
            const list = Array.isArray(raw) ? raw : [raw];
            runInAction(() => { this._merge(list); });
        } catch (e) {
            runInAction(() => { this.error = e?.message || 'Failed to load AI digests'; });
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    /** Пришло по WS в /topic/news или /topic/all — берём только source=AI */
    mergeFromNewsWs(list) {
        if (!Array.isArray(list) || !list.length) return;
        const ai = list.filter((x) => String(x?.source || '').toUpperCase() === 'AI');
        if (ai.length) this._merge(ai);
    }

    clear() {
        this.items = [];
        this._seen.clear();
    }

    /** private */
    _merge(arr) {
        const fresh = [];
        for (const it of arr) {
            if (!it) continue;
            const key =
                it.id ??
                it.externalId ??
                `${it.source}|${it.title ?? ''}|${it.ts ?? it.timestamp ?? ''}`;
            if (this._seen.has(key)) continue;
            this._seen.add(key);
            fresh.push(it);
        }
        // новые — вверх
        this.items = [...fresh, ...this.items].slice(0, 300);
    }
}

import { makeAutoObservable } from 'mobx';

export class IncidentFeedStore {
    items = [];
    _seen = new Set();

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    setIncidents(list) {
        if (!Array.isArray(list) || list.length === 0) return;
        const fresh = [];
        for (const it of list) {
            const key = it?.id ?? it?.externalId ?? `${it.kind}|${it.lat}|${it.lng}|${it.ts}`;
            if (!this._seen.has(key)) {
                this._seen.add(key);
                fresh.push(it);
            }
        }
        this.items = [...fresh, ...this.items].slice(0, 200);
    }

    clear() {
        this.items = [];
        this._seen.clear();
    }
}

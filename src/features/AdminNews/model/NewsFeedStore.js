import { makeAutoObservable } from 'mobx';

export class NewsFeedStore {
    items = [];
    _seen = new Set();

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    setNews(list) {
        if (!Array.isArray(list) || list.length === 0) return;
        const fresh = [];
        for (const it of list) {
            const key = it?.id ?? it?.ts ?? it?.title ?? JSON.stringify(it);
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

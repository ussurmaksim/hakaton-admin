// features/AdminNews/model/AdminStore.js
import { makeAutoObservable, runInAction } from 'mobx';
import NewsService from '../api/AdminNewsService.js';

export class NewsAdminStore {
    items = [];
    isLoading = false;
    isSubmitting = false;
    error = null;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    async load(params = { page: 0, size: 10 }) {
        this.isLoading = true;
        this.error = null;
        try {
            const res = await NewsService.getNews(params);
            runInAction(() => {
                // поддержка пагинированного/простого/JSONPlaceholder
                const raw = res.data?.content ?? res.data ?? [];
                this.items = Array.isArray(raw) ? raw : [raw];
            });
        } catch (e) {
            runInAction(() => { this.error = e?.response?.data || e.message; });
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    // dto = { title, message, severity, lat, lng, publishNow }
    async create(dto) {
        this.isSubmitting = true;
        this.error = null;
        try {
            await NewsService.createNews({
                title: dto.title,
                message: dto.message,
                severity: dto.severity,
                latitude: dto.lat ?? null,
                longitude: dto.lng ?? null,
            });

            if (dto.publishNow) {
                await NewsService.broadcastNews({
                    title: dto.title,
                    message: dto.message,
                    severity: dto.severity,
                    latitude: dto.lat ?? null,
                    longitude: dto.lng ?? null,
                });
            }

            await this.load();
            return true;
        } catch (e) {
            runInAction(() => { this.error = e?.response?.data || e.message; });
            return false;
        } finally {
            runInAction(() => { this.isSubmitting = false; });
        }
    }
}

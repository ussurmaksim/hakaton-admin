import { makeAutoObservable, runInAction } from 'mobx';
import NewsService from '../api/AdminNewsService.js';

export class NewsAdminStore {
    items = [];
    isSubmitting = false;
    error = null;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    async create(dto) {
        this.isSubmitting = true;
        this.error = null;
        try {
            await NewsService.createIncident({
                lat: dto.lat,
                lng: dto.lng,
                level: dto.level,
                kind: dto.kind,
                reason: dto.reason,
                region: dto.regionCode ?? dto.region,
            });
            return true;
        } catch (e) {
            runInAction(() => { this.error = e?.response?.data || e.message; });
            return false;
        } finally {
            runInAction(() => { this.isSubmitting = false; });
        }
    }
}

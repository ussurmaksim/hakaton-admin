import { makePublicRequest } from '@/shared/api/makePublicRequest.js';
import { makeRequest } from '@/shared/api/makeRequest.js';

class SensorsService {
    // начальная загрузка для списка — ПУБЛИЧНЫЙ эндпоинт
    fetchPublic(region) {
        return makePublicRequest({ url: '/sensors', method: 'GET', params: {region} });
    }

    // (опц.) административный список — если понадобится
    fetchAll() {
        return makeRequest({ url: '/sensors', method: 'GET' });
    }

    // REST-политика — как резерв (мы используем WS, но оставим методы)
    getPolicy(id) {
        return makeRequest({ url: `/sensors/${id}/policy`, method: 'GET' });
    }
    savePolicy(id, data) {
        return makeRequest({
            url: `/sensors/${id}/policy`,
            method: 'POST',
            data,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export default new SensorsService();

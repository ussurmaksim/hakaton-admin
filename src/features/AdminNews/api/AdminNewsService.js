// features/AdminNews/api/AdminNewsService.js
import { makeRequest } from '@/shared/api/makeRequest.js';

const isDev = import.meta.env.DEV;

class NewsService {
    getNews(params = { page: 0, size: 10 }) {
        if (isDev) {
            // JSONPlaceholder: /posts
            return makeRequest({
                url: '/posts',
                method: 'GET',
                params: { _page: params.page + 1, _limit: params.size },
            });
        }
        return makeRequest({ url: '/news', method: 'GET', params });
    }

    createNews(data) {
        if (isDev) {
            // мок-успех без сервера
            return Promise.resolve({ data: { id: Date.now(), ...data } });
        }
        return makeRequest({ url: '/news', method: 'POST', data });
    }

    broadcastNews(data) {
        if (isDev) {
            return Promise.resolve({ data: { ok: true } });
        }
        return makeRequest({ url: '/news/broadcast', method: 'POST', data });
    }
}

export default new NewsService();

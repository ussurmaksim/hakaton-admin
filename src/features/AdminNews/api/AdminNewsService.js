import { makeRequest } from '@/shared/api/makeRequest.js';

class NewsService {
    getNews(params = { page: 0, size: 10 }) {
        return makeRequest({
            url: '/news',
            method: 'GET',
            params,
        });
    }

    createIncident(data) {
        return makeRequest({
            url: '/incidents/spawn',
            method: 'POST',
            params: data,
            node: `${import.meta.env.VITE_NODE}`,
            authToken: false
        });
    }

    broadcastNews(data) {
        // если у тебя выделен отдельный endpoint для рассылки
        return makeRequest({
            url: '/news/broadcast',
            method: 'POST',
            data,
        });
    }
}

export default new NewsService();

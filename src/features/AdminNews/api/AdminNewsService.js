import { makeRequest } from '@/shared/api/makeRequest.js';

class NewsService {
    createIncident(params) {
        return makeRequest({
            url: '/incidents/spawn',
            method: 'POST',
            params,
            authToken: true,
        });
    }

    // если надо руками разослать новость
    broadcastNews(data) {
        return makeRequest({
            url: '/news/broadcast',
            method: 'POST',
            data,
            authToken: true,
        });
    }
}

export default new NewsService();

import { makeRequest } from '@/shared/api/makeRequest.js';
import { makePublicRequest } from '@/shared/api/makePublicRequest.js';

class AIDigestService {
    // Запуск генерации (админ, REST)
    runDigest() {
        return makeRequest({ url: '/ai/run-digest', method: 'POST' });
    }

    // Публичная лента news, отфильтрованная по source=AI
    // params: { page, size }
    fetchAIDigests(params = { page: 0, size: 50 }) {
        // у публичного API нет фиксированного фильтра — прокинем как query, бэк может игнорить.
        return makePublicRequest({
            url: '/news',
            method: 'GET',
            params: { ...params, source: 'AI' },
        });
    }
}

export default new AIDigestService();

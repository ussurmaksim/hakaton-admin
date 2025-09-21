import axios from 'axios';

export const makeRequest = async ({
                                      url = '',
                                      method = 'GET',
                                      authToken = true,
                                      headers = {},
                                      params = {},
                                      data = {},
                                      responseType = 'json',
                                      signal,
                                  }) => {
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const node = import.meta.env.VITE_API_NODE || 'node-a';
    const fullUrl = `${base}/${node}/api/admin${url}`;

    if (authToken) {
        const token = localStorage.getItem('accessToken');
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        return await axios.request({ url: fullUrl, method, headers, params, data, responseType, signal });
    } catch (error) {
        return {
            message: error?.response?.data?.message || error.message,
            timestamp: error?.response?.data?.timestamp,
            status: error?.response?.status || 0,
        };
    }
};

import axios from 'axios';

export const makePublicRequest = async ({
                                            url = '',
                                            method = 'GET',
                                            headers = {},
                                            params = {},
                                            data = {},
                                            responseType = 'json',
                                            signal,
                                        }) => {
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const node = import.meta.env.VITE_NODE || 'node-a';
    // nginx проксирует public на /<node>/api/public/*
    const fullUrl = `${base}/${node}/api/public${url}`;

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

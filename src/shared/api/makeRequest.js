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
    url = `${import.meta.env.VITE_API_URL + `/${import.meta.env.VITE_NODE}` + '/api/admin' + url}`;

    if (authToken) {
        const token = localStorage.getItem('accessToken');
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        return await axios
            .request({
                url,
                method,
                headers,
                params,
                data,
                responseType,
                signal,
            });
    } catch (error) {
        return {
            message: error.response.data.message,
            timestamp: error.response.data.timestamp,
            status: error.response?.status || 0,
        };
    }
};

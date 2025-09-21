import { makePublicRequest } from '@/shared/api/makePublicRequest.js';
import { makeRequest } from '@/shared/api/makeRequest.js';

class CamerasService {
    fetchPublicCameras(region) {
        return makePublicRequest({ url: '/cameras', method: 'GET', params: { region } });
    }
    fetchStatus() {
        return makePublicRequest({ url: '/cameras/status', method: 'GET' });
    }
    getPolicy(cameraId) {
        return makeRequest({ url: `/camera-policy/${cameraId}`, method: 'GET' });
    }
    savePolicy(cameraId, data) {
        return makeRequest({
            url: `/camera-policy/${cameraId}`,
            method: 'POST',
            data,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    scanAll()         { return makeRequest({ url: '/camera/scan', method: 'POST' }); }
    scanNow(cameraId) { return makeRequest({ url: `/camera-ai/scan-now/${cameraId}`, method: 'POST' }); }
    detect(params)    { return makeRequest({ url: '/camera/detect', method: 'POST', params }); }
}
export default new CamerasService();

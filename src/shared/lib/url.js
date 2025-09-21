// Делает относительный URL ("/hls/live/...") абсолютным
// База берётся из VITE_GATEWAY_BASE, иначе из VITE_API_URL + VITE_API_NODE
const baseFromEnv = () => {
    const gw = import.meta.env.VITE_GATEWAY_BASE;
    if (gw) return gw.replace(/\/+$/, '');
    const api = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const node = import.meta.env.VITE_API_NODE || 'node-a';
    return api ? `${api}/${node}` : '';
};

export const toAbs = (u) => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    const base = baseFromEnv();
    try {
        return new URL(u, base).href;
    } catch {
        // если base пуст, вернём как есть
        return u;
    }
};

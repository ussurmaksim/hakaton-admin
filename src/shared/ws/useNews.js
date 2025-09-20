import { useEffect, useRef, useState } from 'react';
import { createNewsClient } from './newsClient';

export function useNews() {
    const [items, setItems] = useState([]);
    const clientRef = useRef(null);

    useEffect(() => {
        const url = import.meta.env.VITE_WS_URL;
        const token = localStorage.getItem('accessToken');

        const client = createNewsClient({
            url,
            token,
            onMessage: (n) => setItems((prev) => [n, ...prev]),
        });

        clientRef.current = client;
        return () => client.deactivate();
    }, []);

    return { items };
}

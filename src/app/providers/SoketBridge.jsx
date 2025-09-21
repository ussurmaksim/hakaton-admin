import { useContext, useEffect } from 'react';
import { SocketContext } from './SoketProvider.jsx';
import { useStore } from '@/shared/hooks/useStore.js';

export default function SocketBridge({ children }) {
    const socket = useContext(SocketContext);
    const store = useStore();

    useEffect(() => {
        // прокидываем сокет в рут-стор
        store.setSocket?.(socket);
        return () => store.sensors?.destroyWs?.();
    }, [socket, store]);

    return children ?? null;
}

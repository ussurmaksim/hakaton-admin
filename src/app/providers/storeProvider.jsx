import { createContext, useMemo } from 'react';
import Store from '@/shared/store/Store.js';

// eslint-disable-next-line react-refresh/only-export-components
export const StoreContext = createContext(null);

export default function StoreProvider({ children }) {
    const store = useMemo(() => new Store(), []);
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}


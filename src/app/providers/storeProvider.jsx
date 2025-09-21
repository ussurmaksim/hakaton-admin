import { createContext, useMemo } from 'react';
import { Store } from '@/shared/store/store.js';

export const StoreContext = createContext(null);

export default function StoreProvider({ children }) {
    const store = useMemo(() => new Store(), []);
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

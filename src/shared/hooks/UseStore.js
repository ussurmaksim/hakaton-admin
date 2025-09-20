import { useContext } from 'react';
import { StoreContext } from '@/app/providers/storeProvider.jsx';

export const useStore = () => {
    const store = useContext(StoreContext);
    if (!store) throw new Error('useStore must be used within StoreProvider');
    return store;
};

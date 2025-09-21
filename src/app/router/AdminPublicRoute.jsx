import { useStore } from '@/shared/hooks/useStore.js';
import { Outlet } from 'react-router-dom';

export default function AdminPublicRoute() {
    // Временно пропускаем всегда. Если нужно — тут сделай проверку роли.
    const { adminAuth } = useStore();
    void adminAuth; // чтобы линтер не ругался
    return <Outlet />;
}

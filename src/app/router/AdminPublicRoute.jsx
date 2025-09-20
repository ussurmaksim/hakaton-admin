// routes/AdminPublicRoute.jsx
import { useStore } from '@/shared/hooks/useStore.js';
import { Navigate, Outlet } from 'react-router-dom';
import { STATIC_LINKS } from '@/shared/constants/staticLinks.js';

export default function AdminPublicRoute() {
    const { account } = useStore().adminAuth;
    if (account?.role === 'Admin') return <Navigate to={STATIC_LINKS.ADMIN_ROOT} replace />;
    return <Outlet />;
}

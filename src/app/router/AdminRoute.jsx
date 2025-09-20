import { observer } from 'mobx-react-lite';
import { Navigate, Outlet } from 'react-router-dom';
import { STATIC_LINKS } from '@/shared/constants/staticLinks.js';
import {useStore} from "@/shared/hooks/UseStore.js";

const AdminRoute = observer(() => {
    const {account} = useStore().adminAuth;

    return (account?.role === "Admin" ? <Outlet /> : <Navigate to={STATIC_LINKS.HOME} />)
})

export default AdminRoute;
// src/app/router/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { STATIC_LINKS } from '@/shared/constants/staticLinks';

import AdminRoute from './AdminRoute';
import AdminPublicRoute from './AdminPublicRoute';
import AdminLayout from '@/widgets/admin/layout/AdminLayout.jsx';

import AdminLoginPage from '@/features/adminAuth/ui/AdminLoginPage';
import HomePage from '@/pages/Home/Home.jsx';
import Users from "@/pages/Users/Users.jsx";
import NotFound from "@/pages/NotFound/NotFound.jsx";
import UsersForm from "@/pages/Users/UsersForm.jsx";
import AdminDashboard from "@/pages/Dashboard/Dashboard.jsx";

export const router = createBrowserRouter([
    {
        element: <App />,
        children: [
            {
                element: <AdminPublicRoute />,
                children: [{ path: STATIC_LINKS.HOME, element: <AdminLoginPage /> }],
            },

            {
                path: STATIC_LINKS.ADMIN_ROOT,
                element: <AdminRoute />,
                children: [
                    {
                        element: <AdminLayout />,
                        children: [
                            { index: true, element: <AdminDashboard /> },
                            { path: 'users/create', element: <UsersForm /> },
                            { path: 'users/:id', element: <UsersForm /> },
                        ],
                    },
                ],
            },
        ],
    },
    {
        path: '*',
        element: <NotFound />,
    }
]);

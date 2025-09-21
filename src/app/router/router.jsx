import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { STATIC_LINKS } from '@/shared/constants/staticLinks';

import AdminPublicRoute from './AdminPublicRoute';
import AdminLayout from '@/widgets/admin/layout/AdminLayout.jsx';

import AdminDashboard from '@/pages/Dashboard/Dashboard.jsx';
import SensorsPage from '@/pages/Sensors/SensorsPage.jsx';
import AdminPlacesPage from '@/pages/Places/Places.jsx';
import NotFound from '@/pages/NotFound/NotFound.jsx';
import CamerasPage from "@/pages/Cameras/CamerasPage.jsx";
import AIDigestPage from "@/pages/AIDigest/AIDigestPage.jsx";
import LiveCamerasPage from "@/pages/Cameras/LiveCamerasPage.jsx";
import AdminPlacesForm from "@/features/AdminPlaces/ui/AdminPlacesForm.jsx";
import NodesWatcherPage from "@/pages/NodesWatcher/NodesWatcher.jsx";

export const router = createBrowserRouter([
    {
        element: <App />,
        children: [
            {
                path: STATIC_LINKS.HOME,
                element: <AdminPublicRoute />,
                children: [
                    { index: true, element: <AdminDashboard /> },
                    { path: STATIC_LINKS.ADMIN_SENSORS, element: <SensorsPage /> },
                    { path: STATIC_LINKS.ADMIN_PLACES, element: <AdminPlacesPage /> },
                    { path: STATIC_LINKS.ADMIN_CAMERAS, element: <CamerasPage /> },
                    { path: STATIC_LINKS.ADMIN_AI_DIGEST, element: <AIDigestPage /> },
                    { path: STATIC_LINKS.ADMIN_CAMERAS_LIVE, element: <LiveCamerasPage /> },
                    { path: STATIC_LINKS.ADMIN_PLACES_CREATE, element: <AdminPlacesForm />},
                    { path: STATIC_LINKS.ADMIN_NODES, element: <NodesWatcherPage />}
                ],
            },
        ],
    },
    { path: '*', element: <NotFound /> },
]);

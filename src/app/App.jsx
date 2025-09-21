import { Outlet } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import AdminLayout from '@/widgets/admin/layout/AdminLayout.jsx';

const App = () => (
    <MantineProvider defaultColorScheme="light">
        <AdminLayout>
            <Outlet />
        </AdminLayout>
    </MantineProvider>
);

export default App;

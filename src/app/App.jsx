import { Outlet } from 'react-router-dom';
import {AppShell, MantineProvider} from '@mantine/core';
import { Notifications } from '@mantine/notifications';

const App = () => {
  return (
      <MantineProvider defaultColorScheme="light">
        <Outlet />
      </MantineProvider>
  );
};

export default App;

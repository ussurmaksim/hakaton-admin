import { Link, Outlet, useLocation } from 'react-router-dom';
import {AppShell, Burger, Group, Title, NavLink, ActionIcon, Stack} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Home, User, LogOut } from 'lucide-react';
import { STATIC_LINKS } from '@/shared/constants/staticLinks.js';
import { useStore } from '@/shared/hooks/UseStore.js';

const AdminLayout = () => {
    const [opened, { toggle }] = useDisclosure();
    const { adminAuth } = useStore();
    const {account, isLoading} = adminAuth;
    const { pathname } = useLocation();

    if (isLoading) {
        return (
            <Stack align="center" justify="center" h="100vh">
                <Loader size="lg"/>
            </Stack>
        )
    }

    return (
        <AppShell
            header={{ height: 56 }}
            navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" />
                        <Title order={4}>АДМИН ПАНЕЛЬ</Title>
                    </Group>
                    <Group>
                        <Title order={5}>
                            {account.email}
                        </Title>
                        <ActionIcon variant="subtle" onClick={() => adminAuth.logout()} aria-label="Выйти">
                            <LogOut size={18} />
                        </ActionIcon>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                <NavLink
                    label="Dashboard"
                    leftSection={<Home size={16} />}
                    component={Link}
                    to={STATIC_LINKS.ADMIN_ROOT}
                    active={pathname === STATIC_LINKS.ADMIN_ROOT}
                />
                {/*<NavLink*/}
                {/*    label="Users"*/}
                {/*    leftSection={<User size={16} />}*/}
                {/*    component={Link}*/}
                {/*    to={`${STATIC_LINKS.ADMIN_ROOT}`}*/}
                {/*    active={pathname.startsWith(`${STATIC_LINKS.ADMIN_USERS}`)}*/}
                {/*/>*/}
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
};

export default AdminLayout;

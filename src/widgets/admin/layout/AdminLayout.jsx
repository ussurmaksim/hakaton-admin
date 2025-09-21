import { Link, Outlet, useLocation } from 'react-router-dom';
import { AppShell, Burger, Group, Title, NavLink, ActionIcon, Stack, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {Home, BellRing, LogOut, Video, Brain, Camera, MapPin, Router } from 'lucide-react';
import { STATIC_LINKS } from '@/shared/constants/staticLinks.js';
import { useStore } from '@/shared/hooks/useStore.js';

const AdminLayout = () => {
    const [opened, { toggle }] = useDisclosure();
    const { adminAuth } = useStore();
    const { account, isLoading } = adminAuth;
    const { pathname } = useLocation();

    if (isLoading) {
        return (
            <Stack align="center" justify="center" h="100vh">
                <Loader size="lg" />
            </Stack>
        );
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
                        <Title order={5}>{account?.email}</Title>
                        <ActionIcon variant="subtle" onClick={() => adminAuth.logout()} aria-label="Выйти">
                            <LogOut size={18} />
                        </ActionIcon>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                <NavLink
                    label="События"
                    leftSection={<Home size={16} />}
                    component={Link}
                    to={STATIC_LINKS.HOME}
                    active={pathname === STATIC_LINKS.HOME}
                />
                <NavLink
                    label="Датчики"
                    leftSection={<BellRing size={16} />}
                    component={Link}
                    to={STATIC_LINKS.ADMIN_SENSORS}
                    active={pathname.startsWith(STATIC_LINKS.ADMIN_SENSORS)}
                />
                <NavLink
                    label="Места"
                    leftSection={<MapPin size={16} />}
                    component={Link}
                    to={STATIC_LINKS.ADMIN_PLACES}
                    active={pathname.startsWith(STATIC_LINKS.ADMIN_PLACES)}
                />
                {/*<NavLink*/}
                {/*    label="Камеры"*/}
                {/*    leftSection={<Video size={16} />}*/}
                {/*    component={Link}*/}
                {/*    to={STATIC_LINKS.ADMIN_CAMERAS}*/}
                {/*    active={pathname.startsWith(STATIC_LINKS.ADMIN_CAMERAS)}*/}
                {/*/>*/}
                {/*<NavLink*/}
                {/*    label="AI-сводка"*/}
                {/*    leftSection={<Brain size={16} />}*/}
                {/*    component={Link}*/}
                {/*    to={STATIC_LINKS.ADMIN_AI_DIGEST}*/}
                {/*    active={pathname.startsWith(STATIC_LINKS.ADMIN_AI_DIGEST)}*/}
                {/*/>*/}
                <NavLink
                    label="Камеры (Live)"
                    leftSection={<Camera size={16} />}
                    component={Link}
                    to={STATIC_LINKS.ADMIN_CAMERAS_LIVE}
                    active={pathname.startsWith(STATIC_LINKS.ADMIN_CAMERAS_LIVE)}
                />
                <NavLink
                    label="Узлы"
                    leftSection={<Router  size={16} />}
                    component={Link}
                    to={STATIC_LINKS.ADMIN_NODES}
                    active={pathname.startsWith(STATIC_LINKS.ADMIN_NODES)}
                />
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
};

export default AdminLayout;

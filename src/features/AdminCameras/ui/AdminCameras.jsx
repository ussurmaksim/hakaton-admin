import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useDisclosure } from '@mantine/hooks';
import { useStore } from '@/shared/hooks/useStore.js';
import { useSocket } from '@/shared/hooks/useSocket.js';
import {
    ActionIcon, Badge, Button, Card, Container, Grid, Group, Image, Stack, Text, Title, Tooltip,
} from '@mantine/core';
import { Bell, Camera, Play, RefreshCcw, Shield } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import CameraPolicyModal from './CameraPolicyModal.jsx';

const StatusDot = ({ ok }) => (
    <Badge color={ok ? 'green' : 'red'} variant="dot">
        {ok ? 'online' : 'offline'}
    </Badge>
);

const AdminCameras = observer(() => {
    const { cameras } = useStore();
    const { connected } = useSocket();

    const items = cameras.items;
    const isLoading = cameras.isLoading;

    const [policyOpened, { open: openPolicy, close: closePolicy }] = useDisclosure(false);
    const [cameraId, setCameraId] = useState(null);

    useEffect(() => {
        cameras.load?.();
        cameras.initWs?.();
        return () => cameras.destroyWs?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const doScanAll = async () => {
        try {
            const { via } = await cameras.scanAll();
            notifications.show({ color: 'green', title: 'Сканирование запущено', message: `через ${via.toUpperCase()}` });
        } catch (e) {
            notifications.show({ color: 'red', title: 'Ошибка сканирования', message: String(e?.message || e) });
        }
    };

    const doScanNow = async (id) => {
        try {
            const { via } = await cameras.scanNow(id);
            notifications.show({ color: 'green', title: `Камера #${id}`, message: `скан вне очереди (${via})` });
        } catch (e) {
            notifications.show({ color: 'red', title: `Камера #${id}`, message: String(e?.message || e) });
        }
    };

    const doDetect = async (id) => {
        try {
            const { via, data } = await cameras.detect({ id, createIncident: true });
            notifications.show({ color: 'green', title: `Detect #${id}`, message: `${String(data ?? 'OK')} (${via})` });
        } catch (e) {
            notifications.show({ color: 'red', title: `Detect #${id}`, message: String(e?.message || e) });
        }
    };

    const openPolicyFor = (id) => { setCameraId(id); openPolicy(); };

    return (
        <Container fluid>
            <Group justify="space-between" mt="sm" mb="md">
                <Group gap="sm">
                    <StatusDot ok={connected} />
                    <Button leftSection={<RefreshCcw size={16} />} variant="light" onClick={() => cameras.load()}>
                        Обновить список
                    </Button>
                </Group>
                <Button leftSection={<Play size={16} />} onClick={doScanAll}>
                    Сканировать все
                </Button>
            </Group>

            <Grid gutter="sm">
                {items?.map((cam) => (
                    <Grid.Col key={cam.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                        <Card withBorder radius="lg">
                            <Group justify="space-between" mb="xs">
                                <Badge variant="dot" color={cam.online ? 'green' : 'red'}>
                                    {cam.online ? 'ONLINE' : 'OFFLINE'}
                                </Badge>
                                <Group gap="xs">
                                    {cam.type && <Badge variant="light">{cam.type}</Badge>}
                                    {cam.regionCode && <Badge variant="light">{cam.regionCode}</Badge>}
                                </Group>
                            </Group>

                            {cam.snapshotUrl ? (
                                <Image src={cam.snapshotUrl} alt={`camera #${cam.id}`} radius="md" h={160} fit="cover" withPlaceholder />
                            ) : (
                                <Stack align="center" justify="center" h={160} bg="gray.1" style={{ borderRadius: 8 }}>
                                    <Camera size={28} />
                                    <Text size="xs" c="dimmed">нет кадра</Text>
                                </Stack>
                            )}

                            <Stack gap={4} mt="xs">
                                <Title order={5}>{cam.name || `CAMERA #${cam.id}`}</Title>
                                <Text size="sm" c="dimmed">{cam.address ?? cam.location ?? '-'}</Text>
                            </Stack>

                            <Group justify="space-between" mt="sm">
                                <Tooltip label="Политика">
                                    <ActionIcon variant="light" onClick={() => openPolicyFor(cam.id)}>
                                        <Shield size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Сканировать эту">
                                    <ActionIcon variant="light" onClick={() => doScanNow(cam.id)}>
                                        <Play size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Detect (ручная проверка)">
                                    <ActionIcon variant="light" onClick={() => doDetect(cam.id)}>
                                        <Bell size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>

            {cameraId != null && (
                <CameraPolicyModal cameraId={cameraId} opened={policyOpened} onClose={closePolicy} />
            )}
        </Container>
    );
});

export default AdminCameras;

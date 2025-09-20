// src/widgets/RealtimeStatus.jsx
import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import { useSocket } from '@/shared/hooks/useSocket.js';
import { observer } from 'mobx-react-lite';

const RealtimeStatus = observer(() => {
    const { connected, reconnect, disconnect, newsStore, incidentStore } = useSocket();

    return (
        <Card withBorder radius="md">
            <Group justify="space-between">
                <Text fw={600}>WebSocket</Text>
                <Badge color={connected ? 'green' : 'red'} variant="dot">
                    {connected ? 'online' : 'offline'}
                </Badge>
            </Group>

            <Group mt="sm" gap="xs">
                <Button size="xs" onClick={reconnect}>переподключить</Button>
                <Button size="xs" variant="light" onClick={disconnect}>отключить</Button>
            </Group>

            <Stack gap="xs" mt="md">
                <Text fw={500} size="sm">Последние новости</Text>
                {(newsStore.items ?? []).slice(0, 5).map((n, i) => (
                    <Text key={i} size="sm">• {n.title ?? n.message ?? JSON.stringify(n)}</Text>
                ))}
                <Text fw={500} size="sm" mt="sm">Последние инциденты</Text>
                {(incidentStore.items ?? []).slice(0, 5).map((it, i) => (
                    <Text key={i} size="sm">• {it.kind ?? it.reason ?? JSON.stringify(it)}</Text>
                ))}
            </Stack>
        </Card>
    );
});

export default RealtimeStatus;

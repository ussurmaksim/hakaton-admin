
import { observer } from 'mobx-react-lite';
import {
    Card, Stack, Text, ScrollArea, Divider, Group, Badge, Button, Accordion,
} from '@mantine/core';
import { useRef, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useStore } from '@/shared/hooks/UseStore';
import { useSocket } from '@/shared/hooks/useSocket';
import IncidentCard from './IncidentCard.jsx';
import NewsCreateForm from '@/features/AdminNews/ui/NewsCreateForm.jsx';

const StatusDot = ({ ok }) => (
    <Badge color={ok ? 'green' : 'red'} variant="dot">
        {ok ? 'online' : 'offline'}
    </Badge>
);

const IncidentPanel = observer(() => {
    const { incidentStore, newsAdmin } = useStore();
    const { connected, reconnect } = useSocket();

    const notifiedRef = useRef(false);
    useEffect(() => {
        if (!connected && !notifiedRef.current) {
            notifiedRef.current = true;
            notifications.show({
                color: 'red',
                title: 'WebSocket не подключен',
                message: 'Подключение к realtime недоступно',
            });
        }
    }, [connected]);

    const items = incidentStore?.items ?? [];

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
                <Text fw={600} size="lg">Live инциденты</Text>
                <Group gap="sm">
                    <StatusDot ok={connected} />
                    {/*<Button size="xs" variant="light" onClick={() => incidentStore.clear()}>*/}
                    {/*    очистить*/}
                    {/*</Button>*/}
                    {!connected && (
                        <Button size="xs" onClick={reconnect}>
                            переподключить
                        </Button>
                    )}
                </Group>
            </Group>

            <Divider my="sm" />

            {newsAdmin && (
                <>
                    <Accordion variant="separated" chevronPosition="right" multiple={false}>
                        <Accordion.Item value="create">
                            <Accordion.Control>
                                <Text fw={500}>Создать инцидент</Text>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <NewsCreateForm />
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                    <Divider my="sm" />
                </>
            )}

            <ScrollArea h={300} type="always">
                <Stack gap="xs">
                    {items.length === 0 ? (
                        <Text c="dimmed" fs="italic">Пока инцидентов нет</Text>
                    ) : (
                        items.map((it, i) => <IncidentCard key={i} it={it} />)
                    )}
                </Stack>
            </ScrollArea>
        </Card>
    );
});

export default IncidentPanel;

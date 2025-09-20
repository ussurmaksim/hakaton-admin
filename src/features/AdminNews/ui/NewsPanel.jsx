import { observer } from 'mobx-react-lite';
import {
    Card, Stack, Text, ScrollArea, Divider, Group, Badge, Button, Accordion,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {useEffect, useRef} from 'react';

import NewsCreateForm from './NewsCreateForm.jsx';
import { useStore } from '@/shared/hooks/UseStore';
import { useSocket } from '@/shared/hooks/useSocket'; // короткий хук к SocketProvider

const StatusDot = ({ ok }) => (
    <Badge color={ok ? 'green' : 'red'} variant="dot">
        {ok ? 'online' : 'offline'}
    </Badge>
);

const NewsPanel = observer(() => {
    const { newsStore, newsAdmin } = useStore();      // лента новостей + админский store
    const { connected, reconnect } = useSocket();     // статус сокета и ручной реконнект

    const notifiedRef = useRef(false);

    // если хочешь всплывающий алерт при офлайне — раскомментируй:
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

    const items = newsStore?.items ?? [];

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
                <Text fw={600} size="lg">Live новости</Text>
                <Group gap="sm">
                    <StatusDot ok={connected} />
                    {/*<Button size="xs" variant="light" onClick={() => newsStore.clear()}>*/}
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
                                <Text fw={500}>Создать событие</Text>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <NewsCreateForm onCreated={() => { /* при необходимости можно обновить список из API */ }} />
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                    <Divider my="sm" />
                </>
            )}

            <ScrollArea h={300} type="always">
                <Stack gap="xs">
                    {items.length === 0 ? (
                        <Text c="dimmed" fs="italic">Пока новостей нет</Text>
                    ) : (
                        items.map((it, i) => (
                            <Card key={i} withBorder padding="sm" radius="sm">
                                <Text size="sm">
                                    {typeof it === 'string'
                                        ? it
                                        : it.title ?? it.message ?? JSON.stringify(it)}
                                </Text>
                            </Card>
                        ))
                    )}
                </Stack>
            </ScrollArea>
        </Card>
    );
});

export default NewsPanel;

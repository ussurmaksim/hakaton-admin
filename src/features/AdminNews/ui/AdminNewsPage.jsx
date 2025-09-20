import { observer } from 'mobx-react-lite';
import {
    Card, Stack, Text, ScrollArea, Divider, Group, Badge, Button, Loader, Accordion,
} from '@mantine/core';
import { useStore } from '@/shared/hooks/UseStore';
import NewsCreateForm from './NewsCreateForm.jsx';
import { notifications } from '@mantine/notifications';
import { useEffect, useRef } from 'react';


const StatusDot = ({ ok }) => (
    <Badge color={ok ? 'green' : 'red'} variant="dot">
        {ok ? 'online' : 'offline'}
    </Badge>
);

const NewsPanel = observer(() => {
    const store = useStore();
    const news = store?.news;
    const newsAdmin = store?.newsAdmin;

    const notifiedRef = useRef(false); // чтобы не спамить

    const { items, isConnected, isConnecting, error } = news;

    useEffect(() => {
        if (error && !notifiedRef.current) {
            notifiedRef.current = true;
            notifications.show({
                color: 'red',
                title: 'WebSocket не подключен',
                message: String(error),
            });
        }
    }, [error]);
    if (!news) return null;


    const opts = {
        url: import.meta.env.VITE_WS_URL,
        token: localStorage.getItem('accessToken'),
        useSockJS: true,
    };

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            {/* Заголовок + статус */}
            <Group justify="space-between" mb="xs">
                <Text fw={600} size="lg">Live новости</Text>
                <Group gap="sm">
                    {isConnecting ? <Loader size="xs" /> : <StatusDot ok={isConnected} />}
                    <Button size="xs" variant="light" onClick={() => news.clear()}>очистить</Button>
                    {!isConnected && !isConnecting && (
                        <Button size="xs" onClick={() => news.reconnect(opts)}>переподключить</Button>
                    )}
                </Group>
            </Group>

            {/* Ошибка */}
            {error && <Text c="red" size="xs" mb="xs">{String(error)}</Text>}

            <Divider my="sm" />

            {/* Форма создания новости */}
            {newsAdmin && (
                <>
                    <Accordion keepMounted  variant="separated" chevronPosition="right" multiple={false}>
                        <Accordion.Item value="create">
                            <Accordion.Control>
                                <Text fw={500}>Создать новость</Text>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <NewsCreateForm onCreated={() => newsAdmin.load()} />
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                    <Divider my="sm" />
                </>
            )}

            {/* Лента live-новостей */}
            <ScrollArea h={300} type="always">
                <Stack gap="xs">
                    {items.length === 0
                        ? <Text c="dimmed" fs="italic">Пока новостей нет</Text>
                        : items.map((it, i) => (
                            <Card key={i} withBorder padding="sm" radius="sm">
                                <Text size="sm">
                                    {typeof it === 'string'
                                        ? it
                                        : it.title ?? it.message ?? JSON.stringify(it)}
                                </Text>
                            </Card>
                        ))}
                </Stack>
            </ScrollArea>
        </Card>
    );
});

export default NewsPanel;

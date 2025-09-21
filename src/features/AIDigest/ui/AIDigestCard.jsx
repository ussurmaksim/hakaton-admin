import { useState } from 'react';
import { Card, Group, Button, Text, Badge } from '@mantine/core';
import { Brain, RefreshCcw } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { useSocket } from '@/shared/hooks/useSocket.js';
import AIDigestService from '../api/AIDigestService.js';

const AIDigestCard = () => {
    const { connected, request, send } = useSocket();
    const [loading, setLoading] = useState(false);

    const run = async () => {
        if (loading) return;
        setLoading(true);
        try {
            // 1) попробуем аккуратный WS-RPC (если бэк поддерживает)
            let ok = false;
            if (connected && request) {
                try {
                    await request({
                        destination: '/app/admin/ai/run-digest',
                        body: { ts: Date.now() },
                        timeoutMs: 4000,
                        // если бэк не шлёт ответ — матчер не сработает, упадём в catch и уйдём в REST
                    });
                    ok = true;
                    notifications.show({
                        color: 'green',
                        title: 'Запущено (WS)',
                        message: 'AI-сводка формируется… новости появятся в ленте с source="AI"',
                    });
                } catch {
                    // не отвечают по WS — упадём на REST
                }
            }

            // 2) если WS не ответил — REST
            if (!ok) {
                const res = await AIDigestService.runDigest();
                if (res?.status && res.status >= 400) throw new Error(res?.message || 'REST error');
                notifications.show({
                    color: 'green',
                    title: 'Запущено (REST)',
                    message: 'AI-сводка формируется… новости появятся в ленте с source="AI"',
                });
            }
        } catch (e) {
            notifications.show({
                color: 'red',
                title: 'Ошибка запуска сводки',
                message: String(e?.message || e || 'Unknown error'),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card withBorder radius="lg" padding="md">
            <Group justify="space-between" mb="xs">
                <Group gap="xs">
                    <Brain size={18} />
                    <Text fw={600}>AI-сводка (последние 10 минут)</Text>
                </Group>
                <Badge variant="dot" color={connected ? 'green' : 'gray'}>
                    {connected ? 'WebSocket: online' : 'WebSocket: offline'}
                </Badge>
            </Group>

            <Text size="sm" c="dimmed" mb="sm">
                Сгенерировать краткий дайджест по датчикам за 10 минут
            </Text>

            <Group justify="flex-end">
                <Button leftSection={<RefreshCcw size={16} />} onClick={run} loading={loading}>
                    Сгенерировать сводку
                </Button>
            </Group>
        </Card>
    );
};

export default AIDigestCard;

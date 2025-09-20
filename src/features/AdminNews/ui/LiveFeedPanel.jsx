// features/Realtime/ui/LiveFeedPanel.jsx
import { observer } from 'mobx-react-lite';
import {
    Card, Stack, Text, ScrollArea, Divider, Group, Badge, Button,
    SegmentedControl, TextInput
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { useStore } from '@/shared/hooks/UseStore';
import { useSocket } from '@/shared/hooks/useSocket';
import IncidentCard from '@/features/Incidents/ui/IncidentCard.jsx';

// Лёгкая карточка новости
function NewsCard({ it }) {
    const title = it?.title ?? '';
    const msg = it?.message ?? it?.body ?? '';
    return (
        <Card withBorder padding="sm" radius="sm">
            <Text size="sm">{title || msg || JSON.stringify(it)}</Text>
        </Card>
    );
}

const StatusDot = ({ ok }) => (
    <Badge color={ok ? 'green' : 'red'} variant="dot">
        {ok ? 'online' : 'offline'}
    </Badge>
);

const LiveFeedPanel = observer(() => {
    const { incidentStore, newsStore } = useStore();
    const { connected, reconnect } = useSocket();

    // ✅ без TS-дженериков в JSX
    const [tab, setTab] = useState('incidents'); // 'incidents' | 'news'
    const [q, setQ] = useState('');

    // безопасно берём ленту
    const rawUnsafe = tab === 'incidents'
        ? (incidentStore?.items)
        : (newsStore?.items);

    const raw = Array.isArray(rawUnsafe) ? rawUnsafe : [];

    const items = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return raw;
        return raw.filter((it) => {
            if (typeof it === 'string') return it.toLowerCase().includes(s);
            if (it && typeof it === 'object') {
                return Object.values(it).some(v => String(v ?? '').toLowerCase().includes(s));
            }
            return false;
        });
    }, [q, raw]);

    const clear = () => {
        if (tab === 'incidents') incidentStore?.clear?.();
        else newsStore?.clear?.();
    };

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs" wrap="nowrap">
                <Group gap="sm">
                    <Text fw={600} size="lg">Live лента</Text>
                    <SegmentedControl
                        size="xs"
                        value={tab}
                        onChange={(v) => setTab(v)}
                        data={[
                            { label: 'Инциденты', value: 'incidents' },
                            { label: 'Новости', value: 'news' },
                        ]}
                    />
                </Group>
                <Group gap="sm">
                    <TextInput
                        value={q}
                        onChange={(e) => setQ(e.currentTarget.value)}
                        placeholder="Поиск…"
                        size="xs"
                        w={220}
                    />
                    <StatusDot ok={connected} />
                    <Button size="xs" variant="light" onClick={clear}>очистить</Button>
                    {!connected && <Button size="xs" onClick={reconnect}>переподключить</Button>}
                </Group>
            </Group>

            <Divider my="sm" />

            <ScrollArea h={340} type="always">
                <Stack gap="xs">
                    {items.length === 0 ? (
                        <Text c="dimmed" fs="italic">
                            {q ? 'Ничего не найдено' : (tab === 'incidents' ? 'Пока инцидентов нет' : 'Пока новостей нет')}
                        </Text>
                    ) : (
                        items.map((it, i) =>
                            tab === 'incidents'
                                ? <IncidentCard key={`inc-${i}`} it={it} />
                                : <NewsCard key={`news-${i}`} it={it} />
                        )
                    )}
                </Stack>
            </ScrollArea>
        </Card>
    );
});

export default LiveFeedPanel;

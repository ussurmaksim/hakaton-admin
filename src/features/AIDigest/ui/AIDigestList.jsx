import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useStore } from '@/shared/hooks/useStore.js';
import { Card, Group, ScrollArea, Stack, Text, Title, Badge, Button } from '@mantine/core';
import { RefreshCcw } from 'lucide-react';

const DigestItem = ({ it }) => {
    const title = it.title ?? it.header ?? 'AI Digest';
    const msg = it.message ?? it.body ?? it.text ?? '';
    const ts = it.ts ?? it.timestamp;
    const when = ts ? new Date(ts).toLocaleString() : null;
    const region = it.region ?? it.regionCode ?? null;

    return (
        <Card withBorder padding="sm" radius="sm">
            <Group justify="space-between" mb={6}>
                <Title order={5}>{title}</Title>
                <Group gap="xs">
                    {region && <Badge variant="light">{region}</Badge>}
                    <Badge color="grape" variant="light">AI</Badge>
                </Group>
            </Group>
            {msg && <Text size="sm" mb={4}>{msg}</Text>}
            {when && <Text size="xs" c="dimmed">{when}</Text>}
        </Card>
    );
};

const AIDigestList = observer(() => {
    const { aiDigest } = useStore();

    useEffect(() => {
        if (!aiDigest.items.length) aiDigest.load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Card withBorder radius="lg" padding="md">
            <Group justify="space-between" mb="sm">
                <Title order={4}>Сводки AI</Title>
                <Group gap="xs">
                    <Button size="xs" variant="light" leftSection={<RefreshCcw size={14} />} onClick={() => aiDigest.load()}>
                        Обновить
                    </Button>
                    {/* <Button size="xs" variant="subtle" onClick={() => aiDigest.clear()}>Очистить</Button> */}
                </Group>
            </Group>

            <ScrollArea h={500} type="always">
                <Stack gap="xs">
                    {aiDigest.items.length === 0 ? (
                        <Text c="dimmed" fs="italic">Пока нет сводок</Text>
                    ) : (
                        aiDigest.items.map((it, i) => <DigestItem key={it.id ?? i} it={it} />)
                    )}
                </Stack>
            </ScrollArea>
        </Card>
    );
});

export default AIDigestList;

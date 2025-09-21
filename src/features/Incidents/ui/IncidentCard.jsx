import { Card, Group, Badge, Text, Stack, Code } from '@mantine/core';

const levelColor = (lvl) =>
    ['CRITICAL','HIGH'].includes(lvl) ? 'red'
        : ['WARNING','MEDIUM'].includes(lvl) ? 'yellow'
            : 'green';

export default function IncidentCard({ it }) {
    const level  = it?.level ?? '—';
    const kind   = it?.kind  ?? 'UNKNOWN';
    const reason = it?.reason ?? '';
    const region = it?.region ?? it?.regionCode ?? '-';
    const lat    = it?.lat ?? '-';
    const lng    = it?.lng ?? '-';
    const ts     = it?.ts  ? new Date(it.ts).toLocaleString() : null;

    return (
        <Card withBorder padding="sm" radius="sm">
            <Group justify="space-between" mb={4}>
                <Badge color={levelColor(level)}>{level}</Badge>
                <Badge variant="light">{kind}</Badge>
            </Group>
            <Stack gap={2}>
                {reason && <Text size="sm">{reason}</Text>}
                <Text size="xs" c="dimmed">Регион: <Code>{region}</Code></Text>
                <Text size="xs" c="dimmed">Коорд.: <Code>{lat}</Code>, <Code>{lng}</Code></Text>
                {ts && <Text size="xs" c="dimmed">Время: {ts}</Text>}
            </Stack>
        </Card>
    );
}

import { Card, Stack, Text, Title } from '@mantine/core';

export default function NewsCard({ it }) {
    if (!it) return null;
    const title = it.title ?? '';
    const msg = it.message ?? it.body ?? '';
    return (
        <Card withBorder padding="sm" radius="sm">
            <Stack spacing={2}>
                {title && <Title order={4}>{title}</Title>}
                {msg && <Text size="sm">{msg}</Text>}
            </Stack>
        </Card>
    );
}

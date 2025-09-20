import { Card, Text } from '@mantine/core';
export default function NewsCard({ it }) {
    const title = it?.title ?? '';
    const msg   = it?.message ?? it?.body ?? '';
    return (
        <Card withBorder padding="sm" radius="sm">
            <Text size="sm">{title || msg || JSON.stringify(it)}</Text>
        </Card>
    );
}
// src/features/AdminNodes/ui/NodesCards.jsx
import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import {
    Badge,
    Button,
    Card,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import { NodesStore } from '../model/store.js';

const store = new NodesStore();

/** Хук-тикер: дергает состояние раз в interval мс, чтобы форсить ререндер */
const useNow = (interval = 1000) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), interval);
        return () => clearInterval(id);
    }, [interval]);
    return now;
};

const fmtDateTime = (ts) => {
    try {
        return new Date(ts).toLocaleString();
    } catch {
        return '—';
    }
};

const StatusPill = ({ status }) => {
    const color = status === 'OK' ? 'green' : status === 'DEGRADED' ? 'yellow' : 'red';
    return (
        <Badge
            variant="light"
            color={color}
            radius="xl"
            leftSection={
                <span
                    style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: 9999,
                        background: 'currentColor',
                    }}
                />
            }
        >
            {status}
        </Badge>
    );
};

const OnlinePill = ({ online }) => (
    <Badge radius="xl" variant="light" color={online ? 'green' : 'red'}>
        {online ? 'ONLINE' : 'OFFLINE'}
    </Badge>
);

const SmallLabel = ({ children }) => (
    <Text size="sm" c="dimmed">
        {children}
    </Text>
);

/** Отдельный компонент "X c назад", чтобы красиво и реактивно обновлялось */
const Ago = ({ ts, now }) => {
    if (!ts) return <Text span>—</Text>;
    const seconds = Math.max(0, Math.floor((now - ts) / 1000));
    return <Text span>{seconds} c назад</Text>;
};

const NodesCards = observer(({ nodes = ['node-a', 'node-b', 'node-c'] }) => {
    // Один общий "тик" на весь список — эффективно и просто
    const now = useNow(1000);

    useEffect(() => {
        store.start(nodes);
        return () => store.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes.join('|')]);

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {store.list.map((n) => {
                const status = store.calcStatus(n);
                const actuator = (n.actuator?.status || n.actuator) ?? '—';
                const peersOk = (n.peersHealth || []).filter((p) => p.status === 'OK').length;
                const peersTotal = (n.peersHealth || []).length;

                return (
                    <Card key={n.nodeId} withBorder radius="xl" p="lg">
                        <Group justify="space-between" align="center" mb="xs">
                            {/* <StatusPill status={status} /> */}
                            <OnlinePill online={!!n.online} />
                        </Group>

                        <Text fw={800} fz="xl" mt={4}>
                            {String(n.nodeId || '').toUpperCase()}
                        </Text>

                        <SmallLabel>Region: {n.regionCode || '—'}</SmallLabel>
                        <SmallLabel>IP: {n.ip || '—'}</SmallLabel>

                        <Stack gap={4} mt="sm">
                            <SmallLabel>Public: {n.publicStatus || '—'}</SmallLabel>

                            <SmallLabel>
                                Последний PING:{' '}
                                <Tooltip
                                    label={
                                        n.lastPingTs
                                            ? `Последний ping: ${fmtDateTime(n.lastPingTs)}`
                                            : 'Время с последнего PING по SSE или REST'
                                    }
                                >
                  <span>
                    <Ago ts={n.lastPingTs} now={now} />
                  </span>
                                </Tooltip>
                            </SmallLabel>

                            <SmallLabel>
                                Peers OK: {peersTotal ? `${peersOk}/${peersTotal}` : '—'}
                            </SmallLabel>

                            {/* <SmallLabel>
                SSE:{' '}
                <Badge size="sm" variant="dot" color={n.sseConnected ? 'green' : 'red'}>
                  {n.sseConnected ? 'connected' : 'down'}
                </Badge>
              </SmallLabel> */}

                            {/*<SmallLabel>*/}
                            {/*    Actuator: {actuator === 'UP' ? 'UP' : actuator === 'DOWN' ? 'DOWN' : '—'}*/}
                            {/*</SmallLabel>*/}
                        </Stack>

                        <Group mt="md" gap="xs">
                            <Button
                                variant="light"
                                onClick={action(() => {
                                    store.stop();
                                    store.start([n.nodeId]); // переподключить только эту ноду
                                })}
                            >
                                Переподключить
                            </Button>

                            <Button
                                variant="default"
                                onClick={() => {
                                    // Ручной троекратный опрос
                                    store['_pollPublicPing'](n.nodeId);
                                    store['_pollPeers'](n.nodeId);
                                    // Если используешь actuator — раскомментируй:
                                    // store['_pollActuator'](n.nodeId);
                                }}
                            >
                                Обновить
                            </Button>

                            {/* <Button variant="light" color="blue">Параметры</Button> */}
                        </Group>
                    </Card>
                );
            })}
        </SimpleGrid>
    );
});

export default NodesCards;

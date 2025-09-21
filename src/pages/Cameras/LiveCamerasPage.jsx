// LiveCamerasPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Card, Group, ScrollArea, Stack, Text, TextInput, Title, Button, Switch } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Camera, Play } from 'lucide-react';
import CamerasService from '@/features/AdminCameras/api/CamerasService.js';
import VideoHlsPlayer from '@/features/AdminCameras/ui/VideoHlsPlayer.jsx';

/** Абсолютный URL относительно VITE_API_URL, если пришёл относительный */
const toAbs = (u) => {
    if (!u) return '';
    try {
        // уже абсолютный:
        const p = new URL(u);
        return p.toString();
    } catch {
        // относительный -> прицепим к API_URL
        const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        return base ? `${base}${u.startsWith('/') ? '' : '/'}${u}` : u;
    }
};

// HLS fallback-конструктор: /hls/live/<slug>/video1_stream.m3u8
const hlsOf = (c) => {
    if (!c) return '';
    if (c.publicUrl && /\.m3u8($|\?)/i.test(c.publicUrl)) return toAbs(c.publicUrl);
    const key = c.externalId || `cam${c.id}`;
    const base = (import.meta.env.VITE_HLS_BASE || `${import.meta.env.VITE_API_URL}/hls`).replace(/\/+$/, '');
    return `${base}/live/${encodeURIComponent(key)}/video1_stream.m3u8`;
};

// База для SSE /api/public/events
const gatewayBase = (() => {
    const gw = import.meta.env.VITE_GATEWAY_BASE;
    if (gw) return gw.replace(/\/+$/, '');
    const api = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const node = import.meta.env.VITE_NODE || 'node-a'; // ВАЖНО: VITE_NODE (а не VITE_API_NODE)
    return api ? `${api}/${node}` : '';
})();

export default function LiveCamerasPage() {
    const [cams, setCams] = useState([]);
    const [active, setActive] = useState(null);
    const [q, setQ] = useState('');
    const [followAlerts, setFollowAlerts] = useState(true);
    const [overrideStream, setOverrideStream] = useState(''); // если пришёл alert.streamUrl
    const [qDebounced] = useDebouncedValue(q, 250);
    const esRef = useRef(null);

    // начальная загрузка + подмердж онлайн-статусов
    useEffect(() => {
        let alive = true;

        (async () => {
            const [camsRes, statRes] = await Promise.allSettled([
                CamerasService.fetchPublicCameras('RU-MOW'),
                CamerasService.fetchStatus(),
            ]);

            const list = Array.isArray(camsRes.value?.data) ? camsRes.value.data : [];
            const statArr = Array.isArray(statRes.value?.data) ? statRes.value.data : [];
            const onlineById = new Map(statArr.map((s) => [s.id, !!s.online]));

            const merged = list.map((c) => ({ ...c, online: onlineById.get(c.id) ?? false }));

            if (!alive) return;
            setCams(merged);
            if (!active && merged.length) setActive(merged[0]);
        })();

        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // SSE camera-alert → при желании переключаемся на присланный streamUrl и активируем камеру
    useEffect(() => {
        try {
            const es = new EventSource(`${gatewayBase}/api/public/events`);
            esRef.current = es;

            es.addEventListener('camera-alert', (ev) => {
                if (!followAlerts) return;
                try {
                    const data = JSON.parse(ev.data); // CameraAlertDto
                    const url = data?.streamUrl ? toAbs(data.streamUrl) : '';
                    if (url) setOverrideStream(url);

                    // активируем камеру из алерта по id (без зависимости от старого closure)
                    setCams((prev) => {
                        const cam = prev.find((c) => c.id === data.cameraId);
                        if (cam) setActive(cam);
                        return prev;
                    });
                } catch { /* ignore */ }
            });
        } catch { /* SSR или старый браузер */ }

        return () => {
            try { esRef.current?.close?.(); } catch {}
            esRef.current = null;
        };
        // followAlerts добавлять не надо — перезапускать EventSource не требуется
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const s = qDebounced.trim().toLowerCase();
        if (!s) return cams;
        return cams.filter((c) =>
            [c.name, c.regionCode, c.externalId, c.id]
                .some((v) => String(v ?? '').toLowerCase().includes(s))
        );
    }, [cams, qDebounced]);

    const currentSrc = useMemo(() => {
        if (overrideStream) return overrideStream;
        return hlsOf(active);
    }, [overrideStream, active]);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
            {/* Сайдбар */}
            <Card withBorder radius="lg" padding="md" style={{ height: 'calc(100vh - 140px)' }}>
                <Stack gap="sm" style={{ height: '100%' }}>
                    <Group justify="space-between">
                        <Title order={5}>Камеры</Title>
                        <Group gap="xs">
                            <Switch
                                size="xs"
                                checked={followAlerts}
                                onChange={(e) => setFollowAlerts(e.currentTarget.checked)}
                                label="Следовать alert"
                            />
                            <Button size="xs" variant="light" onClick={() => setOverrideStream('')}>
                                Сбросить alert
                            </Button>
                        </Group>
                    </Group>

                    <TextInput placeholder="Поиск…" value={q} onChange={(e) => setQ(e.currentTarget.value)} />

                    <ScrollArea style={{ flex: 1 }} type="always">
                        <Stack gap="xs">
                            {filtered.map((c) => (
                                <Card
                                    key={c.id}
                                    withBorder
                                    radius="md"
                                    onClick={() => { setActive(c); setOverrideStream(''); }}
                                    style={{
                                        cursor: 'pointer',
                                        borderColor: active?.id === c.id ? 'var(--mantine-color-blue-5)' : undefined,
                                    }}
                                >
                                    <Group justify="space-between" mb={4}>
                                        <Text fw={600} size="sm">{c.name || `CAMERA #${c.id}`}</Text>
                                        <Badge variant="light">{c.regionCode || '-'}</Badge>
                                    </Group>
                                    <Group gap="xs">
                                        <Badge variant="dot" color={c.online ? 'green' : 'red'}>
                                            {c.online ? 'ONLINE' : 'OFFLINE'}
                                        </Badge>
                                    </Group>
                                </Card>
                            ))}
                            {filtered.length === 0 && <Text c="dimmed" fs="italic">Не найдено</Text>}
                        </Stack>
                    </ScrollArea>
                </Stack>
            </Card>

            {/* Видео и детали */}
            <Stack gap="sm">
                {active ? (
                    <>
                        <Group justify="space-between">
                            <Group gap="xs">
                                <Camera size={18} />
                                <Title order={4}>{active.name || `CAMERA #${active.id}`}</Title>
                                <Badge variant="dot" color={active.online ? 'green' : 'red'}>
                                    {active.online ? 'ONLINE' : 'OFFLINE'}
                                </Badge>
                            </Group>
                            <Group gap="xs">
                                <Button
                                    size="xs"
                                    leftSection={<Play size={14} />}
                                    onClick={() => {
                                        setOverrideStream('');
                                        // лёгкий пинок для пересоздания memo/подключений
                                        setActive((a) => (a ? { ...a } : a));
                                    }}
                                >
                                    Переподключить
                                </Button>
                            </Group>
                        </Group>

                        <VideoHlsPlayer src={currentSrc} />

                        <Card withBorder radius="lg" padding="md">
                            <Stack gap={4}>
                                {active.snapshotUrl && (
                                    <Text size="sm">
                                        Снимок:{' '}
                                        <a href={toAbs(active.snapshotUrl)} target="_blank" rel="noreferrer">
                                            {toAbs(active.snapshotUrl)}
                                        </a>
                                    </Text>
                                )}
                                {active.publicUrl && (
                                    <Text size="sm">
                                        Поток:{' '}
                                        <a href={toAbs(active.publicUrl)} target="_blank" rel="noreferrer">
                                            {toAbs(active.publicUrl)}
                                        </a>
                                    </Text>
                                )}
                            </Stack>
                        </Card>
                    </>
                ) : (
                    <Card withBorder radius="lg" padding="lg" style={{ height: 420, display: 'grid', placeItems: 'center' }}>
                        <Stack align="center">
                            <Camera size={28} />
                            <Text c="dimmed">Выберите камеру</Text>
                        </Stack>
                    </Card>
                )}
            </Stack>
        </div>
    );
}

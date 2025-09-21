import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useDisclosure } from '@mantine/hooks';
import { useStore } from '@/shared/hooks/useStore.js';
import { useSocket } from '@/shared/hooks/useSocket.js';
import {
    Badge, Card, Container, Grid, Stack, Text, Title, Group, Button, Modal,
    TextInput, Select, NumberInput, Textarea, LoadingOverlay,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import PolicyModal from './PolicyModal.jsx';

const typeOptions = [
    { value: 'RADIATION', label: 'Радиация' },
    { value: 'WATER_LEVEL', label: 'Уровень воды' },
    { value: 'LIGHT', label: 'Свет' },

];

const regionOptions = [
    { value: 'RU-MOW', label: 'RU-MOW (Москва)' },
    { value: 'RU-SPE', label: 'RU-SPE (СПб)' },
    { value: 'RU-SAR', label: 'RU-SAR (Саратов)' },
];

const AdminSensors = observer(() => {
    const { sensors } = useStore();
    const { connected } = useSocket();

    const items = sensors.items;
    const isLoading = sensors.isLoading;

    const [opened, { open, close }] = useDisclosure(false);
    const [policyOpened, { open: openPolicy, close: closePolicy }] = useDisclosure(false);
    const [policySensorId, setPolicySensorId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        sensors.loadPublic?.();   // начальная загрузка (PUBLIC REST)
        sensors.initWs?.();       // лайв-подписки
        return () => sensors.destroyWs?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const form = useForm({
        initialValues: { name: '', type: '', lat: null, lng: null, region: '', meta: '{}' },
        validate: {
            name: (v) => (v?.trim().length >= 2 ? null : 'Название минимум 2 символа'),
            type: (v) => (v ? null : 'Укажите тип'),
            lat:  (v) => (typeof v === 'number' && v >= -90 && v <= 90 ? null : 'Широта от -90 до 90'),
            lng:  (v) => (typeof v === 'number' && v >= -180 && v <= 180 ? null : 'Долгота от -180 до 180'),
            region: (v) => (v ? null : 'Выберите регион'),
            meta: (v) => { try { JSON.parse(v || '{}'); return null; } catch { return 'meta должен быть валидным JSON'; } },
        },
    });

    const handleCreate = async () => {
        const validate = form.validate();
        if (validate.hasErrors) return;

        if (!connected) {
            notifications.show({ color: 'red', title: 'WebSocket offline', message: 'Подключение к WS отсутствует' });
            return;
        }

        setSubmitting(true);
        try {
            const res = await sensors.registerSensor(form.values); // ТОЛЬКО WS
            if (res?.ok) {
                notifications.show({ color: 'green', title: 'Отправлено', message: 'Датчик регистрируется…' });
                form.reset(); close();
            }
        } catch (e) {
            notifications.show({ color: 'red', title: 'Ошибка', message: e?.message || 'Не удалось отправить через WS' });
        } finally { setSubmitting(false); }
    };

    const openPolicyFor = (id) => { setPolicySensorId(id); openPolicy(); };

    return (
        <Container fluid>
            <Group justify="space-between" mt="sm" mb="sm">
                <Badge variant="dot" color={connected ? 'green' : 'red'}>
                    {connected ? 'online' : 'offline'}
                </Badge>
                <Button onClick={open}>Зарегистрировать новый датчик</Button>
            </Group>

            <div style={{ position: 'relative' }}>
                <LoadingOverlay visible={!!isLoading} zIndex={1000} />
                <Grid gutter="sm">
                    {items?.map((item, index) => (
                        <Grid.Col key={item.id ?? index} span={{ base: 12, sm: 6, md: 4 }}>
                            <Card withBorder radius="lg">
                                <Group justify="space-between" mb="xs">
                                    <Badge color={item.simulate ? 'green' : 'red'} variant="dot">
                                        {item.simulate ? 'online' : 'offline' ?? 'unknown'}
                                    </Badge>
                                    {item.type && <Badge variant="light">{item.type}</Badge>}
                                </Group>
                                <Stack gap="xs">
                                    <Title order={4}>{item.name || item.title || `Sensor #${item.sensorId}`}</Title>
                                    <Text size="sm" c="dimmed">{item.description ?? `Region: ${item.regionCode ?? '—'}`}</Text>
                                    <Text size="sm">lat: {item.lat ?? '—'},</Text>
                                    <Text size='sm'>lng: {item.lng ?? '—'}</Text>
                                    <Group justify="stretch" mt="xs">
                                        <Button size="xs"  variant="light" onClick={() => openPolicyFor(item.id || item.sensorId)}>Параметры</Button>
                                    </Group>
                                </Stack>
                            </Card>
                        </Grid.Col>
                    ))}
                </Grid>
            </div>

            {/* Модалка создания датчика */}
            <Modal opened={opened} onClose={close} title="Новый датчик" centered size="lg">
                <Stack>
                    <TextInput label="Название" placeholder="RADIATION #99" {...form.getInputProps('name')} />
                    <Select label="Тип" placeholder="Выберите тип" data={typeOptions} searchable {...form.getInputProps('type')} />
                    <Group grow>
                        <NumberInput label="Широта (lat)" placeholder="55.76" allowDecimal decimalScale={6} thousandSeparator={false} {...form.getInputProps('lat')} />
                        <NumberInput label="Долгота (lng)" placeholder="37.64" allowDecimal decimalScale={6} thousandSeparator={false} {...form.getInputProps('lng')} />
                    </Group>
                    <Select label="Регион" placeholder="RU-MOW" data={regionOptions} searchable {...form.getInputProps('region')} />
                    <Textarea label="Meta (JSON)" placeholder='{"note":"расположен на крыше"}' autosize minRows={3} {...form.getInputProps('meta')} />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={close}>Отмена</Button>
                        <Button onClick={handleCreate} loading={submitting}>Создать</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Модалка политики */}
            {policySensorId != null && (
                <PolicyModal sensorId={policySensorId} opened={policyOpened} onClose={closePolicy} />
            )}
        </Container>
    );
});

export default AdminSensors;

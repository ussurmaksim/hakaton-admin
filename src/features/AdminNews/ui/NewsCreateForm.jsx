import { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Button, Group, Stack, TextInput, Textarea, Select, NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useStore } from '@/shared/hooks/UseStore';

const levels = [
    { value: 'HIGH', label: 'Высокий' },
    { value: 'MEDIUM', label: 'Средний' },
    { value: 'LOW', label: 'Низкий' },
];

const kinds = [
    'MAGNETIC_VORTEX',
    'RADIATION_BURST',
    'UFO',
    'METEOR',
    'RADIATION',
    'FIRE',
    'CHEMICAL',
    'FLOOD',
    'UNKNOWN',
].map((k) => ({ value: k, label: k }));

const initial = {
    lat: null,
    lng: null,
    level: '',
    kind: '',
    reason: '',
    region: '',
};

const NewsCreateForm = observer(({ onCreated }) => {
    const { newsAdmin, incidentStore } = useStore(); // incidentStore — лента инцидентов

    const [form, setForm] = useState(initial);
    const [errors, setErrors] = useState({});

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const validate = (f) => {
        const e = {};
        if (!f.level) e.level = 'Выберите уровень';
        if (!f.kind) e.kind = 'Выберите вид';
        if (!String(f.reason || '').trim()) e.reason = 'Укажите причину';
        if (f.lat === null || f.lat === '' || Number.isNaN(Number(f.lat))) e.lat = 'Укажите lat';
        if (f.lng === null || f.lng === '' || Number.isNaN(Number(f.lng))) e.lng = 'Укажите lng';
        if (!String(f.region || '').trim()) e.region = 'Укажите регион';
        return e;
    };

    const isValid = useMemo(() => {
        const e = validate(form);
        setErrors(e);
        return Object.keys(e).length === 0;
    }, [form]);

    const submit = async () => {
        const e = validate(form);
        setErrors(e);
        if (Object.keys(e).length > 0) {
            notifications.show({
                color: 'red',
                title: 'Заполните поля',
                message: 'Проверьте выделенные поля формы.',
            });
            return;
        }

        const payload = {
            lat: Number(form.lat),
            lng: Number(form.lng),
            level: String(form.level),
            kind: String(form.kind),
            reason: String(form.reason).trim(),
            region: String(form.region).trim(),
        };

        const ok = await newsAdmin.create(payload);

        if (ok) {
            // мгновенно отразим в локальной ленте инцидентов
            incidentStore?.setIncidents([payload]);

            notifications.show({
                color: 'green',
                title: 'Готово',
                message: 'Событие создано',
            });
            setForm(initial);
            onCreated?.();
        } else {
            notifications.show({
                color: 'red',
                title: 'Ошибка',
                message: newsAdmin.error ? String(newsAdmin.error) : 'Не удалось создать событие',
            });
        }
    };

    return (
        <Stack>
            <Group grow>
                <Select
                    label="Уровень"
                    placeholder="Выберите уровень"
                    data={levels}
                    value={form.level}
                    onChange={(v) => set('level', v || '')}
                    error={errors.level}
                    clearable
                    searchable
                />
                <Select
                    label="Вид"
                    placeholder="Выберите вид"
                    data={kinds}
                    value={form.kind}
                    onChange={(v) => set('kind', v || '')}
                    error={errors.kind}
                    searchable
                    clearable
                />
            </Group>

            <Textarea
                label="Причина"
                placeholder="Коротко опишите причину"
                value={form.reason}
                onChange={(e) => set('reason', e.currentTarget.value)}
                error={errors.reason}
                autosize
                minRows={2}
            />

            <Group grow>
                <NumberInput
                    label="Широта (lat)"
                    placeholder="например 59.93"
                    value={form.lat}
                    onChange={(v) => set('lat', v)}
                    error={errors.lat}
                    decimalScale={6}
                    allowNegative={false}
                />
                <NumberInput
                    label="Долгота (lng)"
                    placeholder="например 30.33"
                    value={form.lng}
                    onChange={(v) => set('lng', v)}
                    error={errors.lng}
                    decimalScale={6}
                    allowNegative
                />
            </Group>

            <TextInput
                label="Регион (ISO)"
                placeholder="RU-MOW"
                value={form.region}
                onChange={(e) => set('region', e.currentTarget.value)}
                error={errors.region}
            />

            <Group justify="flex-end" mt="sm">
                <Button onClick={submit} loading={newsAdmin.isSubmitting} disabled={!isValid}>
                    Создать событие
                </Button>
            </Group>
        </Stack>
    );
});

export default NewsCreateForm;

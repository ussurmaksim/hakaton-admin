// src/features/AdminNews/ui/NewsCreateForm.jsx
import { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Button, Group, Stack, TextInput, Textarea, Select, NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useStore } from '@/shared/hooks/UseStore';
import { useSocket } from '@/shared/hooks/useSocket';

const levels = [
    { value: 'HIGH', label: 'Высокий' },
    { value: 'MEDIUM', label: 'Средний' },
    { value: 'LOW', label: 'Низкий' },
];

const kinds = ['RADIATION_BURST', 'FIRE', 'FLOOD', 'UNKNOWN'].map((k) => ({ value: k, label: k }));

const initial = {
    lat: null,
    lng: null,
    level: '',
    kind: '',
    reason: '',
    region: 'RU-MOW',
};

const NewsCreateForm = observer(({ onCreated }) => {
    const { newsAdmin } = useStore();
    const { connected, send } = useSocket();

    const [form, setForm] = useState(initial);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    const markTouched = (k) => setTouched((p) => (p[k] ? p : { ...p, [k]: true }));

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

    // Показывать ошибку только если поле тронуто или уже пытались отправить
    const fieldError = (name) => (submitted || touched[name]) ? errors[name] : null;

    const submit = async () => {
        setSubmitted(true);

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
            regionCode: String(form.region).trim(),
            ts: Date.now(),
        };

        setSubmitting(true);
        try {
            let ok = false;

            if (connected) {
                ok = send('/app/incidents/report', payload);
                if (!ok) {
                    notifications.show({
                        color: 'yellow',
                        title: 'Сокет недоступен',
                        message: 'Попробую через REST…',
                    });
                }
            }

            if (!ok) {
                const res = await newsAdmin.create(payload);
                ok = !!res;
            }

            if (ok) {
                notifications.show({
                    color: 'green',
                    title: 'Готово',
                    message: connected ? 'Событие отправлено по WebSocket' : 'Событие создано (REST)',
                });
                setForm({...initial});
                setErrors({})
                setTouched({});
                setSubmitted(false);
                onCreated?.();
            } else {
                notifications.show({
                    color: 'red',
                    title: 'Ошибка',
                    message: newsAdmin.error ? String(newsAdmin.error) : 'Не удалось создать событие',
                });
            }
        } catch (err) {
            notifications.show({
                color: 'red',
                title: 'Ошибка',
                message: String(err?.message || err),
            });
        } finally {
            setSubmitting(false);
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
                    onChange={(v) => { set('level', v || ''); markTouched('level'); }}
                    onDropdownClose={() => markTouched('level')}
                    error={fieldError('level')}
                    clearable
                />
                <Select
                    label="Вид"
                    placeholder="Выберите вид"
                    data={kinds}
                    value={form.kind}
                    onChange={(v) => { set('kind', v || ''); markTouched('kind'); }}
                    onDropdownClose={() => markTouched('kind')}
                    error={fieldError('kind')}
                    clearable
                />
            </Group>

            <Textarea
                label="Причина"
                placeholder="Коротко опишите причину"
                value={form.reason}
                onChange={(e) => set('reason', e.currentTarget.value)}
                onBlur={() => markTouched('reason')}
                error={fieldError('reason')}
                autosize
                minRows={2}
            />

            <Group grow>
                <NumberInput
                    label="Широта (lat)"
                    placeholder="например 55.75"
                    value={form.lat}
                    onChange={(v) => set('lat', v)}
                    onBlur={() => markTouched('lat')}
                    error={fieldError('lat')}
                    decimalScale={6}
                    allowNegative={false}
                />
                <NumberInput
                    label="Долгота (lng)"
                    placeholder="например 37.62"
                    value={form.lng}
                    onChange={(v) => set('lng', v)}
                    onBlur={() => markTouched('lng')}
                    error={fieldError('lng')}
                    decimalScale={6}
                    allowNegative
                />
            </Group>

            <TextInput
                label="Регион (ISO)"
                placeholder="RU-MOW"
                value={form.region}
                onChange={(e) => set('region', e.currentTarget.value)}
                onBlur={() => markTouched('region')}
                error={fieldError('region')}
            />

            <Group justify="space-between" mt="sm">
                <Button variant={connected ? 'light' : 'outline'} disabled>
                    {connected ? 'WebSocket: online' : 'WebSocket: offline'}
                </Button>
                <Button onClick={submit} loading={submitting} /* можно не дизейблить: пусть проверяет по submit */
                >
                    Создать событие
                </Button>
            </Group>
        </Stack>
    );
});

export default NewsCreateForm;

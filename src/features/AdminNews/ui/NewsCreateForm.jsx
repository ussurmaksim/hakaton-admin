import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Button, Group, Stack, TextInput, Textarea, Select, Switch, NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useStore } from '@/shared/hooks/UseStore';

const severities = [
    { value: 'INFO', label: 'Info' },
    { value: 'WARNING', label: 'Warning' },
    { value: 'CRITICAL', label: 'Critical' },
];

const initial = {
    title: '',
    message: '',
    severity: 'INFO',
    lat: null,
    lng: null,
    publishNow: true,
};

const NewsCreateForm = observer(({ onCreated }) => {
    const { newsAdmin } = useStore();

    const [form, setForm] = useState(initial);
    const [errors, setErrors] = useState({});

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.title?.trim()) e.title = 'Введите заголовок';
        if (!form.message?.trim()) e.message = 'Введите текст';
        if (!form.severity) e.severity = 'Выберите уровень';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = async () => {
        if (!validate()) return;

        const ok = await newsAdmin.create(form);

        if (ok) {
            notifications.show({
                color: 'green',
                title: 'Готово',
                message: 'Новость создана',
            });
            setForm(initial);
            onCreated?.();
        } else {
            notifications.show({
                color: 'red',
                title: 'Ошибка',
                message: newsAdmin.error
                    ? String(newsAdmin.error)
                    : 'Не удалось создать новость',
            });
        }
    };

    return (
        <Stack>
            <TextInput
                label="Заголовок"
                placeholder="Короткое название события"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                error={errors.title}
                required
            />
            <Textarea
                label="Текст"
                placeholder="Описание события…"
                minRows={3}
                autosize
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                error={errors.message}
                required
            />
            <Group grow>
                <Select
                    label="Уровень"
                    data={severities}
                    value={form.severity}
                    onChange={(v) => set('severity', v)}
                    error={errors.severity}
                    required
                />
                <NumberInput
                    label="Широта (lat)"
                    placeholder="например 59.93"
                    value={form.lat}
                    onChange={(v) => set('lat', v)}
                    allowDecimal
                />
                <NumberInput
                    label="Долгота (lng)"
                    placeholder="например 30.33"
                    value={form.lng}
                    onChange={(v) => set('lng', v)}
                    allowDecimal
                />
            </Group>

            <Switch
                label="Сразу опубликовать (рассылка по WS)"
                checked={form.publishNow}
                onChange={(e) => set('publishNow', e.currentTarget.checked)}
            />

            <Group justify="flex-end" mt="sm">
                <Button onClick={submit} loading={newsAdmin.isSubmitting}>
                    Создать новость
                </Button>
            </Group>
        </Stack>
    );
});

export default NewsCreateForm;

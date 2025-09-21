import { useEffect } from 'react';
import { Button, Group, Modal, NumberInput, Select, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/shared/hooks/useStore.js';
import { notifications } from '@mantine/notifications';

const modes = [
    { value: 'AUTO', label: 'AUTO' },
    { value: 'MANUAL', label: 'MANUAL' },
];

const PolicyModal = observer(({ sensorId, opened, onClose }) => {
    const { sensors } = useStore();
    const loading = sensors.policyLoading.get(sensorId) || false;
    const serverErr = sensors.policyError.get(sensorId) || null;
    const policy = sensors.policyById.get(sensorId) || null;

    const form = useForm({
        initialValues: {
            mode: 'AUTO',
            alertAbove: null,
            warnAbove: null,
            clearBelow: null,
            ttlSec: 3600,
        },
        validate: {
            mode: (v) => (v ? null : 'Укажите режим'),
            ttlSec: (v) => (v == null || v >= 0 ? null : '>= 0'),
        },
    });

    useEffect(() => {
        if (!opened || !sensorId) return;

        // 1) если политика уже есть в сторе — сразу подставим
        const cached = sensors.policyById.get(sensorId);
        if (cached) {
            form.setValues({
                mode: cached.mode ?? 'AUTO',
                alertAbove: cached.alertAbove ?? null,
                warnAbove: cached.warnAbove ?? null,
                clearBelow: cached.clearBelow ?? null,
                ttlSec: cached.ttlSec ?? 3600,
            });
            form.resetDirty();
        }

        // 2) и всё равно дернём загрузку (WS/REST) — на случай, если на бэке поменялась
        (async () => {
            try {
                const p = await sensors.getPolicy(sensorId); // ← возвращает саму политику
                if (p) {
                    form.setValues({
                        mode: p.mode ?? 'AUTO',
                        alertAbove: p.alertAbove ?? null,
                        warnAbove: p.warnAbove ?? null,
                        clearBelow: p.clearBelow ?? null,
                        ttlSec: p.ttlSec ?? 3600,
                    });
                    form.resetDirty();
                }
            } catch (e) {
                // ошибка уже показана через notifications из стора, здесь можно тихо игнорить
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, sensorId]);


    useEffect(() => {
        if (serverErr) notifications.show({ color: 'red', title: 'Ошибка', message: String(serverErr) });
    }, [serverErr]);

    const onSave = async () => {
        const v = form.validate();
        if (v.hasErrors) return;
        const { ok, error } = await sensors.savePolicy(sensorId, form.values);
        if (ok) {
            notifications.show({ color: 'green', title: 'Сохранено', message: 'Политика обновлена' });
            form.resetDirty();
            onClose?.();
        } else {
            notifications.show({ color: 'red', title: 'Ошибка сохранения', message: String(error || 'Ошибка') });
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title={`Политика датчика #${sensorId}`} centered size="lg">
            <Stack>
                <Select label="Режим" data={modes} {...form.getInputProps('mode')} />
                <Group grow>
                    <NumberInput label="alertAbove" allowDecimal decimalScale={3} {...form.getInputProps('alertAbove')} />
                    <NumberInput label="warnAbove" allowDecimal decimalScale={3} {...form.getInputProps('warnAbove')} />
                    <NumberInput label="clearBelow" allowDecimal decimalScale={3} {...form.getInputProps('clearBelow')} />
                </Group>
                <NumberInput label="ttlSec" allowDecimal={false} min={0} {...form.getInputProps('ttlSec')} />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose}>Отмена</Button>
                    <Button onClick={onSave} loading={loading} disabled={!form.isDirty() && !!policy}>Сохранить</Button>
                </Group>
            </Stack>
        </Modal>
    );
});

export default PolicyModal;

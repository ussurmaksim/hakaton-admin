import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/shared/hooks/useStore.js';
import { Button, Group, Modal, NumberInput, Select, Stack, Switch, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

const modes = [
    { value: 'AUTO', label: 'AUTO' },
    { value: 'MANUAL', label: 'MANUAL' },
];
const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(v => ({ value: v, label: v }));
const kinds  = ['FIRE','SMOKE','FLOOD','AIR_QUALITY','INTRUSION','UNKNOWN'].map(v => ({ value: v, label: v }));

const CameraPolicyModal = observer(({ cameraId, opened, onClose }) => {
    const { cameras } = useStore();

    const loading = cameras.policyLoading.get(cameraId) || false;
    const policy  = cameras.policyById.get(cameraId) || null;
    const serverErr = cameras.policyError.get(cameraId) || null;

    const form = useForm({
        initialValues: {
            enabled: true,
            mode: 'AUTO',
            intervalSec: 60,
            okRegex: '',
            hitRegex: '',
            incidentKind: 'FIRE',
            incidentLevel: 'HIGH',
            ttlSec: 900,
        },
        validate: {
            mode: (v) => (v ? null : 'Укажите режим'),
            intervalSec: (v) => (v >= 5 ? null : '>= 5 сек'),
            ttlSec: (v) => (v >= 0 ? null : '>= 0'),
        },
    });

    useEffect(() => {
        if (!opened || !cameraId) return;

        const cached = cameras.policyById.get(cameraId);
        if (cached) {
            form.setValues(cached);
            form.resetDirty();
        }

        (async () => {
            try {
                const p = await cameras.getPolicy(cameraId);
                if (p) { form.setValues(p); form.resetDirty(); }
            } catch {}
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, cameraId]);

    useEffect(() => {
        if (serverErr) notifications.show({ color: 'red', title: 'Ошибка', message: String(serverErr) });
    }, [serverErr]);

    const onSave = async () => {
        const v = form.validate(); if (v.hasErrors) return;
        try {
            const { ok } = await cameras.savePolicy(cameraId, form.values);
            if (ok) {
                notifications.show({ color: 'green', title: 'Сохранено', message: 'Политика обновлена' });
                form.resetDirty();
                onClose?.();
            }
        } catch (e) {
            notifications.show({ color: 'red', title: 'Ошибка', message: String(e?.message || e) });
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title={`Политика камеры #${cameraId}`} centered size="lg">
            <Stack>
                <Switch label="Включена" {...form.getInputProps('enabled', { type: 'checkbox' })} />
                <Group grow>
                    <Select label="Режим" data={modes} {...form.getInputProps('mode')} />
                    <NumberInput label="Интервал (сек)" min={5} {...form.getInputProps('intervalSec')} />
                    <NumberInput label="TTL инцидента (сек)" min={0} {...form.getInputProps('ttlSec')} />
                </Group>
                <Group grow>
                    <TextInput label="OK regex" placeholder="(?i)\bok\b" {...form.getInputProps('okRegex')} />
                    <TextInput label="HIT regex" placeholder="(?i)дым|пламя" {...form.getInputProps('hitRegex')} />
                </Group>
                <Group grow>
                    <Select label="Вид инцидента" data={kinds} {...form.getInputProps('incidentKind')} />
                    <Select label="Уровень" data={levels} {...form.getInputProps('incidentLevel')} />
                </Group>
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose}>Отмена</Button>
                    <Button onClick={onSave} loading={loading} disabled={!form.isDirty() && !!policy}>Сохранить</Button>
                </Group>
            </Stack>
        </Modal>
    );
});

export default CameraPolicyModal;

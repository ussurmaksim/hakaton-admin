import { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Button,
    Group,
    Stack,
    TextInput,
    NumberInput,
    Select,
    Paper,
    Table,
    ActionIcon,
    Tooltip,
    Textarea,
    Divider,
    ScrollArea,
    Badge,
    Title,
    Code,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Minus, Plus, Upload, Trash2, ClipboardPaste, ArrowLeft } from 'lucide-react';
import { useStore } from '@/shared/hooks/UseStore.js';
import {useNavigate} from "react-router-dom";

const typeOptions = [
    { value: 'SHELTER', label: 'Убежище' },
    { value: 'PHARMACY', label: 'Аптека' },
];

const emptyRow = {
    type: '',
    name: '',
    address: '',
    lat: null,
    lng: null,
    capacity: 0,
    regionCode: '',
};

const AdminPlacesImportForm = observer(() => {
    const store = useStore()?.places; // если не нужен — можно не использовать
    const [rows, setRows] = useState([{ ...emptyRow }]);
    const [bulkText, setBulkText] = useState('');

    const nav = useNavigate();

    const setCell = (idx, key, val) => {
        setRows((prev) => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [key]: val };
            return copy;
        });
    };

    const addRow = () => setRows((prev) => [...prev, { ...emptyRow }]);
    const removeRow = (idx) =>
        setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

    const clearAll = () => setRows([{ ...emptyRow }]);

    const validateRow = (row) => {
        const e = {};
        if (!row.type) e.type = 'Укажите тип';
        if (!row.name?.trim()) e.name = 'Укажите название';
        if (!row.address?.trim()) e.address = 'Укажите адрес';
        if (row.lat === null || Number.isNaN(Number(row.lat))) e.lat = 'lat обязателен';
        if (row.lng === null || Number.isNaN(Number(row.lng))) e.lng = 'lng обязателен';
        if (!row.regionCode?.trim()) e.regionCode = 'Укажите регион';
        if (row.capacity !== null && row.capacity !== undefined) {
            const c = Number(row.capacity);
            if (Number.isNaN(c) || c < 0) e.capacity = 'capacity ≥ 0';
        }
        return e;
    };

    const errors = useMemo(() => rows.map(validateRow), [rows]);
    const hasErrors = errors.some((e) => Object.keys(e).length > 0);

    const pasteJson = () => {
        try {
            const data = JSON.parse(bulkText);
            if (!Array.isArray(data)) {
                notifications.show({
                    color: 'red',
                    title: 'Ожидался массив',
                    message: 'Вставьте JSON-массив объектов мест.',
                });
                return;
            }
            const normalized = data.map((r) => ({
                type: r.type ?? '',
                name: r.name ?? '',
                address: r.address ?? '',
                lat: r.lat ?? null,
                lng: r.lng ?? null,
                capacity: r.capacity ?? 0,
                regionCode: r.regionCode ?? '',
            }));
            setRows(normalized.length ? normalized : [{ ...emptyRow }]);
            notifications.show({ color: 'teal', title: 'Готово', message: `Загружено строк: ${normalized.length}` });
        } catch (e) {
            notifications.show({ color: 'red', title: 'Ошибка JSON', message: String(e.message || e) });
        }
    };

    const importAll = async () => {
        try {
            if (!rows.length) {
                notifications.show({ color: 'yellow', title: 'Пусто', message: 'Добавьте хотя бы одну строку.' });
                return;
            }
            if (hasErrors) {
                notifications.show({ color: 'red', title: 'Исправьте ошибки', message: 'Некоторые строки заполнены некорректно.' });
                return;
            }

            const payload = rows.map((r) => ({
                type: r.type,
                name: r.name.trim(),
                address: r.address.trim(),
                lat: Number(r.lat),
                lng: Number(r.lng),
                capacity: Number(r.capacity ?? 0),
                regionCode: r.regionCode.trim(),
            }));

            const res = await store.createPlaces(payload); // <-- await!

            if (res?.data?.imported >= 0) {
                notifications.show({
                    color: 'teal',
                    title: 'Импорт завершён',
                    message: `Импортировано: ${res.data.imported}`,
                });
                await store?.load?.(); // если есть
                clearAll();
                setBulkText('');
            } else {
                const msg = res?.message || 'Неизвестная ошибка';
                notifications.show({ color: 'red', title: 'Ошибка импорта', message: msg });
            }
        } catch (e) {
            notifications.show({
                color: 'red',
                title: 'Импорт не выполнен',
                message: String(e?.message ?? e),
            });
            console.error(e);
        }
    };

    const header = (
        <Table.Thead>
            <Table.Tr>
                <Table.Th>Тип</Table.Th>
                <Table.Th>Название</Table.Th>
                <Table.Th>Адрес</Table.Th>
                <Table.Th>Lat</Table.Th>
                <Table.Th>Lng</Table.Th>
                <Table.Th>Вместимость</Table.Th>
                <Table.Th>Регион</Table.Th>
                <Table.Th style={{ width: 56 }}></Table.Th>
            </Table.Tr>
        </Table.Thead>
    );

    return (
        <Stack>
            <Group justify="flex-start">
                <Button
                    onClick={() => nav(-1)}
                    variant="transparent"
                    leftSection={<ArrowLeft size={14} />}
                >
                    Назад
                </Button>
            </Group>
            <Group justify="space-between" align="center">
                <Title order={3}>Импорт мест</Title>
                <Group>
                    <Tooltip label="Добавить строку">
                        <ActionIcon variant="light" onClick={addRow} aria-label="add-row">
                            <Plus size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Очистить всё">
                        <ActionIcon variant="light" color="red" onClick={clearAll} aria-label="clear-all">
                            <Trash2 size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Button leftSection={<Upload size={16} />} onClick={importAll}>
                        Импортировать {rows.length ? `(${rows.length})` : ''}
                    </Button>
                </Group>
            </Group>

            <Paper withBorder radius="md" p="sm">
                <ScrollArea h={360}>
                    <Table striped withTableBorder withColumnBorders highlightOnHover stickyHeader>
                        {header}
                        <Table.Tbody>
                            {rows.map((row, idx) => {
                                const e = errors[idx];
                                return (
                                    <Table.Tr key={idx}>
                                        <Table.Td>
                                            <Select
                                                placeholder="Тип"
                                                data={typeOptions}
                                                value={row.type}
                                                onChange={(v) => setCell(idx, 'type', v)}
                                                error={e.type}
                                                searchable
                                                clearable
                                            />
                                        </Table.Td>
                                        <Table.Td>
                                            <TextInput
                                                placeholder="Название"
                                                value={row.name}
                                                onChange={(ev) => setCell(idx, 'name', ev.currentTarget.value)}
                                                error={e.name}
                                            />
                                        </Table.Td>
                                        <Table.Td>
                                            <TextInput
                                                placeholder="Адрес"
                                                value={row.address}
                                                onChange={(ev) => setCell(idx, 'address', ev.currentTarget.value)}
                                                error={e.address}
                                            />
                                        </Table.Td>
                                        <Table.Td>
                                            <NumberInput
                                                placeholder="55.75"
                                                value={row.lat}
                                                onChange={(v) => setCell(idx, 'lat', v)}
                                                error={e.lat}
                                                decimalScale={6}
                                                allowNegative={false}
                                            />
                                        </Table.Td>
                                        <Table.Td>
                                            <NumberInput
                                                placeholder="37.62"
                                                value={row.lng}
                                                onChange={(v) => setCell(idx, 'lng', v)}
                                                error={e.lng}
                                                decimalScale={6}
                                                allowNegative
                                            />
                                        </Table.Td>
                                        <Table.Td>
                                            <NumberInput
                                                placeholder="0"
                                                value={row.capacity}
                                                onChange={(v) => setCell(idx, 'capacity', v ?? 0)}
                                                error={e.capacity}
                                                min={0}
                                                step={1}
                                            />
                                        </Table.Td>
                                        <Table.Td>
                                            <TextInput
                                                placeholder="RU-MOW"
                                                value={row.regionCode}
                                                onChange={(ev) => setCell(idx, 'regionCode', ev.currentTarget.value)}
                                                error={e.regionCode}
                                            />
                                        </Table.Td>
                                        <Table.Td>
                                            <Tooltip label="Удалить строку">
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="red"
                                                    onClick={() => removeRow(idx)}
                                                    aria-label="remove-row"
                                                >
                                                    <Minus size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>

                <Group mt="sm" gap="xs">
                    <Badge variant={hasErrors ? 'light' : 'filled'} color={hasErrors ? 'red' : 'teal'}>
                        {hasErrors ? 'Исправьте ошибки' : 'Готово к импорту'}
                    </Badge>
                    <Code>{rows.length} элемент(ов)</Code>
                </Group>
            </Paper>

            <Divider label="Быстрая вставка JSON" />
            <Stack>
                <Textarea
                    placeholder={`Вставь массив объектов в формате API:
[
  {"type":"SHELTER","name":"Убежище №1","address":"ул. Примерная, 5","lat":55.7,"lng":37.6,"capacity":120,"regionCode":"RU-MOW"},
  {"type":"PHARMACY","name":"Аптека №12","address":"ул. Ленина, 10","lat":55.8,"lng":37.7,"capacity":0,"regionCode":"RU-MOW"}
]`}
                    autosize
                    minRows={4}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.currentTarget.value)}
                />
                <Group>
                    <Button variant="light" leftSection={<ClipboardPaste size={16} />} onClick={pasteJson}>
                        Заполнить из JSON
                    </Button>
                    <Button variant="default" onClick={() => setBulkText('')}>
                        Очистить поле
                    </Button>
                </Group>
            </Stack>
        </Stack>
    );
});

export default AdminPlacesImportForm;

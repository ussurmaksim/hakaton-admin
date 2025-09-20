import { useDisclosure } from '@mantine/hooks';
import { useStore } from "@/shared/hooks/UseStore.js";
import { Badge, Card, Container, Grid, Stack, Text, Title, Group, Button, Modal } from '@mantine/core';
import {useState} from "react";
import {observer} from "mobx-react-lite";

const initial = {
    name: '',
    type: '', // select
    lat: null,
    lng: null,
    region: '', // select
    meta: ''
}

const AdminSensors = observer(() => {
    const store = useStore().sensors;
    const { items } = store;

    const [opened, { open, close }] = useDisclosure(false);

    const [form, setForm] = useState({})

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));


    return (
        <Container fluid>
            <Group justify="flex-end" mt="sm">
                <Button onClick={open}>
                    Зарегистрировать новый датчик
                </Button>
            </Group>

            <Grid spacing={2}>
                {items.map((item, index) => (
                    <Grid.Col key={item.id ?? index} span={4}>
                        <Card withBorder radius="lg">
                            <Group>
                                <Badge color={item.status === 'active' ? 'green' : 'red'} variant="dot">
                                    {item.status}
                                </Badge>
                            </Group>
                            <Stack>
                                <Title order={4}>{item.title}</Title>
                                <Text>{item.description}</Text>
                            </Stack>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>

            <Modal opened={opened} onClose={close} title="Новый датчик" centered>
                {/* TODO: здесь будет форма создания датчика */}
                <Text c="dimmed" size="sm">
                    Здесь будет форма регистрации датчика.
                </Text>
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={close}>Отмена</Button>
                    <Button disabled>Создать</Button>
                </Group>
            </Modal>
        </Container>
    );
})

export default AdminSensors;

// pages/AdminDashboard/AdminDashboard.jsx
import { observer } from 'mobx-react-lite';
import {Accordion, Container, Divider, Grid, Text} from '@mantine/core';
import LiveFeedPanel from '@/features/AdminNews/ui/LiveFeedPanel.jsx';
import NewsCreateForm from "@/features/AdminNews/ui/NewsCreateForm.jsx";

const AdminDashboard = observer(() => (
    <Container size="lg" py="xl">
        <Accordion variant="separated" chevronPosition="right" multiple={false}>
            <Accordion.Item value="create">
                <Accordion.Control>
                    <Text fw={500}>Создать событие</Text>
                </Accordion.Control>
                <Accordion.Panel>
                    <NewsCreateForm onCreated={() => { /* при необходимости можно обновить список из API */ }} />
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
        <Divider my="sm" />
        <LiveFeedPanel />
    </Container>
));

export default AdminDashboard;

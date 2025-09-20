// pages/AdminDashboard/AdminDashboard.jsx
import { observer } from 'mobx-react-lite';
import { Container, Grid } from '@mantine/core';
import LiveFeedPanel from '@/features/AdminNews/ui/LiveFeedPanel.jsx';

const AdminDashboard = observer(() => (
    <Container size="lg" py="xl">
        <Grid>
            <Grid.Col span={12} md={8}>
                <LiveFeedPanel />
            </Grid.Col>
            <Grid.Col span={12} md={4}>{/* другие виджеты */}</Grid.Col>
        </Grid>
    </Container>
));

export default AdminDashboard;

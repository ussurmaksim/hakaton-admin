import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Container, Grid } from '@mantine/core';
import { useStore } from '@/shared/hooks/UseStore';
import NewsPanel from '@/features/AdminNews/ui/AdminNewsPage.jsx';

const AdminDashboard = observer(() => {
    const store = useStore();
    const news = store?.news;
    const token = store?.adminAuth?.account?.token || localStorage.getItem('accessToken') || null;

    useEffect(() => {
        if (!news) return;
        // ⬇️ ВАЖНО: deps = [] — подключаемся один раз при заходе на страницу
        news.connect({ url: import.meta.env.VITE_WS_URL, token, useSockJS: true });
        return () => news.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ← только mount/unmount!

    return (
        <Container size="lg" py="xl">
            <Grid>
                <Grid.Col span={12} md={6}>
                    <NewsPanel />
                </Grid.Col>
                <Grid.Col span={12} md={6}>{/* другие виджеты */}</Grid.Col>
            </Grid>
        </Container>
    );
});

export default AdminDashboard;

import { Container, Grid } from '@mantine/core';
import AIDigestCard from '@/features/AIDigest/ui/AIDigestCard.jsx';
import AIDigestList from '@/features/AIDigest/ui/AIDigestList.jsx';

const AIDigestPage = () => (
    <Container fluid>
        <Grid gutter="md">
            <Grid.Col span={{ base: 12, lg: 4 }}>
                <AIDigestCard />
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 8 }}>
                <AIDigestList />
            </Grid.Col>
        </Grid>
    </Container>
);

export default AIDigestPage;

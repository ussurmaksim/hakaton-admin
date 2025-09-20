import {Title, Container, Stack, Button, Paper} from "@mantine/core";
import {useNavigate} from "react-router-dom";
import {STATIC_LINKS} from "@/shared/constants/staticLinks.js";

const NotFound =() => {
    const nav = useNavigate();
    return (
        <Container fluid mt={100}>
            <Paper shadow="sm" p="md" radius="md" elevation="md" maw={500} mx="auto">
                <Stack gap="md" justify="center" align="center">
                    <Title order={2}>404 страница не найдена</Title>
                    <Button onClick={()=> nav(STATIC_LINKS.ADMIN_LOGIN)}>К входу</Button>
                </Stack>
            </Paper>
        </Container>
    )
}

export default NotFound;
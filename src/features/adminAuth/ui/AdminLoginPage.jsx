import { Card, TextInput, PasswordInput, Button, Stack, Title } from '@mantine/core';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/shared/hooks/UseStore';
import { STATIC_LINKS } from '@/shared/constants/staticLinks';
import { notifications } from '@mantine/notifications';

const AdminLoginPage = observer(() => {
    const { adminAuth } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || STATIC_LINKS.ADMIN_ROOT;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        try {
            await adminAuth.login({ email, password }); // твоя реализация
            notifications.show({ title: 'Успех', message: 'Вход выполнен' });
            navigate(from, { replace: true });
        } catch (e) {
            console.error(e)
            notifications.show({ title: 'Ошибка', message: 'Неверные данные', color: 'red' });
        }
    };

    return (
        <Card maw={420} mx="auto" withBorder shadow="sm" p="lg" mt="xl" component="form" onSubmit={submit}>
            <Stack>
                <Title order={3} ta="center">Вход в админку</Title>
                <TextInput
                    label="Email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <PasswordInput
                    label="Пароль"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="submit" loading={adminAuth.isLoading}>Войти</Button>
            </Stack>
        </Card>
    );
});

export default AdminLoginPage;

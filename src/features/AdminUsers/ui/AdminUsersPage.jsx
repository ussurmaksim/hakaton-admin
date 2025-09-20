import {Button, Pagination, Stack, Table, Group, Loader} from "@mantine/core";
import {observer} from "mobx-react-lite";
import {useStore} from "@/shared/hooks/UseStore.js";
import {useNavigate} from "react-router-dom";
import {useEffect} from "react";

const AdminUsersPage = observer(() => {
    const store = useStore().adminUsers;
    const nav = useNavigate();

    const {users, isLoading, page, size, totalPages} = store;

    useEffect(() => {
        store.getUsers(0,size)
    },[])

    const handlePage = (pageUI) => {
        store.setPage(pageUI-1);
        store.getUsers(pageUI-1, size)
    }

    if (isLoading) {
        return (
            <Stack align="center" justify="center" h="100vh">
                <Loader size='lg'/>
            </Stack>
        )
    }

    return (
        <>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>
                            ID
                        </Table.Th>
                        <Table.Th>
                            Name
                        </Table.Th>
                        <Table.Th>
                            Email
                        </Table.Th>
                        <Table.Th/>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {users.map((user, index) => {
                        return(
                        <Table.Tr key={index}>
                            <Table.Td>
                                {user.id}
                            </Table.Td>
                            <Table.Td>
                                {user.name}
                            </Table.Td>
                            <Table.Td>
                                {user.email}
                            </Table.Td>
                            <Table.Td>
                                <Button
                                    onClick={() => {
                                        nav('/')
                                    }}
                                    variant='transparent'
                                >
                                    Редактировать
                                </Button>
                            </Table.Td>
                        </Table.Tr>
                    )})}
                </Table.Tbody>
                <Group>
                    <Pagination
                        total={totalPages}
                        value={page + 1}
                        onChange={handlePage}
                    />
                </Group>
            </Table>
        </>
    )
})

export default AdminUsersPage;
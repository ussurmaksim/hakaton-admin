import {observer} from "mobx-react-lite";
import {useParams} from "react-router-dom";
import {Container, Title} from '@mantine/core'

const UsersForm = observer(() => {
    const {id} = useParams();
    const isEdit = Boolean(id);

    return (
        <Container fluid>
            <Title order={2}>
                {isEdit ? 'Edit User' : 'Add User'}
            </Title>
        </Container>
    )
})

export default UsersForm;
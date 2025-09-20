import {Button, Container} from "@mantine/core";
import {observer} from "mobx-react-lite";
import AdminPlacesForm from "@/features/AdminPlaces/ui/AdminPlacesForm.jsx";
import {useNavigate} from "react-router-dom";
import {STATIC_LINKS} from "@/shared/constants/staticLinks.js";

const AdminPlaces = observer(() => {
    const nav = useNavigate();
    return (
        <Container fluid>
            <Button onClick={() => nav(STATIC_LINKS.ADMIN_PLACES_CREATE)}>Импортировать места</Button>
        </Container>
    )
})

export default AdminPlaces
import { AdminLayout } from "../../../components/Admin/AdminLayout";
import { RequestsView } from "../../../components/Admin/Requests/RequestsView";

export default function AdminRequestsPage() {
    return (
        <AdminLayout>
            <RequestsView />
        </AdminLayout>
    );
}

AdminRequestsPage.auth = {
    role: "admin",
    admin: true,
    loading: <div>loading...</div>,
};

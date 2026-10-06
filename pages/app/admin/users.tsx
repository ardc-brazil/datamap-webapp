import { AdminEmptyState } from "../../../components/Admin/AdminEmptyState";
import { AdminLayout } from "../../../components/Admin/AdminLayout";
import { ADMIN_COPY } from "../../../contants/AdminConstants";

export default function AdminUsersPage() {
    return (
        <AdminLayout>
            <AdminEmptyState title={ADMIN_COPY.usersTitle} text={ADMIN_COPY.usersEmpty} />
        </AdminLayout>
    );
}

AdminUsersPage.auth = {
    role: "admin",
    admin: true,
    loading: <div>loading...</div>,
};

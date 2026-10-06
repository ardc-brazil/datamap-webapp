import { AdminEmptyState } from "../../../components/Admin/AdminEmptyState";
import { AdminLayout } from "../../../components/Admin/AdminLayout";
import { ADMIN_COPY } from "../../../contants/AdminConstants";

export default function AdminActivityPage() {
    return (
        <AdminLayout>
            <AdminEmptyState title={ADMIN_COPY.activityTitle} text={ADMIN_COPY.activityEmpty} />
        </AdminLayout>
    );
}

AdminActivityPage.auth = {
    role: "admin",
    admin: true,
    loading: <div>loading...</div>,
};

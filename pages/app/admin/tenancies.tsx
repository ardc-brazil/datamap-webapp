import { AdminLayout } from "../../../components/Admin/AdminLayout";
import { TenanciesView } from "../../../components/Admin/Tenancies/TenanciesView";

export default function AdminTenanciesPage() {
    return (
        <AdminLayout>
            <TenanciesView />
        </AdminLayout>
    );
}

AdminTenanciesPage.auth = {
    role: "admin",
    admin: true,
    loading: <div>loading...</div>,
};

import { AdminPageHeader } from "./AdminPageHeader";

interface Props {
    title: string
    text: string
}

export function AdminEmptyState({ title, text }: Props) {
    return (
        <div className="w-full">
            <AdminPageHeader title={title} />
            <p className="m-0 mt-8 rounded-lg border border-primary-200 bg-primary-0 px-6 py-12 text-center text-sm text-primary-500">{text}</p>
        </div>
    );
}

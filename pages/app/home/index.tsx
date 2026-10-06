import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { MaterialSymbol, SymbolCodepoints } from 'react-material-symbols';
import LoggedLayout from '../../../components/LoggedLayout';
import { TenancyInvitationsPanel } from '../../../components/Tenancy/TenancyInvitationsPanel';
import { TenancyRequestNotice } from '../../../components/Tenancy/TenancyRequestStatus';
import { ROUTE_PAGE_DATASETS, ROUTE_PAGE_DATASETS_NEW, ROUTE_PAGE_NOTEBOOKS, ROUTE_PAGE_PROFILE } from '../../../contants/InternalRoutesConstants';

export default function HomePage() {
    const { data: session } = useSession();

    return (
        <LoggedLayout noPadding={false}>
            <div className="w-full max-w-5xl mx-auto">
                <h2 className="m-0">Welcome, {session.user.name}!</h2>
                <p className="mt-2 mb-0 text-[15px] leading-[23px] text-primary-600">
                    Step into the world of scientific data analysis with DataMap, where data exploration becomes a breeze.
                </p>

                <TenancyInvitationsPanel className="mt-8" />
                <TenancyRequestNotice className="mt-4" />

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Shortcut href={ROUTE_PAGE_DATASETS} icon="database" title="Browse datasets" text="Search and filter the catalog." />
                    <Shortcut href={ROUTE_PAGE_DATASETS_NEW} icon="add" title="New dataset" text="Upload files and describe them." />
                    <Shortcut href={ROUTE_PAGE_NOTEBOOKS} icon="code" title="Notebooks" text="Analyse data where it lives." />
                    <Shortcut href={ROUTE_PAGE_PROFILE} icon="person" title="Profile" text="Your account and tenancies." />
                </div>
            </div>
        </LoggedLayout>
    )
}

function Shortcut(props: { href: string, icon: SymbolCodepoints, title: string, text: string }) {
    return (
        <Link href={props.href} className="flex flex-col gap-6 rounded-lg border border-primary-200 bg-primary-0 p-5 hover:border-primary-400 hover:text-primary-900">
            <MaterialSymbol icon={props.icon} size={22} weight={400} grade={-25} className="text-primary-700" />
            <span className="flex flex-col gap-1">
                <span className="text-[15px] font-semibold text-primary-900">{props.title}</span>
                <span className="text-[13px] font-normal leading-[19px] text-primary-600">{props.text}</span>
            </span>
        </Link>
    );
}

HomePage.auth = {
    role: "admin",
    loading: <div>loading...</div>,
};

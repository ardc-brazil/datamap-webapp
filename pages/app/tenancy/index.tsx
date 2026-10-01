import { useSession } from "next-auth/react";
import Router from "next/router";
import { MaterialSymbol } from "react-material-symbols";
import Link from "next/link";
import { Logo } from "../../../components/Brand/Logo";
import AvatarButton from "../../../components/Profile/AvatarButton";
import { AccessPending } from "../../../components/Tenancy/AccessPending";
import { useTenancyStore } from "../../../components/TenancyStore";
import { ROUTE_PAGE_HOME } from "../../../contants/InternalRoutesConstants";
import { NewContext } from "../../../lib/appLocalContext";
import { trackUiEvent } from "../../../lib/telemetryClient";
import { getUserByUID } from "../../../lib/users";
import { logError } from "../../../lib/logging";


interface TenancySelectorPageProps {
    data?: any
}

export default function TenancySelectorPage(props: TenancySelectorPageProps) {
    const { data: session, status } = useSession();
    const setTenancySelected = useTenancyStore((state) => state.setTenancySelected)

    function onTenancySelected(tenancy) {
        trackUiEvent("tenancy_switched")
        setTenancySelected(tenancy)
        Router.push(ROUTE_PAGE_HOME)
    }

    const tenancies: string[] = props.data?.tenancies ?? [];

    return (
        <div className="absolute min-h-screen w-full top-0 z-50 left-0 bg-primary-50 flex flex-col overflow-y-auto">
            <header className="flex flex-none items-center justify-between h-16 px-4 md:px-8 border-b border-primary-200">
                <Link href="/" className="flex items-center">
                    <Logo />
                </Link>
                <AvatarButton />
            </header>
            <div className="flex justify-center w-full px-4 pt-16 pb-24">
                <div className="w-full max-w-xl">
                    <h2 className="m-0">Welcome, {session?.user?.name}!</h2>
                    <p className="mt-2 mb-0 text-[15px] leading-[23px] text-primary-600">
                        {tenancies.length > 0 ? "Choose the tenancy you want to work in. You can switch at any time from your profile menu." : "You are signed in, but you are not part of any namespace yet."}
                    </p>
                    <NamespaceListSelector tenancies={tenancies} onTenancySelected={onTenancySelected} />
                    {/* TODO: Decide how to present the available tenancies */}
                    {/* <NamespaceTreeSelector tenancies={props.data.tenancies} onTenancySelected={onTenancySelected} /> */}
                </div>
            </div>
        </div>

    )
}

interface NamespaceListSelectorProps {
    // eslint-disable-next-line no-unused-vars
    onTenancySelected(tenancy: string): void;
    tenancies: string[]
}

function NamespaceListSelector(props: NamespaceListSelectorProps) {

    return (
        <div className="mt-8">
            {props?.tenancies?.length > 0 ? (
                <ul className="rounded-lg border border-primary-200 bg-primary-0 divide-y divide-primary-100 overflow-hidden">
                    {props?.tenancies.map((tenancy, index) => {
                        const [root, environment, namespace] = tenancy.split("/");
                        return (
                            <li key={index}>
                                <button
                                    type="button"
                                    className="group flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-primary-100"
                                    onClick={() => props?.onTenancySelected(tenancy)}>
                                    <span className="flex flex-none items-center justify-center w-10 h-10 rounded-md bg-secondary-500">
                                        <MaterialSymbol icon="tenancy" size={20} weight={400} grade={-25} className="text-primary-700" />
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-[15px] font-semibold text-primary-900">{namespace ?? tenancy}</span>
                                        <span className="truncate font-mono text-xs text-primary-500">{[root, environment].filter(Boolean).join(" / ")}</span>
                                    </span>
                                    {environment && (
                                        <span className="flex-none px-2.5 py-[3px] rounded-full bg-primary-100 text-xs font-semibold capitalize text-primary-700">{environment}</span>
                                    )}
                                    <MaterialSymbol icon="chevron_right" size={20} weight={400} grade={-25} className="flex-none text-primary-400 group-hover:text-primary-900" />
                                </button>
                            </li>
                        );
                    })}
                </ul>

            ) : (
                <AccessPending />
            )}
        </div>
    )
}



interface NamespaceTreeSelectorProps {
    // eslint-disable-next-line no-unused-vars
    onTenancySelected(tenancy: string): void;
    tenancies: string[]
}


// eslint-disable-next-line no-unused-vars
function NamespaceTreeSelector(props: NamespaceTreeSelectorProps) {

    function getTenancyTree(tenancies) {
        const tree = {}
        if (tenancies?.length <= 0) {
            return tree
        }

        for (const i in tenancies) {
            const fullTenancy = tenancies[i]
            const root = splitAndGetAt(fullTenancy, 0)
            const environment = splitAndGetAt(fullTenancy, 1)
            const namespace = splitAndGetAt(fullTenancy, 2)

            if (!tree[root]) tree[root] = {}
            if (!tree[root][environment]) tree[root][environment] = {}
            tree[root][environment][namespace] = fullTenancy
        }

        return tree
    }

    function splitAndGetAt(fullTenancy: string, index: number) {
        return fullTenancy?.split("/")?.[index]
    }

    const tree = getTenancyTree(props.tenancies)

    return (
        <div className="my-8">
            {props?.tenancies?.length > 0 ? (
                <ul>
                    {Object.keys(tree).map((domainName, domainIndex) => {
                        return (
                            <li key={`${domainIndex}-${domainName}`}>
                                <h3>
                                    {domainName}
                                </h3>
                                <ul>
                                    {Object.keys(tree[domainName]).map((envName, envIndex) => {
                                        return <li key={`${envIndex}-${envName}`}>
                                            <h4>
                                                {envName}
                                            </h4>
                                            <ul>
                                                {Object.keys(tree[domainName][envName]).map((namespaceName, namespaceIndex) => {
                                                    return (
                                                        <li className="flex items-center py-6 pl-2 hover:bg-primary-100 cursor-pointer border-b border-b-primary-200"
                                                            key={`${namespaceIndex}-${namespaceName}`}
                                                            onClick={() => props?.onTenancySelected(tree[domainName][envName][namespaceName])}>
                                                            <span className="w-full">
                                                                {namespaceName}
                                                            </span>
                                                            <MaterialSymbol icon="chevron_right" grade={-25} size={22} weight={100} className="" />
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </li>
                                    })}

                                </ul>
                            </li>
                        )
                    })}
                </ul>

            ) : (
                <i>Empty - no tenancy set for user. Talk to the Admin.</i>
            )}

        </div>
    )
}

export async function getServerSideProps(context) {

    // Fetch data frm external API
    try {
        const ctx = await NewContext(context.req);

        if (!ctx.uid) {
            return { props: {} }
        }

        const data = await getUserByUID(ctx);

        // Pass data to the page via props
        return {
            props: { data } as TenancySelectorPageProps
        };
    } catch (err) {
        logError("loading the tenancy selector failed", err);

        return {
            props: {}
        }
    }
}

TenancySelectorPage.auth = {
    role: "admin",
    loading: <div>Tenancy selection loading...</div>,
};
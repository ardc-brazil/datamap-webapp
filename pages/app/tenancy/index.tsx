import { useSession } from "next-auth/react";
import Router from "next/router";
import { MaterialSymbol } from "react-material-symbols";
import { Navbar } from "../../../components/Navbar/Navbar";
import { useTenancyStore } from "../../../components/TenancyStore";
import { ROUTE_PAGE_HOME } from "../../../contants/InternalRoutesConstants";
import { NewContext } from "../../../lib/appLocalContext";
import { getUserByUID } from "../../../lib/users";


interface TenancySelectorPageProps {
    data?: any
}

export default function TenancySelectorPage(props: TenancySelectorPageProps) {
    const { data: session, status } = useSession();
    const setTenancySelected = useTenancyStore((state) => state.setTenancySelected)

    function onTenancySelected(tenancy) {
        setTenancySelected(tenancy)
        Router.push(ROUTE_PAGE_HOME)
    }

    return (
        <div className="absolute h-screen w-full top-0 z-50 left-0 bg-primary-50 flex flex-col justify-start overflow-hidden">
            <Navbar />
            <div className="flex items-center justify-center w-full h-full overflow-y-auto">
                <div className="max-w-2xl min-w-fit w-5/12 h-full">
                    <h2>Welcome, {session?.user?.name}!</h2>
                    <p className="text-primary-700">
                        Please select a namespace below
                    </p>
                    <NamespaceListSelector tenancies={props.data.tenancies} onTenancySelected={onTenancySelected} />
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
        <div className="my-8">
            {props?.tenancies?.length > 0 ? (
                <ul>
                    {props?.tenancies.map((tenancy, index) =>
                        <li className="flex items-center py-6 pl-2 hover:bg-primary-100 cursor-pointer border-b border-b-primary-200"
                            key={index}
                            onClick={() => props?.onTenancySelected(tenancy)}>
                            <span className="w-full">
                                {tenancy}
                            </span>
                            <MaterialSymbol icon="chevron_right" grade={-25} size={22} weight={100} className="" />
                        </li>
                    )}
                </ul>

            ) : (
                <i>Empty - no tenancy set for user. Talk to the Admin.</i>
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
        console.log(err)

        return {
            props: {}
        }
    }
}

TenancySelectorPage.auth = {
    role: "admin",
    loading: <div>Tenancy selection loading...</div>,
};
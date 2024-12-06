import { useSession } from "next-auth/react";
import Router from "next/router";
import { MaterialSymbol } from "react-material-symbols";
import { Navbar } from "../../../components/Navbar/Navbar";
import { useTenancyStore } from "../../../components/TenancyStore";
import { ROUTE_PAGE_HOME } from "../../../contants/InternalRoutesConstants";
import { NewContext } from "../../../lib/appLocalContext";
import { getUserByUID } from "../../../lib/users";


interface TenancySelectorPageProps {
    data: any
}

export default function TenancySelectorPage(props: TenancySelectorPageProps) {
    const { data: session, status } = useSession();
    const setTenancySelected = useTenancyStore((state) => state.setTenancySelected)

    function onTenancySelected(tenancy) {
        setTenancySelected(tenancy)
        Router.push(ROUTE_PAGE_HOME)
    }

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
            tree[root][environment][namespace] = ""
        }

        return tree
    }

    function splitAndGetAt(fullTenancy: string, index: number) {
        return fullTenancy?.split("/")?.[index]
    }

    return (

        <div className="absolute h-screen w-full top-0 z-50 left-0 bg-primary-50 flex flex-col justify-start overflow-hidden">

            {/* <div className="flex w-full h-20 px-4 py-4 items-center justify-start sticky top-0 border-b border-primary-200 bg-primary-50">
                Close
            </div> */}
            <Navbar />

            <div className="flex items-center justify-center w-full h-full overflow-y-auto">
                <div className="max-w-2xl min-w-fit w-5/12 h-full">
                    <h2>Welcome, {session?.user?.name}!</h2>
                    <p className="text-primary-700">
                        Please select a namespace below
                    </p>
                    <div className="my-8">
                        {props?.data?.tenancies?.length > 0 ? (
                            <ul>
                                {props?.data?.tenancies.map((tenancy, index) =>
                                    <li className="flex items-center py-6 pl-2 hover:bg-primary-100 cursor-pointer border-b border-b-primary-200"
                                        key={index}
                                        onClick={() => onTenancySelected(tenancy)}>
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
                </div>
            </div>
        </div>

    )
}

export async function getServerSideProps(context) {

    // Fetch data frm external API
    const ctx = await NewContext(context.req);
    if (!ctx.uid) {
        return { props: {} }
    }

    try {
        const data = await getUserByUID(ctx);

        // Pass data to the page via props
        return {
            props: { data } as TenancySelectorPageProps
        };
    } catch (err) {
        return {
            props: {
                error: {
                    status: err?.response?.status,
                    info: err?.response?.statusText
                }
            }
        }
    }
}
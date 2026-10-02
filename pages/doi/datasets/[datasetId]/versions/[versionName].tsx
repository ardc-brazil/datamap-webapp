import Link from "next/link";
import { EmbargoNotice } from "../../../../../components/Embargo/EmbargoNotice";
import { BareLayout } from "../../../../../components/Public/BareLayout";
import { ROUTE_PAGE_DATASETS_VERSION_DETAILS } from "../../../../../contants/InternalRoutesConstants";
import { loginUrlFor } from "../../../../../lib/authRoutes";
import { doiLandingProps } from "../../../../../lib/doiLanding";
import { getEmbargoStatus } from "../../../../../lib/embargo";
import { logError } from "../../../../../lib/logging";

interface Props {
    until: string
    doi: string | null
    returnTo: string
}

export default function DoiLandingPage(props: Props) {
    return (
        <BareLayout right={<Link href={loginUrlFor(props.returnTo)} className="text-sm font-semibold text-primary-900">Sign in</Link>}>
            <EmbargoNotice until={props.until} doi={props.doi} />
        </BareLayout>
    );
}

export async function getServerSideProps({ query }) {
    const datasetId = query.datasetId as string;
    const versionName = query.versionName as string;

    let status = null;
    try {
        status = await getEmbargoStatus(datasetId, versionName);
    } catch (error) {
        logError("reading the embargo status failed", error);
    }
    const result = doiLandingProps(status, datasetId, versionName);
    if ("props" in result) {
        return { props: { ...result.props, returnTo: ROUTE_PAGE_DATASETS_VERSION_DETAILS({ id: datasetId, versionName }) } };
    }
    return result;
}

import { ROUTE_PAGE_DATASETS_VERSION_DETAILS } from "../contants/InternalRoutesConstants";
import { EmbargoStatusResponse } from "../types/GatekeeperAPI";

export function doiLandingProps(status: EmbargoStatusResponse | null, datasetId: string, versionName: string) {
    if (status?.embargoed && status.until) {
        return { props: { until: status.until, doi: status.doi ?? null } };
    }
    return {
        redirect: {
            destination: ROUTE_PAGE_DATASETS_VERSION_DETAILS({ id: datasetId, versionName }),
            permanent: false,
        },
    };
}

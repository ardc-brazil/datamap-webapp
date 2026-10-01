import { ROUTE_PAGE_DATASETS_SNAPSHOTS_DETAILS } from "../contants/InternalRoutesConstants";
import { AnonymousPageResponse } from "../types/GatekeeperAPI";

export function anonymousPageProps(page: AnonymousPageResponse) {
    if (page.state === "published") {
        return { redirect: { destination: ROUTE_PAGE_DATASETS_SNAPSHOTS_DETAILS({ id: page.dataset_id }), permanent: false } };
    }
    return { props: { page } };
}

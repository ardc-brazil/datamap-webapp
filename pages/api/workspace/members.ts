import { WORKSPACE_PAGE_SIZE } from "../../../contants/TenancyConstants";
import { accountHandler } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { pageOr400, tenancyOr400 } from "../../../lib/routeParams";
import { listWorkspaceMembers } from "../../../lib/workspace";

const router = bffRouter()
    .get(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const page = pageOr400(req, res, WORKSPACE_PAGE_SIZE);
        if (!page) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await listWorkspaceMembers(uid, tenancy, page));
    });

export default accountHandler(router);

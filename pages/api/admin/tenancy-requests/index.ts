import { accountHandler } from "../../../../lib/accountRoute";
import { listTenancyRequests } from "../../../../lib/admin";
import { requestsQueryOr400 } from "../../../../lib/adminRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../lib/bffRoute";

const router = adminBffRouter()
    .get(async (req, res) => {
        const query = requestsQueryOr400(req, res);
        if (!query) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await listTenancyRequests(uid, query));
    });

export default accountHandler(router);

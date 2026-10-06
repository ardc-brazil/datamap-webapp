import { accountHandler } from "../../../../../lib/accountRoute";
import { getTenancyRequest } from "../../../../../lib/admin";
import { NewContext } from "../../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../../lib/bffRoute";
import { uuidOr404 } from "../../../../../lib/routeParams";

const router = adminBffRouter()
    .get(async (req, res) => {
        const requestId = uuidOr404(req, res, "requestId", "request_not_found");
        if (!requestId) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await getTenancyRequest(uid, requestId));
    });

export default accountHandler(router);

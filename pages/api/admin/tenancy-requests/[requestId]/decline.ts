import { accountHandler } from "../../../../../lib/accountRoute";
import { declineTenancyRequest } from "../../../../../lib/admin";
import { declineMessageOr400 } from "../../../../../lib/adminRoute";
import { NewContext } from "../../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../../lib/bffRoute";
import { uuidOr404 } from "../../../../../lib/routeParams";

const router = adminBffRouter()
    .post(async (req, res) => {
        const requestId = uuidOr404(req, res, "requestId", "request_not_found");
        if (!requestId) {
            return;
        }
        const body = declineMessageOr400(req, res);
        if (!body) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await declineTenancyRequest(uid, requestId, body.message));
    });

export default accountHandler(router);

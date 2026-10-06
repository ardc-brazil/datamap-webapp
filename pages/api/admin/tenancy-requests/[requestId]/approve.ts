import { accountHandler } from "../../../../../lib/accountRoute";
import { approveTenancyRequest } from "../../../../../lib/admin";
import { decisionOr400 } from "../../../../../lib/adminRoute";
import { NewContext } from "../../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../../lib/bffRoute";
import { uuidOr404 } from "../../../../../lib/routeParams";

const router = adminBffRouter()
    .post(async (req, res) => {
        const requestId = uuidOr404(req, res, "requestId", "request_not_found");
        if (!requestId) {
            return;
        }
        const decision = decisionOr400(req, res);
        if (!decision) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await approveTenancyRequest(uid, requestId, decision));
    });

export default accountHandler(router);

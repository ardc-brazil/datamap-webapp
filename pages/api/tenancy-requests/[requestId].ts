import { accountHandler } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { uuidOr404 } from "../../../lib/routeParams";
import { withdrawTenancyRequest } from "../../../lib/tenancies";

const router = bffRouter()
    .delete(async (req, res) => {
        const requestId = uuidOr404(req, res, "requestId", "request_not_found");
        if (!requestId) {
            return;
        }
        const { uid } = await NewContext(req);
        await withdrawTenancyRequest(uid, requestId);
        res.status(204).end();
    });

export default accountHandler(router);

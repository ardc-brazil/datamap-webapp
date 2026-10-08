import { accountHandler, requireJsonRequest } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { invalidRequest } from "../../../lib/routeParams";
import { createTenancyRequest, listMyTenancyRequests } from "../../../lib/tenancies";

const router = bffRouter()
    .get(async (req, res) => {
        const { uid } = await NewContext(req);
        res.json(await listMyTenancyRequests(uid));
    })
    .post(requireJsonRequest, async (req, res) => {
        const tenancyName = req.body?.tenancyName;
        const reason = req.body?.reason;
        if (typeof tenancyName !== "string" || typeof reason !== "string") {
            invalidRequest(res);
            return;
        }
        const { uid } = await NewContext(req);
        res.status(201).json(await createTenancyRequest(uid, { tenancyName, reason }));
    });

export default accountHandler(router);

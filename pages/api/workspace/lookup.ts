import { accountHandler } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { invalidRequest, tenancyOr400 } from "../../../lib/routeParams";
import { lookupInvitee } from "../../../lib/workspace";

const router = bffRouter()
    .get(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const value = typeof req.query.value === "string" ? req.query.value.trim() : "";
        if (!value) {
            invalidRequest(res);
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await lookupInvitee(uid, tenancy, value));
    });

export default accountHandler(router);

import { accountHandler } from "../../../../../lib/accountRoute";
import { getMemberRemovalImpact, removeTenancyMember } from "../../../../../lib/admin";
import { NewContext } from "../../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../../lib/bffRoute";
import { tenancyOr400, uuidOr404 } from "../../../../../lib/routeParams";

const router = adminBffRouter()
    .get(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const userId = uuidOr404(req, res, "userId", "member_not_found");
        if (!userId) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await getMemberRemovalImpact(uid, tenancy, userId));
    })
    .delete(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const userId = uuidOr404(req, res, "userId", "member_not_found");
        if (!userId) {
            return;
        }
        const { uid } = await NewContext(req);
        await removeTenancyMember(uid, tenancy, userId);
        res.status(204).end();
    });

export default accountHandler(router);

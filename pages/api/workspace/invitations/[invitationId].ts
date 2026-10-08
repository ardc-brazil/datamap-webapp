import { accountHandler } from "../../../../lib/accountRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { bffRouter } from "../../../../lib/bffRoute";
import { tenancyOr400, uuidOr404 } from "../../../../lib/routeParams";
import { withdrawWorkspaceInvitation } from "../../../../lib/workspace";

const router = bffRouter()
    .delete(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const invitationId = uuidOr404(req, res, "invitationId", "invitation_not_found");
        if (!invitationId) {
            return;
        }
        const { uid } = await NewContext(req);
        await withdrawWorkspaceInvitation(uid, tenancy, invitationId);
        res.status(204).end();
    });

export default accountHandler(router);

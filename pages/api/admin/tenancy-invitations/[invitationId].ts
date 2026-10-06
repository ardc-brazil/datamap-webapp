import { accountHandler } from "../../../../lib/accountRoute";
import { withdrawTenancyInvitationAsAdmin } from "../../../../lib/admin";
import { NewContext } from "../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../lib/bffRoute";
import { uuidOr404 } from "../../../../lib/routeParams";

const router = adminBffRouter()
    .delete(async (req, res) => {
        const invitationId = uuidOr404(req, res, "invitationId", "invitation_not_found");
        if (!invitationId) {
            return;
        }
        const { uid } = await NewContext(req);
        await withdrawTenancyInvitationAsAdmin(uid, invitationId);
        res.status(204).end();
    });

export default accountHandler(router);

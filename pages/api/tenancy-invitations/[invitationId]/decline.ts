import { accountHandler, requireJsonRequest } from "../../../../lib/accountRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { bffRouter } from "../../../../lib/bffRoute";
import { uuidOr404 } from "../../../../lib/routeParams";
import { declineTenancyInvitation } from "../../../../lib/tenancies";

const router = bffRouter()
    .post(requireJsonRequest, async (req, res) => {
        const invitationId = uuidOr404(req, res, "invitationId", "invitation_not_found");
        if (!invitationId) {
            return;
        }
        const { uid } = await NewContext(req);
        await declineTenancyInvitation(uid, invitationId);
        res.status(204).end();
    });

export default accountHandler(router);

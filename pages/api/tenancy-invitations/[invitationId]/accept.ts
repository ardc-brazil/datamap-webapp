import { accountHandler, requireJsonRequest } from "../../../../lib/accountRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { bffRouter } from "../../../../lib/bffRoute";
import { uuidOr404 } from "../../../../lib/routeParams";
import { acceptTenancyInvitation } from "../../../../lib/tenancies";

const router = bffRouter()
    .post(requireJsonRequest, async (req, res) => {
        const invitationId = uuidOr404(req, res, "invitationId", "invitation_not_found");
        if (!invitationId) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await acceptTenancyInvitation(uid, invitationId));
    });

export default accountHandler(router);

import { NewContext } from "../../../../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../../../../lib/bffRoute";
import { regenerateInvitationLink } from "../../../../../../../lib/share";

const router = bffRouter()
    .post(async (req, res) => {
        const context = await NewContext(req);
        res.json(await regenerateInvitationLink(context, req.query.datasetId as string, req.query.invitationId as string));
    });

export default bffHandler(router);

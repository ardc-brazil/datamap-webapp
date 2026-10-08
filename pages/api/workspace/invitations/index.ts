import { accountHandler, requireJsonRequest } from "../../../../lib/accountRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { bffRouter } from "../../../../lib/bffRoute";
import { tenancyOr400, userIdOr400 } from "../../../../lib/routeParams";
import { inviteToWorkspace, listWorkspaceInvitations } from "../../../../lib/workspace";

const router = bffRouter()
    .get(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await listWorkspaceInvitations(uid, tenancy));
    })
    .post(requireJsonRequest, async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const userId = userIdOr400(req, res);
        if (!userId) {
            return;
        }
        const { uid } = await NewContext(req);
        res.status(201).json(await inviteToWorkspace(uid, tenancy, userId));
    });

export default accountHandler(router);

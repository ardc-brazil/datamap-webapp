import { accountHandler } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";
import { listMyTenancyInvitations } from "../../../lib/tenancies";

const router = bffRouter()
    .get(async (req, res) => {
        const { uid } = await NewContext(req);
        res.json(await listMyTenancyInvitations(uid));
    });

export default accountHandler(router);

import { NewContext } from "../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../lib/bffRoute";
import { acceptInvitation } from "../../../lib/share";

const router = bffRouter()
    .post(async (req, res) => {
        const context = await NewContext(req);
        res.json(await acceptInvitation(context, req.body?.token));
    });

export default bffHandler(router);

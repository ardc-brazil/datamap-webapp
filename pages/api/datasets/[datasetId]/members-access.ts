import { NewContext } from "../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../lib/bffRoute";
import { setMembersAccess } from "../../../../lib/share";

const router = bffRouter()
    .put(async (req, res) => {
        const context = await NewContext(req);
        res.json(await setMembersAccess(context, req.query.datasetId as string, req.body));
    });

export default bffHandler(router);

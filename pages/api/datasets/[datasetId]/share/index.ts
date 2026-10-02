import { NewContext } from "../../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../../lib/bffRoute";
import { getShareState, grantAccess } from "../../../../../lib/share";

const router = bffRouter()
    .get(async (req, res) => {
        const context = await NewContext(req);
        res.json(await getShareState(context, req.query.datasetId as string));
    })
    .post(async (req, res) => {
        const context = await NewContext(req);
        res.status(201).json(await grantAccess(context, req.query.datasetId as string, req.body));
    });

export default bffHandler(router);

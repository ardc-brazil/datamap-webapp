import { NewContext } from "../../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../../lib/bffRoute";
import { endEmbargo } from "../../../../../lib/embargo";

const router = bffRouter()
    .post(async (req, res) => {
        const context = await NewContext(req);
        res.json(await endEmbargo(context, req.query.datasetId as string));
    });

export default bffHandler(router);

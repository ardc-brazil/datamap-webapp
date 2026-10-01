import { NewContext } from "../../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../../lib/bffRoute";
import { extendEmbargo } from "../../../../../lib/embargo";

const router = bffRouter()
    .post(async (req, res) => {
        const context = await NewContext(req);
        res.json(await extendEmbargo(context, req.query.datasetId as string, req.body));
    });

export default bffHandler(router);

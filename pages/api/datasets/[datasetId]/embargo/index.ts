import { NewContext } from "../../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../../lib/bffRoute";
import { setEmbargo } from "../../../../../lib/embargo";

const router = bffRouter()
    .put(async (req, res) => {
        const context = await NewContext(req);
        res.json(await setEmbargo(context, req.query.datasetId as string, req.body));
    });

export default bffHandler(router);

import { NewContext } from "../../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../../lib/bffRoute";
import { setEmbargoMode } from "../../../../../lib/embargo";

const router = bffRouter()
    .put(async (req, res) => {
        const context = await NewContext(req);
        res.json(await setEmbargoMode(context, req.query.datasetId as string, req.body));
    });

export default bffHandler(router);

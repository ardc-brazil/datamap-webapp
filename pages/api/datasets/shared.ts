import { NewContext } from "../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../lib/bffRoute";
import { getSharedDatasets } from "../../../lib/dataset";

const router = bffRouter()
    .get(async (req, res) => {
        const context = await NewContext(req);
        res.json(await getSharedDatasets(context, req.query as { [key: string]: string | string[] }));
    });

export default bffHandler(router);

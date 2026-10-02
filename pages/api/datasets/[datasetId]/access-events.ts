import { NewContext } from "../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../lib/bffRoute";
import { getAccessEvents } from "../../../../lib/embargo";

const router = bffRouter()
    .get(async (req, res) => {
        const context = await NewContext(req);
        res.json(await getAccessEvents(context, req.query.datasetId as string));
    });

export default bffHandler(router);

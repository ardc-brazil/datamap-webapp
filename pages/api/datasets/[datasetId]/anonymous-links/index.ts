import { NewContext } from "../../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../../lib/bffRoute";
import { createAnonymousLink } from "../../../../../lib/share";

const router = bffRouter()
    .post(async (req, res) => {
        const context = await NewContext(req);
        res.status(201).json(await createAnonymousLink(context, req.query.datasetId as string, req.body?.label));
    });

export default bffHandler(router);

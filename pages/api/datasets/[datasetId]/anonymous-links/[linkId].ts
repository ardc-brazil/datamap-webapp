import { NewContext } from "../../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../../lib/bffRoute";
import { revokeAnonymousLink } from "../../../../../lib/share";

const router = bffRouter()
    .delete(async (req, res) => {
        const context = await NewContext(req);
        await revokeAnonymousLink(context, req.query.datasetId as string, req.query.linkId as string);
        res.status(204).end();
    });

export default bffHandler(router);

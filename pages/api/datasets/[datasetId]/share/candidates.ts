import { NewContext } from "../../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../../lib/bffRoute";
import { searchShareCandidates } from "../../../../../lib/share";

const router = bffRouter()
    .get(async (req, res) => {
        const context = await NewContext(req);
        res.json(await searchShareCandidates(context, req.query.datasetId as string, (req.query.q as string) ?? ""));
    });

export default bffHandler(router);

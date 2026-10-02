import { NewContext } from "../../../../../../lib/appLocalContext";
import { bffHandler, bffRouter } from "../../../../../../lib/bffRoute";
import { changePermissionLevel, revokePermission } from "../../../../../../lib/share";

const router = bffRouter()
    .put(async (req, res) => {
        const context = await NewContext(req);
        res.json(await changePermissionLevel(context, req.query.datasetId as string, req.query.userId as string, req.body?.level));
    })
    .delete(async (req, res) => {
        const context = await NewContext(req);
        await revokePermission(context, req.query.datasetId as string, req.query.userId as string);
        res.status(204).end();
    });

export default bffHandler(router);

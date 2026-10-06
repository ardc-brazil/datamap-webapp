import { accountHandler } from "../../../../lib/accountRoute";
import { getTenancyRequestCounts } from "../../../../lib/admin";
import { NewContext } from "../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../lib/bffRoute";

const router = adminBffRouter()
    .get(async (req, res) => {
        const { uid } = await NewContext(req);
        res.json(await getTenancyRequestCounts(uid));
    });

export default accountHandler(router);

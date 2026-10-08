import { accountHandler } from "../../../lib/accountRoute";
import { searchAdminUsers } from "../../../lib/admin";
import { userSearchOr400 } from "../../../lib/adminRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { adminBffRouter } from "../../../lib/bffRoute";

const router = adminBffRouter()
    .get(async (req, res) => {
        const q = userSearchOr400(req, res);
        if (!q) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await searchAdminUsers(uid, q));
    });

export default accountHandler(router);

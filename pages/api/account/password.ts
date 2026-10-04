import { changePassword } from "../../../lib/account";
import { accountHandler } from "../../../lib/accountRoute";
import { NewContext } from "../../../lib/appLocalContext";
import { bffRouter } from "../../../lib/bffRoute";

const router = bffRouter()
    .put(async (req, res) => {
        const context = await NewContext(req);
        await changePassword(context.uid, req.body?.currentPassword, req.body?.newPassword);
        res.status(204).end();
    });

export default accountHandler(router);

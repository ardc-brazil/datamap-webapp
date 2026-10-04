import { requestPasswordReset } from "../../../../lib/account";
import { accountHandler, publicAccountRouter } from "../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        await requestPasswordReset(req.body?.email);
        res.status(202).end();
    });

export default accountHandler(router);

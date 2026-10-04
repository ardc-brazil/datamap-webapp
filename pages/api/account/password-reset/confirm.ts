import { confirmPasswordReset } from "../../../../lib/account";
import { accountHandler, publicAccountRouter } from "../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        await confirmPasswordReset(req.body?.token, req.body?.password);
        res.status(204).end();
    });

export default accountHandler(router);

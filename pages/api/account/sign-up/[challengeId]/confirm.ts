import { confirmSignUp } from "../../../../../lib/account";
import { accountHandler, publicAccountRouter } from "../../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        await confirmSignUp(req.query.challengeId as string, req.body?.code);
        res.status(204).end();
    });

export default accountHandler(router);

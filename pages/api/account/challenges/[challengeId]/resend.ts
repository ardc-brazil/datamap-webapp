import { resendChallenge } from "../../../../../lib/account";
import { accountHandler, publicAccountRouter } from "../../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        await resendChallenge(req.query.challengeId as string);
        res.status(202).end();
    });

export default accountHandler(router);

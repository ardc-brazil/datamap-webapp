import { resendChallenge } from "../../../../../lib/account";
import { accountHandler, challengeIdOr404, publicAccountRouter } from "../../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        const challengeId = challengeIdOr404(req, res);
        if (!challengeId) {
            return;
        }
        await resendChallenge(challengeId);
        res.status(202).end();
    });

export default accountHandler(router);

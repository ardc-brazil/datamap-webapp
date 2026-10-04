import { confirmSignUp } from "../../../../../lib/account";
import { accountHandler, challengeIdOr404, publicAccountRouter } from "../../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        const challengeId = challengeIdOr404(req, res);
        if (!challengeId) {
            return;
        }
        await confirmSignUp(challengeId, req.body?.code);
        res.status(204).end();
    });

export default accountHandler(router);

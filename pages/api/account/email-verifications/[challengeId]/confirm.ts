import { confirmEmailVerification } from "../../../../../lib/account";
import { accountHandler, challengeIdOr404, pendingAccountRouter } from "../../../../../lib/accountRoute";

const router = pendingAccountRouter()
    .post(async (req, res) => {
        const challengeId = challengeIdOr404(req, res);
        if (!challengeId) {
            return;
        }
        await confirmEmailVerification(challengeId, req.body?.code);
        res.status(204).end();
    });

export default accountHandler(router);

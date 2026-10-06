import { accountHandler } from "../../../../lib/accountRoute";
import { createTenancy, listAdminTenancies } from "../../../../lib/admin";
import { newTenancyOr400 } from "../../../../lib/adminRoute";
import { NewContext } from "../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../lib/bffRoute";

const router = adminBffRouter()
    .get(async (req, res) => {
        const { uid } = await NewContext(req);
        res.json(await listAdminTenancies(uid));
    })
    .post(async (req, res) => {
        const input = newTenancyOr400(req, res);
        if (!input) {
            return;
        }
        const { uid } = await NewContext(req);
        res.status(201).json(await createTenancy(uid, input));
    });

export default accountHandler(router);

import { ADMIN_PAGE_SIZE } from "../../../../../contants/AdminConstants";
import { accountHandler } from "../../../../../lib/accountRoute";
import { addTenancyMember, listTenancyMembers } from "../../../../../lib/admin";
import { NewContext } from "../../../../../lib/appLocalContext";
import { adminBffRouter } from "../../../../../lib/bffRoute";
import { pageOr400, tenancyOr400, userIdOr400 } from "../../../../../lib/routeParams";

const router = adminBffRouter()
    .get(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const page = pageOr400(req, res, ADMIN_PAGE_SIZE);
        if (!page) {
            return;
        }
        const { uid } = await NewContext(req);
        res.json(await listTenancyMembers(uid, tenancy, page));
    })
    .post(async (req, res) => {
        const tenancy = tenancyOr400(req, res);
        if (!tenancy) {
            return;
        }
        const userId = userIdOr400(req, res);
        if (!userId) {
            return;
        }
        const { uid } = await NewContext(req);
        res.status(201).json(await addTenancyMember(uid, tenancy, userId));
    });

export default accountHandler(router);

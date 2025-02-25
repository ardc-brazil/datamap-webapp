import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { TENANCY_STORAGE_NAME, TenancyStore } from "../types/TenancyStore";

/**
 * Represents request app context
 * @interface
 */
export interface AppLocalContext {
    /**
     * UserID (UUID) information from context.
     */
    uid: string

    /**
     * @deprecated Tenancies list (string) is the list of product/application context enabled for user.
     * Use only `tenancy` the current selected tenancy.
     */
    tenancies?: string[]

    /**
     * Current tenancy selected from user.
     */
    tenancy: string
}

export async function NewContext(req: NextRequest | NextApiRequest): Promise<AppLocalContext> {
    const token = await getToken({ req: req })
    const tenancyObject = getTenancyFromCookie(req)

    return {
        uid: token?.uid as string,
        tenancy: tenancyObject?.tenancySelected
    };
}

function getTenancyFromCookie(req: NextRequest | NextApiRequest) {
    let tenancyData = ""
    if (req.cookies && req.cookies.get && (req as NextRequest).cookies.has(TENANCY_STORAGE_NAME)) {
        tenancyData = (req as NextRequest).cookies.get(TENANCY_STORAGE_NAME)?.value
    } else {
        tenancyData = (req.cookies as { [key: string]: string })[TENANCY_STORAGE_NAME] ?? null
    }

    const storage = JSON.parse(tenancyData) as {}
    const tenancyObject = (storage?.["state"] ?? "") as TenancyStore;
    return tenancyObject;
}
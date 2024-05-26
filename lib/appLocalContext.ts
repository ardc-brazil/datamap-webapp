import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server"
import { defaultTenancy } from "../lib/rpc";
import { TenanciesResolver } from "./tenancies";

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
     * Tenancies list (string) is the list of product/application context enabled for user.
     */
    tenancies?: string[]

    /**
     * Current tenancy selected from user.
     */
    tenancy: string
}

export async function NewContext(req: NextRequest | NextApiRequest): Promise<AppLocalContext> {
    const token = await getToken({ req: req })
    const tenancyResolver = new TenanciesResolver();

    return {
        uid: token?.uid as string,
        tenancies: buildTenancy(token),
        tenancy: tenancyResolver.getCurrentTenancyOrDefaultFromApi(req as NextApiRequest)
    };
}


function buildTenancy(token): string[] {
    return token?.tenancies as string[] ?? [defaultTenancy];
}

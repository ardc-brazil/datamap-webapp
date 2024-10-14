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
    // TODO: Update it when we have a tenancy selector
    // const tenancyResolver = new TenanciesResolver();

    const tenancies = buildTenancy(token)

    return {
        uid: token?.uid as string,
        tenancies: tenancies,
        // tenancy: tenancyResolver.getCurrentTenancyOrDefaultFromApi(req as NextApiRequest)
        tenancy: tenancies?.[0] ?? defaultTenancy,
    };
}


function buildTenancy(token): string[] {
    return token?.tenancies as string[] ?? [defaultTenancy];
}

import { getCookie, setCookie, hasCookie } from "cookies-next";
import { defaultTenancy } from "./rpc";
import { NextRequest } from "next/server";
import { NextApiRequest } from "next";



export class TenanciesResolver {
    
    cookieTenancyKey: 'tenancy';

    getCurrentTenancyOrDefaultFrom(req: NextRequest): string {
        return req.cookies?.get(this.cookieTenancyKey)?.value
    }

    getCurrentTenancyOrDefaultFromApi(req: NextApiRequest): string {
        return req.cookies?.tenancy ?? defaultTenancy;
    }

    /**
     * Get the current selected tenancy from cookie.
     * @returns tenancy key string
     */
    getCurrentTenancyOrDefault(): string {
        if (hasCookie(this.cookieTenancyKey)) {
            return getCookie(this.cookieTenancyKey)?.toString()
        }

        this.setCurrentTenancy(defaultTenancy)
        return getCookie(this.cookieTenancyKey)?.toString()
    }


    /**
     * Get the current selected tenancy from cookie.
     * @param name tenancy key name
     */
    setCurrentTenancy(name: string) {
        setCookie(this.cookieTenancyKey, name)
    }

}
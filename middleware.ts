import { getToken } from "next-auth/jwt";
import { createEdgeRouter } from "next-connect";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ROUTE_PAGE_HOME } from "./contants/InternalRoutesConstants";

const router = createEdgeRouter<NextRequest, NextFetchEvent>();

// Rewrite URL to redirect authenticated user to internal logged home.
router.get("/", async (request) => {
    const token = await getToken({ req: request })

    if (token) {
        return NextResponse.rewrite(new URL(ROUTE_PAGE_HOME, request.url))
    }

    return NextResponse.next();

});

router.all(() => {
    // default if none of the above matches
    return NextResponse.next();
});

export function middleware(request: NextRequest, event: NextFetchEvent) {
    return router.run(request, event);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
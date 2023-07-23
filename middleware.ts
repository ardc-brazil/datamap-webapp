import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { createEdgeRouter } from "next-connect";

const router = createEdgeRouter<NextRequest, NextFetchEvent>();

router.use(async (request, event, next) => {
    // logging request example
    console.log(`${request.method} ${request.url}`);
    return next();
});

router.get("/about", (request) => {
    return NextResponse.redirect(new URL("/about-2", request.url));
});

router.use("/app", (request) => {
    // TODO: check authn here
    //   if (!isAuthenticated(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
    //   }
    // return NextResponse.next();
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
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
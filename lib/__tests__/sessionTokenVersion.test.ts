jest.mock("../share", () => ({ claimInvitations: jest.fn() }));
jest.mock("../users", () => ({
    ...jest.requireActual("../users"),
    getUserByProviderID: jest.fn(),
    getUserByUID: jest.fn(),
    createUser: jest.fn(),
}));

// next-auth's exports map does not list core/*, so the internal route is reached by path.
import sessionRoute from "../../node_modules/next-auth/core/routes/session";
import { authOptions, TOKEN_VERSION } from "../../pages/api/auth/[...nextauth]";
import { claimInvitations } from "../share";
import { STALE_SESSION_ERROR } from "../sessionToken";
import { getUserByUID } from "../users";

const jwt = (params: Record<string, unknown>) => authOptions.callbacks.jwt(params as any);

beforeEach(() => {
    jest.mocked(claimInvitations).mockResolvedValue({ accepted: [] } as any);
});

describe("the token version", () => {
    test("is 2", () => {
        expect(TOKEN_VERSION).toBe(2);
    });

    test("a token issued before versions existed is refused", async () => {
        await expect(jwt({ token: { uid: "u1", tenancies: ["datamap/production/data-amazon"] } }))
            .rejects.toThrow(STALE_SESSION_ERROR);
    });

    test("an older version is refused", async () => {
        await expect(jwt({ token: { uid: "u1", v: 1 } })).rejects.toThrow(STALE_SESSION_ERROR);
    });

    test("update() cannot revive an old token", async () => {
        await expect(jwt({ token: { uid: "u1" }, trigger: "update" })).rejects.toThrow(STALE_SESSION_ERROR);
    });

    test("a current token is read unchanged", async () => {
        expect(await jwt({ token: { uid: "u1", v: TOKEN_VERSION } })).toEqual({ uid: "u1", v: TOKEN_VERSION });
    });

    test("a password sign-in stamps the version on the new token", async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", name: "Ana", email: "ana@usp.br", tenancies: [] } as any);

        const token = await jwt({
            token: { email: "ana@usp.br" },
            user: { id: "u1", email: "ana@usp.br" },
            account: { provider: "credentials", type: "credentials", providerAccountId: "u1" },
            trigger: "signIn",
        });

        expect(token.uid).toBe("u1");
        expect(token.v).toBe(TOKEN_VERSION);
    });
});

describe("NextAuth's session endpoint", () => {
    const CLEARED = [{ name: "next-auth.session-token", value: "", options: { maxAge: 0 } }];

    function sessionStore() {
        return {
            value: "cookie-from-the-browser",
            chunk: jest.fn(() => [{ name: "next-auth.session-token", value: "re-encoded", options: {} }]),
            clean: jest.fn(() => CLEARED),
        };
    }

    function options(decoded: Record<string, unknown>) {
        return {
            jwt: { decode: jest.fn(async () => decoded), encode: jest.fn(async () => "re-encoded") },
            callbacks: authOptions.callbacks,
            events: {},
            logger: { error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
            session: { strategy: "jwt", maxAge: 3600 },
        };
    }

    test("a stale token gets an empty session and its cookie deleted, which the client reads as signed out", async () => {
        const store = sessionStore();
        const opts = options({ uid: "u1", tenancies: ["datamap/production/data-amazon"] });

        const response = await sessionRoute({ options: opts as any, sessionStore: store as any });

        expect(response.body).toEqual({});
        expect(response.cookies).toEqual(CLEARED);
        expect(opts.jwt.encode).not.toHaveBeenCalled();
        expect(opts.logger.error).toHaveBeenCalledWith("JWT_SESSION_ERROR", expect.any(Error));
    });

    test("a current token keeps its session", async () => {
        const store = sessionStore();
        const opts = options({ uid: "u1", tenancies: ["datamap/production/data-amazon"], v: TOKEN_VERSION });

        const response: any = await sessionRoute({ options: opts as any, sessionStore: store as any });

        expect(response.body.user.uid).toBe("u1");
        expect(store.clean).not.toHaveBeenCalled();
        expect(opts.jwt.encode).toHaveBeenCalledWith(expect.objectContaining({ token: expect.objectContaining({ v: TOKEN_VERSION }) }));
    });
});

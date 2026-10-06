jest.mock("../tenancies", () => ({ listMyTenancies: jest.fn(async () => []) }));
jest.mock("../share", () => ({ claimInvitations: jest.fn() }));
jest.mock("../users", () => ({
    ...jest.requireActual("../users"),
    getUserByProviderID: jest.fn(),
    getUserByUID: jest.fn(),
    createUser: jest.fn(),
}));

import { authOptions, hydrateWithUserInfo, TOKEN_VERSION } from "../../pages/api/auth/[...nextauth]";
import { getUserByUID } from "../users";

describe("the admin claim", () => {
    test("an account with the admin role carries it", async () => {
        const token = await hydrateWithUserInfo({}, { id: "u1", roles: ["datasets_write", "admin"], tenancies: ["datamap/production/public"] });

        expect(token.admin).toBe(true);
    });

    test("an account without it carries none, and a claim from before is dropped", async () => {
        const token = await hydrateWithUserInfo({ uid: "u1", admin: true }, { id: "u1", roles: ["datasets_write"], tenancies: ["datamap/production/public"] });

        expect(token).not.toHaveProperty("admin");
    });

    test("update() re-reads the roles", async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", roles: ["admin"], tenancies: ["datamap/production/public"] } as any);

        const token = await authOptions.callbacks.jwt({ token: { uid: "u1", v: TOKEN_VERSION }, trigger: "update" } as any);

        expect(token.admin).toBe(true);
    });

    test("the session exposes only the boolean", async () => {
        const admin: any = await authOptions.callbacks.session({ session: { user: {} }, token: { uid: "u1", admin: true } } as any);
        const member: any = await authOptions.callbacks.session({ session: { user: {} }, token: { uid: "u2" } } as any);

        expect(admin.user.admin).toBe(true);
        expect(member.user.admin).toBe(false);
        expect(admin.user).not.toHaveProperty("roles");
    });
});

import { isWithinRoute } from "../routeMatch";

test("a route matches itself and the pages below it, not a sibling that only shares its prefix", () => {
    expect(isWithinRoute("/app/admin/users", "/app/admin/users")).toBe(true);
    expect(isWithinRoute("/app/admin/users/[userId]", "/app/admin/users")).toBe(true);
    expect(isWithinRoute("/app/admin/usersettings", "/app/admin/users")).toBe(false);
    expect(isWithinRoute("/app/admin", "/app/admin/users")).toBe(false);
});

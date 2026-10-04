jest.mock("../share", () => ({ claimInvitations: jest.fn() }));

import { describe, expect, test } from '@jest/globals';

// next build compiles everything under pages/, and inlines NODE_ENV there: this test cannot live next to the route.
function providerIdsWhen(nodeEnv: string): string[] {
    const env = process.env as Record<string, string | undefined>;
    const original = env.NODE_ENV;
    env.NODE_ENV = nodeEnv;
    try {
        let ids: string[] = [];
        jest.isolateModules(() => {
            const { authOptions } = require("../../pages/api/auth/[...nextauth]");
            ids = authOptions.providers.map((provider: { id: string }) => provider.id);
        });
        return ids;
    } finally {
        env.NODE_ENV = original;
    }
}

describe("the sign-in providers", () => {
    test("production offers only ORCID", () => {
        expect(providerIdsWhen("production")).toEqual(["orcid"]);
    });

    test("development also offers GitHub and the credentials stub", () => {
        expect(providerIdsWhen("development")).toEqual(["orcid", "github", "credentials"]);
    });

    test("anything that is not development counts as production", () => {
        expect(providerIdsWhen("test")).toEqual(["orcid"]);
    });
});

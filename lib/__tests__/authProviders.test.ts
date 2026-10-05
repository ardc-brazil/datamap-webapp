jest.mock("../share", () => ({ claimInvitations: jest.fn() }));

import { describe, expect, test } from '@jest/globals';

type Provider = { id: string; name: string; options?: { id?: string; name?: string } };

// next build compiles everything under pages/, and inlines NODE_ENV there: this test cannot live next to the route.
function providersWhen(nodeEnv: string, orcidMock?: string): { id: string; name: string }[] {
    const env = process.env as Record<string, string | undefined>;
    const original = { NODE_ENV: env.NODE_ENV, ENABLE_DEV_ORCID_MOCK: env.ENABLE_DEV_ORCID_MOCK };
    env.NODE_ENV = nodeEnv;
    if (orcidMock === undefined) {
        delete env.ENABLE_DEV_ORCID_MOCK;
    } else {
        env.ENABLE_DEV_ORCID_MOCK = orcidMock;
    }
    try {
        let providers: Provider[] = [];
        jest.isolateModules(() => {
            providers = require("../../pages/api/auth/[...nextauth]").authOptions.providers;
        });
        // NextAuth merges a provider's options over its defaults; a credentials provider's own id lives in options.
        return providers.map((provider) => ({
            id: provider.options?.id ?? provider.id,
            name: provider.options?.name ?? provider.name,
        }));
    } finally {
        for (const [key, value] of Object.entries(original)) {
            if (value === undefined) {
                delete env[key];
            } else {
                env[key] = value;
            }
        }
    }
}

function providerIdsWhen(nodeEnv: string, orcidMock?: string): string[] {
    return providersWhen(nodeEnv, orcidMock).map((provider) => provider.id);
}

describe("the sign-in providers", () => {
    test("production offers ORCID and the password", () => {
        expect(providerIdsWhen("production")).toEqual(["orcid", "credentials"]);
    });

    test("development also offers GitHub", () => {
        expect(providerIdsWhen("development")).toEqual(["orcid", "credentials", "github"]);
    });

    test("anything that is not development counts as production", () => {
        expect(providerIdsWhen("test")).toEqual(["orcid", "credentials"]);
    });
});

describe("the development ORCID mock", () => {
    test("never exists in production, even with the flag on", () => {
        expect(providerIdsWhen("production", "true")).toEqual(["orcid", "credentials"]);
        expect(providerIdsWhen("test", "true")).toEqual(["orcid", "credentials"]);
    });

    test.each`
        flag
        ${undefined}
        ${"false"}
        ${"TRUE"}
        ${"1"}
    `("is off in development unless the flag is exactly \"true\" ($flag)", ({ flag }) => {
        expect(providerIdsWhen("development", flag)).toEqual(["orcid", "credentials", "github"]);
    });

    test("is offered in development with the flag on, after the others", () => {
        expect(providerIdsWhen("development", "true")).toEqual(["orcid", "credentials", "github", "orcid-dev"]);
    });

    test("says it is a mock", () => {
        expect(providersWhen("development", "true").find((provider) => provider.id === "orcid-dev").name)
            .toBe("ORCID (development mock)");
    });
});

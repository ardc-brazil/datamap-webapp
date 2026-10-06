import { describe, expect, jest, test } from '@jest/globals';

const post = jest.fn() as any;
jest.mock("../rpc", () => ({ __esModule: true, default: { post }, buildHeaders: jest.fn() }));

import { createUser } from "../users";

describe("createUser", () => {
    test("sends the name, email and provider, and no roles", async () => {
        post.mockResolvedValue({ data: { id: "u1" } });

        await createUser({ personName: "Ana", email: "ana@usp.br", userName: "ana", providerName: "orcid", providerID: "0000-0001" } as any);

        expect(post).toHaveBeenCalledWith("/users/", {
            name: "Ana",
            email: "ana@usp.br",
            providers: [{ name: "orcid", reference: "0000-0001" }],
        });
    });
});

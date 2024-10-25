import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('user api', () => {
    test('create and list users', async ({ request }) => {

        // Create a user
        const userCreated = await request.post(`/api/v1/users/`, {
            data: {
                "name": faker.person.fullName(),
                "email": faker.internet.email(),
                "roles": ["read"],
                "providers": [
                    {
                        "name": "playwright-api-test",
                        "reference": crypto.randomUUID(),
                    }
                ]
            },
        })
        expect(userCreated.ok()).toBeTruthy()

        // List users
        const users = await request.get(`/api/v1/users/`)
        expect(users.ok()).toBeTruthy()

        // Check if the created user is in the list
        expect(await users.json()).toContainEqual(expect.objectContaining(
            await userCreated.json()
        ));
    });
});
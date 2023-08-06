import { ROUTE_PAGE_DATASETS_DETAILS } from "../InternalRoutesConstants"

test('Replace URL', () => {
    const expectedId = 123;

    let url = ROUTE_PAGE_DATASETS_DETAILS({
        id: expectedId
    });

    expect(url).toBe("/app/datasets/123")
})
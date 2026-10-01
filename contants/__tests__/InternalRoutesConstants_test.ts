import { expect, test } from '@jest/globals';
import { ROUTE_PAGE_DATASETS_DETAILS } from "../InternalRoutesConstants";
import {
    ROUTE_PAGE_DATASETS_SHARED,
    ROUTE_PAGE_DOI_LANDING,
    ROUTE_PAGE_INVITATION,
    ROUTE_PAGE_ANONYMOUS,
} from "../InternalRoutesConstants";

test('Replace URL', () => {
    const expectedId = 123;

    let url = ROUTE_PAGE_DATASETS_DETAILS({
        id: expectedId
    });

    expect(url).toBe("/app/datasets/123")
})

test('Shared with me route', () => {
    expect(ROUTE_PAGE_DATASETS_SHARED).toBe("/app/datasets/shared")
})

test('Anonymous route', () => {
    expect(ROUTE_PAGE_ANONYMOUS({ token: "abc" })).toBe("/anonymous/abc")
})

test('Invitation route', () => {
    expect(ROUTE_PAGE_INVITATION({ token: "xyz" })).toBe("/invitations/xyz")
})

test('DOI landing route', () => {
    expect(ROUTE_PAGE_DOI_LANDING({ id: "d1", versionName: "2" })).toBe("/doi/datasets/d1/versions/2")
})
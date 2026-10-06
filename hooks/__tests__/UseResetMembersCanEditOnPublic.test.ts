/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useResetMembersCanEditOnPublic } from "../UseResetMembersCanEditOnPublic";

describe("useResetMembersCanEditOnPublic", () => {
    test("switching to Public forces the value to false", () => {
        const setFieldValue = jest.fn();
        const formikRef = { current: { setFieldValue } };

        const { rerender } = renderHook(
            ({ isPublicSelected }) => useResetMembersCanEditOnPublic(isPublicSelected, formikRef),
            { initialProps: { isPublicSelected: false } },
        );
        expect(setFieldValue).not.toHaveBeenCalled();

        rerender({ isPublicSelected: true });

        expect(setFieldValue).toHaveBeenCalledWith("membersCanEdit", false);
    });

    test("mounting with Public already selected sets the field too", () => {
        const setFieldValue = jest.fn();
        const formikRef = { current: { setFieldValue } };

        renderHook(() => useResetMembersCanEditOnPublic(true, formikRef));

        expect(setFieldValue).toHaveBeenCalledWith("membersCanEdit", false);
    });

    test("staying outside Public never touches the field", () => {
        const setFieldValue = jest.fn();
        const formikRef = { current: { setFieldValue } };

        renderHook(() => useResetMembersCanEditOnPublic(false, formikRef));

        expect(setFieldValue).not.toHaveBeenCalled();
    });
});

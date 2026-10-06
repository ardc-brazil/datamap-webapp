import { useEffect } from "react";

interface MembersCanEditFormikRef {
    setFieldValue: (field: string, value: boolean) => void;
}

export function useResetMembersCanEditOnPublic(
    isPublicSelected: boolean,
    formikRef: { current: MembersCanEditFormikRef | null },
) {
    useEffect(() => {
        if (isPublicSelected) {
            formikRef.current?.setFieldValue("membersCanEdit", false);
        }
    }, [isPublicSelected]);
}

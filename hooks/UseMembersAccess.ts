import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { messageForApiError } from "../contants/EmbargoConstants";
import { BFFAPI } from "../gateways/BFFAPI";

export function useMembersAccess(datasetId: string, afterSave?: () => Promise<unknown>) {
    const router = useRouter();
    const [bffGateway] = useState(() => new BFFAPI());
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const busyRef = useRef(false);

    async function save(membersCanEdit: boolean) {
        if (busyRef.current) {
            return;
        }
        busyRef.current = true;
        setBusy(true);
        setError(null);
        try {
            await bffGateway.setMembersAccess(datasetId, { members_can_edit: membersCanEdit });
            await afterSave?.();
            await router.replace(router.asPath, undefined, { scroll: false });
            setEditing(false);
        } catch (e) {
            setError(messageForApiError(e));
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    }

    return {
        editing,
        busy,
        error,
        open: () => {
            setError(null);
            setEditing(true);
        },
        close: () => setEditing(false),
        save,
    };
}

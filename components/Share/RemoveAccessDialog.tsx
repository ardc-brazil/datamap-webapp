import { ConsequenceList } from "../base/ConsequenceList";
import Modal from "../base/PopupModal";
import { SharePermission } from "../../types/GatekeeperAPI";

interface Props {
    permission: SharePermission | null
    embargoActive: boolean
    busy?: boolean
    onConfirm(permission: SharePermission): void
    onCancel(): void
}

export function RemoveAccessDialog(props: Props) {
    const permission = props.permission;

    return (
        <Modal
            title="Remove access?"
            show={!!permission}
            confimButtonText="Remove access"
            cancelButtonText="Cancel"
            destructive
            cancel={props.onCancel}
            confim={() => permission && props.onConfirm(permission)}
            confirmDisabled={props.busy}
            maxWidthClassName="max-w-[440px]"
        >
            {permission &&
                <div className="flex flex-col gap-3">
                    <p className="m-0 text-[13px] text-primary-500">{permission.user.name} · {permission.user.email}</p>
                    <ConsequenceList items={[
                        props.embargoActive ? "Existing download links expire within 1 hour" : "Download links already given out stay valid for up to 7 days",
                        "No notification is sent",
                    ]} />
                </div>
            }
        </Modal>
    );
}

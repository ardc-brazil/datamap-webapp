import { ReactNode } from "react";
import PopupModal from "../base/PopupModal";

export interface AdminDialogAction {
    label: string
    onClick(): void
    disabled?: boolean
    destructive?: boolean
}

interface Props {
    title: string
    subtitle?: ReactNode
    widthClassName: string
    children?: ReactNode
    onClose(): void
    primary?: AdminDialogAction
    secondaryLink?: { label: string; onClick(): void }
    closeLabel?: string
    cancelDisabled?: boolean
}

export function AdminDialog(props: Props) {
    const primary = props.primary;
    return (
        <PopupModal
            show
            variant="xl"
            title={props.title}
            subtitle={props.subtitle}
            maxWidthClassName={props.widthClassName}
            closeAriaLabel="Close dialog"
            cancel={props.onClose}
            cancelButtonText={props.closeLabel ?? (primary ? "Cancel" : "Close")}
            cancelDisabled={props.cancelDisabled}
            footerLink={props.secondaryLink}
            confim={primary?.onClick}
            confimButtonText={primary?.label}
            confirmDisabled={primary?.disabled}
            danger={primary?.destructive}
        >
            {props.children}
        </PopupModal>
    );
}

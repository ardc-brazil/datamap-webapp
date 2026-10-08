import { EDIT_FORM_ERROR_CLASS } from "../../contants/EditFormConstants";

export function EditFormError(props: { error?: string | null }) {
    if (!props.error) {
        return null;
    }
    return <p role="alert" className={EDIT_FORM_ERROR_CLASS}>{props.error}</p>;
}

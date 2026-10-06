import { useEffect, useState } from "react";
import Modal from "../base/PopupModal";
import { DialogError } from "../base/DialogError";

interface Props {
    show: boolean
    tenancyName: string
    membersCanEdit: boolean
    embargoActive: boolean
    busy?: boolean
    error?: string | null
    onCancel(): void
    onSave(membersCanEdit: boolean): void
}

export function MembersAccessDialog(props: Props) {
    const [choice, setChoice] = useState(props.membersCanEdit);

    useEffect(() => {
        if (props.show) {
            setChoice(props.membersCanEdit);
        }
    }, [props.show, props.membersCanEdit]);

    const options = [
        { value: true, label: "Read and edit", hint: `Their workspace role decides, as on any dataset of ${props.tenancyName}.` },
        { value: false, label: "Read only", hint: "They read and download. Editing, uploads and new versions stay with you and the people you share it with as Can write." },
    ];

    return (
        <Modal
            title={`What members of ${props.tenancyName} can do`}
            show={props.show}
            confimButtonText="Save"
            cancelButtonText="Cancel"
            cancel={props.onCancel}
            confim={() => props.onSave(choice)}
            confirmDisabled={props.busy}
            maxWidthClassName="max-w-[440px]"
        >
            <div className="flex flex-col gap-3">
                <fieldset className="flex flex-col gap-2.5 m-0 p-0 border-0">
                    <legend className="sr-only">What members can do</legend>
                    {options.map((option) => {
                        const selected = choice === option.value;
                        return (
                            <label key={option.label} className={`flex flex-col gap-1 m-0 rounded-md bg-primary-0 px-3.5 py-3 cursor-pointer ${selected ? "border-[1.5px] border-primary-900" : "border border-primary-200"}`}>
                                <span className="flex items-center gap-2 text-[13px] font-semibold text-primary-900">
                                    <input type="radio" name="membersAccess" checked={selected} onChange={() => setChoice(option.value)} className="h-3.5 w-3.5 p-0 accent-primary-900" />
                                    {option.label}
                                </span>
                                <span className="pl-[22px] text-xs leading-[17px] text-primary-600">{option.hint}</span>
                            </label>
                        );
                    })}
                </fieldset>
                {props.embargoActive && <p className="m-0 text-[13px] text-primary-500">Members have no access while the embargo lasts. This decides what they get when it ends.</p>}
                <DialogError message={props.error} />
            </div>
        </Modal>
    );
}

import { ErrorMessage, Field, useFormikContext } from "formik";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS } from "../../contants/EditFormConstants";
import { maxEmbargoDate, minEmbargoDate, toEmbargoUntil } from "../../lib/embargoDates";
import { daysFromToday, formatShortDate } from "../../lib/embargoDisplay";
import { membersAfterEmbargoLine } from "../../lib/membersAccess";
import { MembersAccessDialog } from "../Share/MembersAccessDialog";

interface Values {
    embargoMode: string
    embargoUntil: string
    embargoNote: string
    membersCanEdit?: boolean
}

const MEMBER_OPTIONS = [
    { value: "open", label: "See that it exists", hint: "Listed with an \"Embargoed\" badge. Title, description and authors readable; file names and downloads withheld." },
    { value: "hidden", label: "Don't see it at all", hint: "Hidden from every listing and search. Only you and the people you share it with know it exists." },
];

export function EmbargoFields(props: { tenancyName: string, disabled?: boolean, membersEditable?: boolean }) {
    const { values, setFieldValue } = useFormikContext<Values>();
    const [changingMembers, setChangingMembers] = useState(false);
    const membersCanEdit = values.membersCanEdit !== false;
    const now = new Date();
    const max = maxEmbargoDate(now);
    const days = values.embargoUntil ? daysFromToday(values.embargoUntil, now) : null;
    const until = values.embargoUntil ? formatShortDate(toEmbargoUntil(values.embargoUntil)) : null;

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="embargoUntil" className="m-0 text-[13px] font-semibold text-primary-900">Embargo ends</label>
                    <Field type="date" id="embargoUntil" name="embargoUntil" min={minEmbargoDate(now)} max={max} disabled={props.disabled} className={EDIT_FORM_INPUT_CLASS} />
                    <span className="text-xs leading-[17px] text-primary-500">
                        {days !== null ? `${days} days. ` : ""}Up to 90 days ({formatShortDate(toEmbargoUntil(max))}); you can extend it later, 90 days at a time.
                    </span>
                    <ErrorMessage name="embargoUntil" component="div" className={EDIT_FORM_ERROR_CLASS} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="embargoNote" className="m-0 text-[13px] font-semibold text-primary-900">Note <span className="font-normal text-primary-400">optional</span></label>
                    <Field type="text" id="embargoNote" name="embargoNote" maxLength={2000} placeholder="Under review at JGR Atmospheres" disabled={props.disabled} className={EDIT_FORM_INPUT_CLASS} />
                    <span className="text-xs leading-[17px] text-primary-500">Visible to you and the people with access.</span>
                </div>
            </div>
            <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
                <legend className="mb-2 text-[13px] font-semibold text-primary-900">While embargoed, other members of {props.tenancyName}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {MEMBER_OPTIONS.map((option) => {
                        const selected = values.embargoMode === option.value;
                        return (
                            <label key={option.value} className={`flex flex-col gap-1 m-0 rounded-md bg-primary-0 px-3.5 py-3 cursor-pointer ${selected ? "border-[1.5px] border-primary-900" : "border border-primary-200"}`}>
                                <span className="flex items-center gap-2 text-[13px] font-semibold text-primary-900">
                                    <input type="radio" name="embargoMode" value={option.value} checked={selected} disabled={props.disabled} onChange={() => setFieldValue("embargoMode", option.value)} className="h-3.5 w-3.5 p-0 accent-primary-900" />
                                    {option.label}
                                </span>
                                <span className="pl-[22px] text-xs leading-[17px] text-primary-600">{option.hint}</span>
                            </label>
                        );
                    })}
                </div>
            </fieldset>
            <p className="m-0 -mt-2 text-xs leading-[17px] text-primary-600">
                {membersAfterEmbargoLine(props.tenancyName, membersCanEdit)}
                {props.membersEditable !== false && <>
                    {" "}
                    <button
                        type="button"
                        aria-label={`Change what members of ${props.tenancyName} can do`}
                        disabled={props.disabled}
                        onClick={() => setChangingMembers(true)}
                        className="font-semibold text-primary-900 underline underline-offset-2 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                    >
                        Change
                    </button>
                </>}
            </p>
            <MembersAccessDialog
                show={changingMembers}
                tenancyName={props.tenancyName}
                membersCanEdit={membersCanEdit}
                embargoActive
                onCancel={() => setChangingMembers(false)}
                onSave={(value) => {
                    setFieldValue("membersCanEdit", value);
                    setChangingMembers(false);
                }}
            />
            <div className="flex gap-2.5 items-start rounded-md bg-embargo-100 px-3 py-2.5 text-xs leading-[18px] text-embargo-800">
                <MaterialSymbol icon="info" size={18} grade={-25} weight={400} className="flex-none" aria-hidden="true" />
                <span>
                    In either case there is no public page. Outside DataMap the DOI only says the dataset is under embargo
                    {until ? ` until ${until}` : ""}. Reviewers can read the metadata, with authors redacted, through a link you create after saving.
                </span>
            </div>
        </div>
    );
}

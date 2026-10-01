import { useFormikContext } from "formik";
import { EmbargoFields } from "./EmbargoFields";

interface Values {
    embargoMode: string
    embargoUntil: string
    embargoNote: string
}

export function EmbargoChoice(props: { tenancyName: string }) {
    const { values, setFieldValue } = useFormikContext<Values>();
    const embargoed = values.embargoMode !== "none";
    const options = [
        { embargo: false, label: "Open to the workspace", hint: `Every member of ${props.tenancyName} can read and download the files.` },
        { embargo: true, label: "Under embargo", hint: "Only you and the people you share it with reach the files. The dataset stays citable: you can reserve a DOI and give reviewers a read-only link." },
    ];

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-primary-900">Who can see it</span>
            <span className="text-[13px] leading-[19px] text-primary-500">You can change this later, as long as the dataset hasn&apos;t been published.</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {options.map((option) => {
                    const selected = embargoed === option.embargo;
                    return (
                        <label key={option.label} className={`flex flex-col gap-1 m-0 rounded-md bg-primary-0 px-3.5 py-3 cursor-pointer ${selected ? "border-[1.5px] border-primary-900" : "border border-primary-200"}`}>
                            <span className="flex items-center gap-2 text-sm font-semibold text-primary-900">
                                <input
                                    type="radio"
                                    name="visibility"
                                    checked={selected}
                                    onChange={() => setFieldValue("embargoMode", option.embargo ? "hidden" : "none")}
                                    className="h-3.5 w-3.5 p-0 accent-primary-900"
                                />
                                {option.label}
                            </span>
                            <span className="pl-[22px] text-[13px] leading-[19px] text-primary-600">{option.hint}</span>
                        </label>
                    );
                })}
            </div>
            {embargoed &&
                <div className="mt-2 rounded-lg border border-primary-200 bg-primary-0 p-5">
                    <EmbargoFields tenancyName={props.tenancyName} />
                </div>
            }
        </div>
    );
}

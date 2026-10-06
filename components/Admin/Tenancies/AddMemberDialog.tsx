import { useFormik } from "formik";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import * as Yup from "yup";
import { ADMIN_COPY, ADMIN_SEARCH_DEBOUNCE_MS, ADMIN_USER_SEARCH_MIN_LENGTH, adminErrorFrom } from "../../../contants/AdminConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { useAdminUserSearch } from "../../../hooks/UseAdmin";
import { useDebouncedValue } from "../../../hooks/UseDebouncedValue";
import { firstNameOf } from "../../../lib/tenancySelection";
import { AdminTenancy, AdminUserHit } from "../../../types/GatekeeperAPI";
import { PersonInitial } from "../../Share/PersonInitial";
import { AdminDialog } from "../AdminDialog";

interface Props {
    tenancy: AdminTenancy
    onCancel(): void
    onAdded(): void
}

const HINT = "m-0 text-[13px] text-primary-500";
const ERROR_ID = "add-member-error";

export function AddMemberDialog({ tenancy, onCancel, onAdded }: Props) {
    const [search, setSearch] = useState("");
    const [picked, setPicked] = useState<AdminUserHit | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [added, setAdded] = useState(false);
    const q = useDebouncedValue(search.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
    const { data: hits, error: searchError } = useAdminUserSearch(q);
    const formik = useFormik({
        initialValues: { userId: "" },
        validationSchema: Yup.object({ userId: Yup.string().required() }),
        validateOnChange: false,
        onSubmit: async ({ userId }) => {
            setError(null);
            try {
                await new BFFAPI().addTenancyMember(tenancy.path, userId);
                setAdded(true);
                onAdded();
            } catch (e) {
                setError(adminErrorFrom(e));
            }
        },
    });

    function submit() {
        if (picked && !added && !formik.isSubmitting) {
            formik.submitForm();
        }
    }

    function pick(hit: AdminUserHit | null) {
        setError(null);
        setPicked(hit);
        formik.setFieldValue("userId", hit?.id ?? "");
    }

    return (
        <AdminDialog
            title={`Add to ${tenancy.display_name}`}
            widthClassName="max-w-[440px]"
            onClose={onCancel}
            primary={{ label: "Add", disabled: !picked || added || formik.isSubmitting, onClick: submit }}
        >
            <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4" noValidate>
                <div className="relative">
                    <MaterialSymbol icon="search" size={18} weight={400} grade={-25} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" />
                    <input
                        type="search"
                        aria-label="Search people"
                        placeholder={ADMIN_COPY.searchPlaceholder}
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            pick(null);
                        }}
                        className="h-9 py-0 pl-9"
                    />
                </div>
                {q.length < ADMIN_USER_SEARCH_MIN_LENGTH ? (
                    <p className={HINT}>{ADMIN_COPY.searchHint}</p>
                ) : searchError ? (
                    <p role="alert" className="m-0 text-[13px] text-danger-700">{ADMIN_COPY.searchError}</p>
                ) : !hits ? (
                    <p role="status" className={HINT}>Searching…</p>
                ) : hits.length === 0 ? (
                    <p className={HINT}>{`No account matches “${q}”.`}</p>
                ) : (
                    <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
                        <legend className="sr-only">People</legend>
                        {hits.map((hit) => {
                            const checked = picked?.id === hit.id;
                            return (
                                <label key={hit.id} className={`m-0 flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 font-normal ${checked ? "bg-secondary-500" : "hover:bg-primary-100"}`}>
                                    <input
                                        type="radio"
                                        name="userId"
                                        checked={checked}
                                        onChange={() => pick(hit)}
                                        aria-describedby={checked && error ? ERROR_ID : undefined}
                                        aria-invalid={checked && error ? true : undefined}
                                        className="h-3.5 w-3.5 p-0 accent-primary-900"
                                    />
                                    <PersonInitial name={hit.name} />
                                    <span className="min-w-0">
                                        <span className="block truncate text-[13px] font-semibold text-primary-900">{hit.name}</span>
                                        <span className="block truncate text-xs text-primary-500">{hit.email ?? "No email"}</span>
                                    </span>
                                </label>
                            );
                        })}
                    </fieldset>
                )}
                {picked && (
                    <p className="m-0 flex items-center gap-2 rounded-md bg-primary-100 px-3 py-2.5 text-[13px] text-primary-700">
                        <MaterialSymbol icon="mail" size={18} weight={400} grade={-25} />
                        <span>{`${firstNameOf(picked.name)} is emailed.`}</span>
                    </p>
                )}
                {error && <p id={ERROR_ID} role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
            </form>
        </AdminDialog>
    );
}

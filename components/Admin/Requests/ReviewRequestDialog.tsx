import { useFormik } from "formik";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import * as Yup from "yup";
import { ADMIN_COPY, adminErrorMessage, slugifyNamespace } from "../../../contants/AdminConstants";
import { DISPLAY_NAME_MAX_LENGTH, PRODUCTION_PREFIX } from "../../../contants/TenancyConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { useAdminRequest, useAdminTenancies } from "../../../hooks/UseAdmin";
import { useSubmitOnce } from "../../../hooks/UseSubmitOnce";
import { plural, requestedAgo } from "../../../lib/adminDisplay";
import { formatShortDate } from "../../../lib/embargoDisplay";
import { errorDetail } from "../../../lib/gatekeeperDetail";
import { firstNameOf } from "../../../lib/tenancySelection";
import { AdminTenancy, AdminTenancyRequest, AdminTenancyRequestDetail, TenancyDecision } from "../../../types/GatekeeperAPI";
import { AdminDialog } from "../AdminDialog";
import { NEW_TENANCY_SCHEMA, NewTenancyFailure, NewTenancyFields, newTenancyFailure } from "../NewTenancyFields";

type Mode = "join" | "new";

interface Props {
    requestId: string
    now?: Date
    onClose(): void
    onApproved(): void
    onDecline(request: AdminTenancyRequest): void
}

const WIDTH = "max-w-[560px]";
const FIELD_ERROR = "m-0 mt-1.5 text-[13px] text-danger-700";

const schema = Yup.object({
    mode: Yup.string().oneOf(["join", "new"]).required(),
    tenancy: Yup.string().when("mode", {
        is: "join",
        then: (s) => s.required("Choose the tenancy to join."),
    }),
    displayName: Yup.string().when("mode", { is: "new", then: () => NEW_TENANCY_SCHEMA.displayName }),
    namespace: Yup.string().when("mode", { is: "new", then: () => NEW_TENANCY_SCHEMA.namespace }),
});

function joinable(tenancies: AdminTenancy[], detail: AdminTenancyRequestDetail): AdminTenancy[] {
    const current = new Set(detail.requester_tenancies.map((tenancy) => tenancy.path));
    return tenancies.filter((tenancy) => tenancy.path.startsWith(PRODUCTION_PREFIX) && !tenancy.is_default && tenancy.is_enabled && !current.has(tenancy.path));
}

function decidedText(detail: AdminTenancyRequestDetail): string {
    const outcome = detail.status === "approved" ? `approved into ${detail.tenancy?.display_name ?? detail.requested_name}` : "declined";
    const who = detail.decided_by?.name ?? "an administrator";
    const when = detail.decided_at ? ` on ${formatShortDate(detail.decided_at)}` : "";
    return `This request was already ${outcome} by ${who}${when}.`;
}

export function ReviewRequestDialog(props: Props) {
    const { data: detail, error } = useAdminRequest(props.requestId);
    const { data: tenancies, error: tenanciesError } = useAdminTenancies();

    if (error || tenanciesError) {
        return (
            <AdminDialog title="Review request" widthClassName={WIDTH} onClose={props.onClose}>
                <p role="alert" className="m-0 text-sm text-danger-700">{adminErrorMessage(error?.detail)}</p>
            </AdminDialog>
        );
    }

    if (!detail || !tenancies) {
        return (
            <AdminDialog title="Review request" widthClassName={WIDTH} onClose={props.onClose}>
                <p role="status" className="m-0 text-sm text-primary-500">Loading request…</p>
            </AdminDialog>
        );
    }

    if (detail.status !== "pending") {
        return (
            <AdminDialog title="Review request" subtitle={`${detail.requester.name} · ${detail.requested_name}`} widthClassName={WIDTH} onClose={props.onClose}>
                <p className="m-0 text-sm text-primary-700">{decidedText(detail)}</p>
            </AdminDialog>
        );
    }

    return <ReviewForm {...props} detail={detail} tenancies={tenancies} />;
}

function ReviewForm({ detail, tenancies, now, onClose, onApproved, onDecline }: Props & { detail: AdminTenancyRequestDetail; tenancies: AdminTenancy[] }) {
    const options = joinable(tenancies, detail);
    const suggested = options.find((tenancy) => tenancy.path === detail.suggested_tenancy?.path);
    const [failure, setFailure] = useState<NewTenancyFailure | null>(null);
    const [accountGone, setAccountGone] = useState(false);
    const { submit, busy, done } = useSubmitOnce();
    const formik = useFormik({
        initialValues: {
            mode: (detail.kind === "join" ? "join" : "new") as Mode,
            tenancy: suggested?.path ?? "",
            displayName: detail.requested_name.trim().slice(0, DISPLAY_NAME_MAX_LENGTH),
            namespace: slugifyNamespace(detail.requested_name),
        },
        validationSchema: schema,
        onSubmit: async (values) => {
            setFailure(null);
            const decision: TenancyDecision = values.mode === "join"
                ? { tenancy: values.tenancy }
                : { newTenancy: { displayName: values.displayName.trim(), namespace: values.namespace.trim() } };
            try {
                await submit(async () => {
                    await new BFFAPI().approveTenancyRequest(detail.id, decision);
                    onApproved();
                });
            } catch (e) {
                const gone = errorDetail(e) === "no_account";
                setAccountGone(gone);
                setFailure(gone ? { field: null, message: ADMIN_COPY.approveNoAccount } : newTenancyFailure(e));
            }
        },
    });

    const { values } = formik;
    const joining = values.mode === "join";
    const selected = options.find((tenancy) => tenancy.path === values.tenancy);
    const unverified = !detail.requester.email_verified;
    const blocked = done || accountGone || (joining ? options.length === 0 : unverified);
    const tenancyError = (formik.touched.tenancy || formik.submitCount > 0) && formik.errors.tenancy;
    const generalError = failure && (!failure.field || joining) ? failure.message : null;
    const title = joining
        ? `Join ${selected?.display_name ?? "an existing tenancy"}`
        : `New tenancy: ${values.displayName.trim() || detail.requested_name}`;
    const subtitle = `${detail.requester.name} · ${detail.requester.email ?? "no email"} · requested ${requestedAgo(detail.created_at, now ?? new Date())}`;

    return (
        <AdminDialog
            title={title}
            subtitle={subtitle}
            widthClassName={WIDTH}
            onClose={onClose}
            cancelDisabled={busy}
            secondaryLink={{ label: "Decline…", onClick: () => onDecline(detail) }}
            primary={{ label: joining ? "Approve" : "Create and approve", disabled: blocked || busy, onClick: () => { void formik.submitForm(); } }}
        >
            <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
                <div role="group" aria-label="Decision" className="inline-flex self-start rounded-md border border-primary-300 p-0.5">
                    {(["join", "new"] as Mode[]).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            aria-pressed={values.mode === mode}
                            onClick={() => {
                                if (values.mode !== mode) {
                                    formik.setFieldValue("mode", mode);
                                    if (!accountGone) {
                                        setFailure(null);
                                    }
                                }
                            }}
                            className={`h-8 rounded px-3 text-[13px] font-semibold ${values.mode === mode ? "bg-primary-900 text-primary-50" : "text-primary-700 hover:bg-primary-100"}`}
                        >
                            {mode === "join" ? "Join existing" : "New tenancy"}
                        </button>
                    ))}
                </div>

                {!joining && unverified && (
                    <p className="m-0 flex items-start gap-2 rounded-md bg-embargo-100 px-3 py-2.5 text-[13px] text-embargo-800">
                        <MaterialSymbol icon="warning" size={18} weight={400} grade={-25} fill />
                        <span>{ADMIN_COPY.unverifiedBanner}</span>
                    </p>
                )}

                {joining && (
                    <div>
                        {options.length > 0 ? (
                            <>
                                <label htmlFor="review-tenancy" className="mb-1.5 text-[13px]">Tenancy</label>
                                <select
                                    id="review-tenancy"
                                    name="tenancy"
                                    value={values.tenancy}
                                    onChange={formik.handleChange}
                                    aria-describedby={tenancyError ? "review-tenancy-error" : undefined}
                                    aria-invalid={tenancyError ? true : undefined}
                                    className="bg-primary-0"
                                >
                                    <option value="">Choose a tenancy</option>
                                    {options.map((tenancy) => (
                                        <option key={tenancy.path} value={tenancy.path}>{tenancy.display_name} · {tenancy.path}</option>
                                    ))}
                                </select>
                            </>
                        ) : (
                            <>
                                <p className="mb-1.5 text-[13px]">Tenancy</p>
                                <p className="m-0 text-[13px] text-primary-500">{ADMIN_COPY.nothingToJoin}</p>
                            </>
                        )}
                        {tenancyError && <p id="review-tenancy-error" role="alert" className={FIELD_ERROR}>{formik.errors.tenancy}</p>}
                    </div>
                )}

                <dl className="m-0 grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-lg border border-primary-200 px-4 py-3.5 text-[13px]">
                    {joining && selected && (
                        <>
                            <dt className="text-primary-500">Tenancy</dt>
                            <dd className="m-0">
                                <span className="block font-semibold text-primary-900">{selected.display_name}</span>
                                <span className="block font-mono text-xs text-primary-500">{`${selected.path} · ${selected.members} ${plural(selected.members, "member", "members")}`}</span>
                            </dd>
                        </>
                    )}
                    <dt className="text-primary-500">Reason</dt>
                    <dd className="m-0 text-primary-900">{`“${detail.reason}”`}</dd>
                    <dt className="text-primary-500">Currently in</dt>
                    <dd className="m-0 font-mono text-xs text-primary-700">{detail.requester_tenancies.map((tenancy) => tenancy.path).join(", ")}</dd>
                </dl>

                {!joining && (
                    <NewTenancyFields
                        formik={formik}
                        idPrefix="review"
                        failure={failure}
                        onEdit={() => { if (!accountGone) setFailure(null); }}
                        className="grid grid-cols-2 gap-3"
                        previewSuffix=" · requester becomes a member"
                    />
                )}

                <p className="m-0 flex items-center gap-2 rounded-md bg-primary-100 px-3 py-2.5 text-[13px] text-primary-700">
                    <MaterialSymbol icon="mail" size={18} weight={400} grade={-25} />
                    <span>{`${firstNameOf(detail.requester.name)} is emailed either way.`}</span>
                </p>
                {generalError && <p role="alert" className="m-0 text-sm text-danger-700">{generalError}</p>}
            </form>
        </AdminDialog>
    );
}

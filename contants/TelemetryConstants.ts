// What the browser may report to /api/telemetry. The endpoint is public, so
// anything outside these lists is dropped or filed as "other": otherwise a
// stranger could mint one metric series per request.

export const PAGES: readonly string[] = [
  "/",
  "/404",
  "/500",
  "/account/login",
  "/anonymous/[token]",
  "/app/datasets",
  "/app/datasets/[datasetId]",
  "/app/datasets/[datasetId]/versions/[versionName]",
  "/app/datasets/new",
  "/app/datasets/shared",
  "/app/error",
  "/app/home",
  "/app/notebooks",
  "/app/profile",
  "/app/tenancy",
  "/datasets/[datasetId]",
  "/design-system",
  "/doi/datasets/[datasetId]/versions/[versionName]",
  "/invitations/[token]",
  "/orcid-oauth-callback",
  "/project/about",
  "/project/data-policy",
  "/project/partners-and-supporters",
  "/project/research-group",
  "/project/support",
  "/tools",
];

export const UI_EVENTS = [
  "search",
  "filter_applied",
  "download_clicked",
  "upload_started",
  "upload_completed",
  "upload_failed",
  "dataset_created",
  "version_created",
  "version_published",
  "doi_created",
  "tenancy_switched",
  "embargo_set",
  "embargo_extended",
  "dataset_shared",
  "anonymous_link_created",
] as const;

export type UiEvent = (typeof UI_EVENTS)[number];

// Web Vitals reported in milliseconds; CLS is a unitless score.
export const TIMED_VITALS = ["TTFB", "FCP", "LCP", "INP"] as const;

export const TELEMETRY_MAX_EVENTS_PER_BATCH = 50;

export function pageLabel(page: string | undefined): string {
  return page !== undefined && PAGES.includes(page) ? page : "other";
}

export function uiEventLabel(event: string | undefined): UiEvent | undefined {
  return (UI_EVENTS as readonly string[]).includes(event ?? "") ? (event as UiEvent) : undefined;
}

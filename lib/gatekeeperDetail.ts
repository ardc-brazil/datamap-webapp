/** A gatekeeper `detail` that is not a string code (a FastAPI 422 list, for one) never reaches the browser. */
export function gatekeeperDetail(body: unknown): string | undefined {
    const detail = (body as { detail?: unknown } | undefined)?.detail;
    return typeof detail === "string" ? detail : undefined;
}

export function errorDetail(error: unknown): string | undefined {
    return gatekeeperDetail((error as { response?: { data?: unknown } } | undefined)?.response?.data);
}

// Imported by `rpc.ts`, which the browser bundle also imports: nothing here may
// pull in prom-client. The server installs the recorder on globalThis
// (lib/metrics.ts); in the browser there is none and recording is a no-op.

export type CallOutcome = "success" | "client_error" | "server_error" | "timeout" | "error";

type Recorder = (service: string, operation: string, outcome: CallOutcome, seconds: number) => void;

const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const NUMBER = /^\d+$/;
const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT"]);

// secrets.token_urlsafe(32) tokens, not ids: one top-level route, literals excepted.
// Anchored so a nested route sharing the resource name (e.g. /users/{id}/invitations/claim)
// is never touched, regardless of an /api or /api/vN prefix.
const TOP_LEVEL_TOKEN_LITERALS: Record<string, Set<string>> = {
  invitations: new Set(["accept"]),
  anonymous: new Set(),
};

export function maskPathTokens(path: string): string {
  for (const [resource, literals] of Object.entries(TOP_LEVEL_TOKEN_LITERALS)) {
    const match = path.match(new RegExp(`^((?:/api(?:/v\\d+)?)?/${resource}/)([^/?]+)`, "i"));
    if (match && !literals.has(match[2])) {
      return path.slice(0, match[1].length) + "{token}" + path.slice(match[1].length + match[2].length);
    }
  }
  return path;
}

export function operationOf(method: string | undefined, url: string | undefined): string {
  let path = (url ?? "").split("?")[0];
  try {
    path = new URL(path).pathname;
  } catch {
    // Relative to the axios baseURL, which is what it usually is.
  }
  path = maskPathTokens(path);

  const segments = path.split("/");
  const templated = segments.map((segment, index) => {
    if (segments[index - 2] === "providers" && segments[index - 3] === "users") {
      return "{ref}";
    }
    if (segments[index - 1] === "providers" && segments[index - 2] === "users") {
      return "{provider}";
    }
    if (segment === "{token}") {
      return segment;
    }
    if (UUID.test(segment)) {
      return "{id}";
    }
    if (NUMBER.test(segment)) {
      return "{n}";
    }
    return segment;
  });

  return `${(method ?? "get").toUpperCase()} ${templated.join("/")}`;
}

export function callOutcome(
  status: number | undefined,
  error: { code?: string; message?: string } | undefined
): CallOutcome {
  if (status !== undefined) {
    if (status >= 500) return "server_error";
    if (status >= 400) return "client_error";
    return error ? "error" : "success";
  }
  if (!error) return "success";
  return error.code && TIMEOUT_CODES.has(error.code) ? "timeout" : "error";
}

export function recordExternalCall(
  service: string,
  operation: string,
  outcome: CallOutcome,
  seconds: number
): void {
  const recorder = (globalThis as { __datamapRecordExternalCall?: Recorder }).__datamapRecordExternalCall;
  recorder?.(service, operation, outcome, seconds);
}

/**
 * One logging shape for the BFF: JSON, no credentials, correlatable.
 *
 * Deliberately the same field names as the gatekeeper's and the archivist's
 * `logging_config.py`, because a log index later reads all three together.
 *
 * Server-side only. Importing this in a component would put `async_hooks` in
 * the browser bundle.
 */

import { AsyncLocalStorage } from "async_hooks";

const REDACTED = "[redacted]";

const SECRET_KEY = /token|secret|password|authorization|api[-_]?key|cookie/i;

const requestIdStorage = new AsyncLocalStorage<string>();

export function withRequestId<T>(requestId: string, run: () => T): T {
  return requestIdStorage.run(requestId, run);
}

export function currentRequestId(): string | undefined {
  return requestIdStorage.getStore();
}

export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (seen.has(value as object)) {
    return "[circular]";
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, inner]) => [
      key,
      SECRET_KEY.test(key) ? REDACTED : redact(inner, seen),
    ])
  );
}

/**
 * What may be logged about a failed call.
 *
 * Never the error itself: the BFF's axios instance carries X-Api-Key and
 * X-Api-Secret on every request, and printing an axios error prints
 * `error.config.headers` with them.
 */
export function describeError(error: unknown): Record<string, unknown> {
  if (error === null || error === undefined) {
    return { message: String(error) };
  }

  const candidate = error as {
    isAxiosError?: boolean;
    message?: string;
    code?: string;
    response?: { status?: number };
    config?: { url?: string; method?: string; baseURL?: string };
  };

  if (candidate.isAxiosError) {
    return {
      message: candidate.message,
      code: candidate.code,
      status: candidate.response?.status,
      method: candidate.config?.method,
      url: candidate.config?.url,
    };
  }

  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }

  // Not everything thrown is an Error. `String(someObject)` is "[object
  // Object]", which is how a status code stops being a status code.
  if (typeof error === "object") {
    return redact(error) as Record<string, unknown>;
  }

  return { message: String(error) };
}

function emit(level: string, logger: string, message: string, extra: Record<string, unknown>): void {
  const entry: Record<string, unknown> = {
    message,
    ...(redact(extra) as Record<string, unknown>),
    timestamp: new Date().toISOString(),
    level,
    logger,
  };
  const requestId = currentRequestId();
  if (requestId) {
    entry.request_id = requestId;
  }
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

export function logAccess(access: {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}): void {
  emit("INFO", "bff.access", "request", {
    method: access.method,
    path: access.path,
    status_code: access.statusCode,
    duration_ms: Math.round(access.durationMs * 10) / 10,
  });
}

export function logError(
  message: string,
  error: unknown,
  extra: Record<string, unknown> = {}
): void {
  emit("ERROR", "bff", message, { ...extra, error: describeError(error) });
}

export function logInfo(message: string, extra: Record<string, unknown> = {}): void {
  emit("INFO", "bff", message, extra);
}

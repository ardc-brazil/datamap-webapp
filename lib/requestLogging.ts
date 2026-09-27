import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

import { logAccess } from "./logging";
import { getMetrics, routeOf } from "./metrics";
import { withRequestId } from "./requestContext";

export async function requestLogging(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<unknown>
): Promise<unknown> {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  // Stamped back on the request: `rpc.ts` reads it from the context, because
  // the browser bundle imports that module and cannot read the async storage.
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-Id", requestId);

  const started = Date.now();
  // Path only: a query string can carry anything the caller put there.
  const path = (req.url ?? "").split("?")[0];
  const method = req.method ?? "";
  const metrics = getMetrics();
  metrics.inProgress.labels(method).inc();

  return withRequestId(requestId, async () => {
    try {
      return await next();
    } finally {
      const durationMs = Date.now() - started;
      const route = routeOf(req.url, req.query ?? {});
      metrics.inProgress.labels(method).dec();
      metrics.recordRequest(
        method,
        route,
        res.statusCode,
        durationMs / 1000,
        declaredLength(req.headers["content-length"]),
        declaredLength(res.getHeader?.("content-length"))
      );
      logAccess({ method, path, route, statusCode: res.statusCode, durationMs });
    }
  });
}

function declaredLength(header: unknown): number | undefined {
  const value = Number(Array.isArray(header) ? header[0] : header);
  return header !== undefined && Number.isFinite(value) ? value : undefined;
}

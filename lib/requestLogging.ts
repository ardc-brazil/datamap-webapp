import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

import { logAccess } from "./logging";
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

  return withRequestId(requestId, async () => {
    try {
      return await next();
    } finally {
      logAccess({
        method: req.method ?? "",
        path,
        statusCode: res.statusCode,
        durationMs: Date.now() - started,
      });
    }
  });
}

import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

import { logAccess, withRequestId } from "./logging";

/**
 * Gives every BFF request an id and writes one access line for it.
 *
 * The id goes out to the gatekeeper on every call (see `buildHeaders` in
 * `rpc.ts`), which honours an incoming `X-Request-Id`. One action by a
 * researcher therefore reads as one id across the browser, this service and
 * the API.
 */
export async function requestLogging(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<unknown>
): Promise<unknown> {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
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

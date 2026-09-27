import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

import { TELEMETRY_MAX_EVENTS_PER_BATCH, pageLabel, uiEventLabel } from "../../contants/TelemetryConstants";
import { logTelemetry } from "../../lib/logging";
import { TelemetryEvent, getMetrics } from "../../lib/metrics";
import { requestLogging } from "../../lib/requestLogging";

const MAX_MESSAGE_LENGTH = 300;

export const config = {
  api: { bodyParser: { sizeLimit: "16kb" } },
};

// What goes to the log is rebuilt from the allowed fields, never echoed back:
// the endpoint is public and anyone can post to it.
function forTheLog(event: TelemetryEvent): Record<string, unknown> | undefined {
  const page = pageLabel(event?.page);
  switch (event?.type) {
    case "pageview":
      return { type: "pageview", page };
    case "error":
      return { type: "error", page, message: String(event.message ?? "").slice(0, MAX_MESSAGE_LENGTH) };
    case "ui": {
      const name = uiEventLabel(event.event);
      return name ? { type: "ui", event: name, page } : undefined;
    }
    case "vital":
      return Number.isFinite(Number(event.value))
        ? { type: "vital", name: String(event.name).slice(0, 8), value: Number(event.value), page }
        : undefined;
    default:
      return undefined;
  }
}

async function userId(req: NextApiRequest): Promise<string | undefined> {
  try {
    return ((await getToken({ req }))?.uid as string) ?? undefined;
  } catch {
    return undefined;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requestLogging(req, res, async () => {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      res.status(405).end();
      return;
    }

    const events = req.body?.events;
    if (!Array.isArray(events)) {
      res.status(400).end();
      return;
    }

    const batch = events.slice(0, TELEMETRY_MAX_EVENTS_PER_BATCH) as TelemetryEvent[];
    const accepted = getMetrics().recordTelemetry(batch);
    const logged = batch.map(forTheLog).filter((event) => event !== undefined);
    if (logged.length) {
      logTelemetry({ user_id: await userId(req), accepted, events: logged });
    }

    res.status(204).end();
  });
}

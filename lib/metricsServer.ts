// Its own port, published to no host: nginx forwards everything on 3000 to the
// internet, so the docker network is the boundary, as for the gatekeeper.

import { createServer, Server } from "http";

import { getMetrics } from "./metrics";
import { logError, logInfo } from "./logging";

export function startMetricsServer(port: number, host = "0.0.0.0"): Promise<Server | undefined> {
  const holder = globalThis as { __datamapMetricsServer?: Server };
  if (holder.__datamapMetricsServer) {
    return Promise.resolve(holder.__datamapMetricsServer);
  }

  const registry = getMetrics().registry;
  const server = createServer(async (req, res) => {
    if (req.method !== "GET" || req.url?.split("?")[0] !== "/metrics") {
      res.writeHead(404).end();
      return;
    }
    try {
      const body = await registry.metrics();
      res.writeHead(200, { "Content-Type": registry.contentType }).end(body);
    } catch (error) {
      logError("could not render metrics", error);
      res.writeHead(500).end();
    }
  });
  holder.__datamapMetricsServer = server;

  return new Promise((resolve) => {
    // A second `next dev` on the same machine must not take the app down.
    server.once("error", (error) => {
      logError("metrics server could not start", error, { port });
      delete holder.__datamapMetricsServer;
      resolve(undefined);
    });
    server.listen(port, host, () => {
      logInfo("metrics server listening", { port: (server.address() as { port: number }).port });
      resolve(server);
    });
  });
}

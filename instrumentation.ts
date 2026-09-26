export async function register() {
  // This shape, not an early return: it is what lets the edge bundle drop
  // prom-client, which needs node's fs.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMetricsServer } = await import("./lib/metricsServer");
    await startMetricsServer(Number(process.env.METRICS_PORT ?? 9095));
  }
}

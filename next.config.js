// next.config.js
module.exports = {
  // ... rest of the configuration.
  output: "standalone",
  experimental: {
    // Starts the metrics port (instrumentation.ts) once per server process.
    instrumentationHook: true,
  },
  env: {
    NEXT_PUBLIC_TUS_SERVICE_ENDPOINT: process.env.NEXT_PUBLIC_TUS_SERVICE_ENDPOINT,
  },
  async redirects() {
    return [
      {
        source: '/datasets/:dataset/versions/:version',
        destination: '/datasets/:dataset?version=:version',
        permanent: true,
      },
    ];
  },
};

// next.config.js
module.exports = {
  // ... rest of the configuration.
  output: "standalone",
  env: {
    TUS_SERVICE_ENDPOINT: process.env.NEXT_PUBLIC_TUS_SERVICE_ENDPOINT,
  },
};

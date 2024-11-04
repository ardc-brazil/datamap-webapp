// next.config.js
module.exports = {
  // ... rest of the configuration.
  output: "standalone",
  env: {
    NEXT_PUBLIC_TUS_SERVICE_ENDPOINT: process.env.NEXT_PUBLIC_TUS_SERVICE_ENDPOINT,
    NEXT_PUBLIC_DATAMAP_HOMEPAGE: process.env.NEXT_PUBLIC_DATAMAP_HOMEPAGE,
  },
};

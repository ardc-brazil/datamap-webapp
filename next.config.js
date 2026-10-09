// next.config.js
const withMDX = require("@next/mdx");

// remark-frontmatter and remark-gfm only ship ESM; this file is CommonJS.
module.exports = async () => {
  const remarkFrontmatter = (await import("remark-frontmatter")).default;
  const remarkGfm = (await import("remark-gfm")).default;

  return withMDX({
    extension: /\.mdx?$/,
    options: { remarkPlugins: [remarkFrontmatter, remarkGfm] },
  })({
    // ... rest of the configuration.
    output: "standalone",
    // `make manual` builds into its own directory so it never replaces a running `next dev`.
    distDir: process.env.NEXT_DIST_DIR || ".next",
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
  });
};

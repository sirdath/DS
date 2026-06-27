/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ds/ui", "@ds/tokens", "@ds/xenia", "@ds/aegis", "@ds/plutus", "@ds/argus", "@ds/peitho"],
  trailingSlash: true,
  // Serve the Samioglou client site (a separate static Vercel deployment) under
  // ds2-consulting.com/samioglou via a transparent proxy rewrite. trailingSlash:true
  // redirects /samioglou -> /samioglou/ so the site's relative asset paths resolve.
  async rewrites() {
    return [
      {
        source: "/samioglou",
        destination: "https://samioglou.vercel.app",
      },
      {
        source: "/samioglou/:path*",
        destination: "https://samioglou.vercel.app/:path*",
      },
    ];
  },
  // The client password page generalised from /megagym-login to /client-login;
  // keep the old URL working for any already-shared links.
  async redirects() {
    return [
      {
        source: "/megagym-login",
        destination: "/client-login",
        permanent: false,
      },
    ];
  },
  // Long-lived immutable caching for the heavy, settled media (hero films + posters,
  // portal images) so repeat visits load them straight from cache — the Sanjaya /
  // CloudFront approach (Vercel already serves these with 206 range requests).
  // NOTE: filenames are stable, so if you REPLACE one of these assets, rename it or
  // append a ?v= query param to bust the year-long cache.
  async headers() {
    return [
      {
        source: "/hero/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/portals/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;

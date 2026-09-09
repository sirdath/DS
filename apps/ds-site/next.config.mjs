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
      // The tools dashboard moved from /workspace to /products — keep old links working.
      {
        source: "/workspace",
        destination: "/products",
        permanent: true,
      },
      {
        source: "/workspace/:path*",
        destination: "/products/:path*",
        permanent: true,
      },
      // Leads / Hunt / Outreach unified under one "Funnel" tab — keep old links working.
      { source: "/admin/leads", destination: "/admin/funnel/leads", permanent: true },
      { source: "/admin/hunt", destination: "/admin/funnel/hunt", permanent: true },
      { source: "/admin/outreach", destination: "/admin/funnel/outreach", permanent: true },
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
      // Baseline security headers on every route. HSTS is already added by the
      // host, so it is deliberately not repeated here.
      //
      // No CSP yet: the no-flash bootstrap scripts (layout.tsx,
      // assistant/layout.tsx) are inline and GSAP/three are loaded dynamically,
      // so an enforcing policy needs nonce plumbing that does not exist yet.
      // X-Frame-Options carries the clickjacking protection on its own.
      // frame-ancestors is IGNORED in a report-only CSP, so a report-only
      // policy would have bought nothing here.
      //
      // Permissions-Policy: microphone stays at its default `self` allowlist
      // ON PURPOSE, because /assistant uses the Web Speech API for dictation
      // and locking it down would silently break that button.
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;

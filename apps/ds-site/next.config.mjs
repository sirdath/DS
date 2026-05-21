/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ds/ui", "@ds/tokens"],
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
};

export default nextConfig;

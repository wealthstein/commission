import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Custom source (not the default GenerateSW) so the service worker can
  // handle push events for Inbox notifications - see public source at
  // src/worker/custom-sw.js, injected with the Workbox precache manifest
  // at build time.
  swSrc: "pwa/custom-sw.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default withPWA(nextConfig);

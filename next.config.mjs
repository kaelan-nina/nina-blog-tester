/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow remote cover images (Nina posts can reference externally-hosted images).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;

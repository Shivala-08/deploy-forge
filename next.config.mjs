/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three"],
  experimental: {
    outputFileTracingIncludes: {
      '/sites/[siteId]/[[...slug]]': ['./public/sites/**/*'],
    },
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const repo = "keti-wattwise-demo"; // GitHub Pages 하위경로
const nextConfig = {
  output: "export",
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
  env: { NEXT_PUBLIC_BASE_PATH: `/${repo}` },
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;

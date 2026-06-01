import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.uniqlo.cn",
        pathname: "/hmall/**",
      },
    ],
  },
};

export default nextConfig;

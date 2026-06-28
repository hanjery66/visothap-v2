import type { NextConfig } from "next";

import "./src/env";

const nextConfig: NextConfig = {
    output: "standalone",
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "72.60.209.98",
                port: "9000",
                pathname: "/visothap-storage/uploads/**",
            },
            {
                protocol: "http",
                hostname: "72.60.209.98",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
        ],
    },
};

export default nextConfig;

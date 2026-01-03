import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      new URL("https://rose-acceptable-bee-887.mypinata.cloud/**"),
    ],
  },
  serverExternalPackages: [
    "imapflow",
    "mailparser",
    "pino",
    "thread-stream",
    "pino-pretty",
  ],
};

export default nextConfig;

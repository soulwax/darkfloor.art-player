// File: next.config.js

import "./src/env.js";

// Handle unhandled rejections during build (e.g., _document page not found in App Router)
if (typeof process !== "undefined") {
  process.on("unhandledRejection", (reason, promise) => {
    // Suppress the _document page not found error in App Router (expected behavior)
    if (
      reason &&
      typeof reason === "object" &&
      "code" in reason &&
      reason.code === "ENOENT" &&
      "message" in reason &&
      typeof reason.message === "string" &&
      reason.message.includes("_document")
    ) {
      // This is expected in App Router - _document is not needed
      return;
    }
    // Log other unhandled rejections for debugging
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
}

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  output: process.env.ELECTRON_BUILD === "true" ? "standalone" : undefined,
  // Electron runs a bundled Next.js server with standalone output
  // This allows API routes to work in the Electron app
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-images.dzcdn.net",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "api.deezer.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
    ],
    unoptimized: process.env.ELECTRON_BUILD === "true", // Required for Electron
  },
};

export default config;

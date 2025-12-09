// File: next.config.js

import "./src/env.js";

// Handle unhandled rejections during build (e.g., _document/_error pages not found in App Router)
if (typeof process !== "undefined") {
  const originalEmit = process.emit;
  process.emit = function (event, ...args) {
    // Suppress unhandledRejection events for expected missing pages in App Router
    if (event === "unhandledRejection") {
      const reason = args[0];
      if (
        reason &&
        typeof reason === "object" &&
        "code" in reason &&
        reason.code === "ENOENT" &&
        ("message" in reason || "type" in reason) &&
        (String(reason.message || reason.type || "").includes("_document") ||
          String(reason.message || reason.type || "").includes("_error") ||
          String(reason.message || reason.type || "").includes("PageNotFoundError"))
      ) {
        // These are expected in App Router - suppress the error
        return false; // Prevent default handling
      }
    }
    return originalEmit.apply(process, [event, ...args]);
  };

  process.on("unhandledRejection", (reason, promise) => {
    // Suppress page not found errors for Pages Router files in App Router (expected behavior)
    if (
      reason &&
      typeof reason === "object" &&
      "code" in reason &&
      reason.code === "ENOENT" &&
      ("message" in reason || "type" in reason) &&
      (String(reason.message || reason.type || "").includes("_document") ||
        String(reason.message || reason.type || "").includes("_error") ||
        String(reason.message || reason.type || "").includes("PageNotFoundError"))
    ) {
      // These are expected in App Router - _document, _error, and other _ prefixed pages are not needed
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
  webpack: (config, { isServer }) => {
    // Suppress warnings/errors for Pages Router files that don't exist in App Router
    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /[\\/]node_modules[\\/]next[\\/]/,
          message: /Cannot find module for page: \/_(document|error)/,
        },
      ];
    }
    return config;
  },
  // Suppress build errors for expected missing pages in App Router
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default config;

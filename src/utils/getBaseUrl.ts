// File: src/utils/getBaseUrl.ts

import { env } from "@/env";

/**
 * Get the base URL for the application.
 * 
 * This function safely handles the base URL by:
 * - Using NEXT_PUBLIC_NEXTAUTH_URL if available (client-safe)
 * - Falling back to NEXTAUTH_URL on the server side only (server components)
 * - Using a hardcoded default as final fallback
 * 
 * This maintains security by never exposing server-only variables to the client,
 * while providing backward compatibility for server-side code.
 */
export function getBaseUrl(): string {
  // First, try the public client-safe variable
  if (env.NEXT_PUBLIC_NEXTAUTH_URL) {
    return env.NEXT_PUBLIC_NEXTAUTH_URL;
  }

  // On the server side, we can safely use NEXTAUTH_URL as a fallback
  // This is safe because this function is only called from server components
  // and the value is used for metadata generation, not exposed to the client
  if (typeof window === "undefined") {
    try {
      // Access validated server-only env var (will throw on client if accessed)
      // Using env.NEXTAUTH_URL ensures Zod validation is applied
      if (env.NEXTAUTH_URL) {
        return env.NEXTAUTH_URL;
      }
    } catch {
      // Ignore - we're on the client or variable is not accessible
      // This can happen if the env library throws when accessing server vars on client
    }
  }

  // Final fallback to default URL
  return "https://play.isobelnet.de";
}


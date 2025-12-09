#!/usr/bin/env node
// Script to load .env.local and run a command with those environment variables
// @ts-check

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv - order matters, later files override earlier ones
// Load .env first (base config)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Load environment-specific file based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || "development";
if (nodeEnv === "development") {
  dotenv.config({ path: path.resolve(__dirname, "../.env.development") });
} else if (nodeEnv === "production") {
  dotenv.config({ path: path.resolve(__dirname, "../.env.production") });
}

// Load .env.local last (overrides everything, never commit this file)
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Get the command from arguments
const command = process.argv.slice(2).join(" ");

if (!command) {
  console.error("❌ No command provided");
  console.log("Usage: node load-env-build.js <command>");
  process.exit(1);
}

console.log(`🔧 Loading environment for NODE_ENV=${nodeEnv}`);
console.log(`📦 Running: ${command}`);

try {
  execSync(command, {
    stdio: "inherit",
    env: process.env,
  });
  console.log("✅ Command completed successfully");
} catch (error) {
  console.error("❌ Command failed");
  let exitCode = 1;
  if (error && typeof error === "object" && "status" in error) {
    exitCode = typeof error.status === "number" ? error.status : 1;
  }
  process.exit(exitCode);
}

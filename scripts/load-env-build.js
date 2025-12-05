#!/usr/bin/env node
// Script to load .env.local and run a command with those environment variables
// @ts-check

import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {Object} ExecError
 * @property {number} [status]
 */

/**
 * @typedef {Object} NodeJS.ProcessEnv
 * @property {string} [key]
 */

/**
 * Function to parse and load .env file
 * @param {string} filePath - Path to the .env file
 * @returns {void}
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line) => {
    // Skip comments and empty lines
    line = line.trim();
    if (!line || line.startsWith("#")) {
      return;
    }

    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Only set if not already defined
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Load environment files
loadEnvFile(path.resolve(__dirname, "../.env.local"));
loadEnvFile(path.resolve(__dirname, "../.env"));

// Get the command from arguments
const command = process.argv.slice(2).join(" ");

if (!command) {
  console.error("❌ No command provided");
  console.log("Usage: node load-env-build.js <command>");
  process.exit(1);
}

console.log(`🔧 Loading environment from .env.local`);
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

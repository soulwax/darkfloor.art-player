#!/usr/bin/env node
// Script to load .env.local and run a command with those environment variables
// @ts-check

<<<<<<< HEAD
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
=======
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
>>>>>>> 80845a12678c9a81bcc15e04f2e9f22270764176

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

<<<<<<< HEAD
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
    if (match && match[1] && match[2]) {
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
=======
// Load dotenv - order matters, later files override earlier ones
// Load .env first (base config)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load environment-specific file based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
if (nodeEnv === 'development') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.development') });
} else if (nodeEnv === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.production') });
}

// Load .env.local last (overrides everything, never commit this file)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
>>>>>>> 80845a12678c9a81bcc15e04f2e9f22270764176

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

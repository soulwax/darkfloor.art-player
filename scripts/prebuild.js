#!/usr/bin/env node
// File: scripts/prebuild.js
// Smart prebuild script that conditionally runs database operations based on environment

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Detect Vercel environment
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;

async function runCommand(command) {
  console.log(`\n🔧 Running: ${command}`);
  try {
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    // Don't throw - allow build to continue with warnings
    return false;
  }
}

async function prebuild() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Running prebuild script");
  console.log("=".repeat(60));

  if (isVercel) {
    console.log("\n📦 Vercel environment detected");
    console.log("⏭️  Skipping database operations (migrations run separately)");
    console.log("✅ Only running SSL certificate generation\n");

    // On Vercel: Only generate SSL certificate
    // Database operations should be run separately via Vercel CLI or post-deploy hooks
    await runCommand("npm run generate:ssl");

    console.log("\n" + "=".repeat(60));
    console.log("✅ Vercel prebuild complete");
    console.log("=".repeat(60) + "\n");
  } else {
    console.log("\n🏠 Local/Traditional server environment detected");
    console.log("✅ Running full prebuild with database operations\n");

    // Local/Traditional server: Run all prebuild steps
    // 1. Generate SSL certificate
    await runCommand("npm run generate:ssl");

    // 2. Generate Drizzle migrations
    console.log("\n📊 Generating database migrations...");
    await runCommand("npm run db:generate");

    // 3. Run migrations
    console.log("\n📊 Running database migrations...");
    await runCommand("npm run db:migrate");

    // 4. Push schema changes
    console.log("\n📊 Pushing database schema...");
    await runCommand("npm run db:push");

    console.log("\n" + "=".repeat(60));
    console.log("✅ Local prebuild complete");
    console.log("=".repeat(60) + "\n");
  }
}

// Run prebuild
prebuild().catch((error) => {
  console.error("\n❌ Prebuild failed:");
  console.error(error);
  // Don't exit with error code - allow build to continue
  // Database issues shouldn't block the build, especially on Vercel
});

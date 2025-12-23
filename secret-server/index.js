#!/usr/bin/env node
/**
 * Secret Keeper Server
 * 
 * Standalone server that provides secure environment variables to Electron apps
 * via a handshake and token-based authentication system.
 * 
 * Security Features:
 * - App ID + Secret handshake authentication
 * - JWT tokens with expiration
 * - Rate limiting
 * - HTTPS support
 * - Environment-specific secrets
 */

// @ts-ignore
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
// @ts-ignore
import express from "express";
// @ts-ignore
import rateLimit from "express-rate-limit";
// @ts-ignore
import jwt from "jsonwebtoken";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load server configuration
dotenv.config({ path: join(__dirname, ".env.server") });

const PORT = process.env.SECRET_SERVER_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const TOKEN_EXPIRY = parseInt(process.env.TOKEN_EXPIRY || "3600", 10); // 1 hour default

// App credentials (should be stored securely, not in code)
// In production, use environment variables or a secure vault
const APP_CREDENTIALS = {
  "darkfloor-art": {
    secret: process.env.APP_SECRET || "change-me-in-production",
    allowedEnvironments: ["development", "production"],
  },
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// Request logging
// @ts-ignore
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Handshake endpoint - authenticates app and returns JWT token
 * POST /handshake
 * Body: { appId: string, appSecret: string, environment: string }
 */
// @ts-ignore
app.post("/handshake", (req, res) => {
  try {
    const { appId, appSecret, environment = "production" } = req.body;

    if (!appId || !appSecret) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "appId and appSecret are required",
      });
    }

    // Verify app credentials
    // @ts-ignore
    const app = APP_CREDENTIALS[appId];
    if (!app) {
      console.warn(`[SECURITY] Invalid appId: ${appId}`);
      return res.status(401).json({
        error: "Invalid credentials",
        message: "App authentication failed",
      });
    }

    if (app.secret !== appSecret) {
      console.warn(`[SECURITY] Invalid appSecret for appId: ${appId}`);
      return res.status(401).json({
        error: "Invalid credentials",
        message: "App authentication failed",
      });
    }

    // Check environment access
    if (!app.allowedEnvironments.includes(environment)) {
      return res.status(403).json({
        error: "Environment not allowed",
        message: `Environment '${environment}' is not allowed for this app`,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        appId,
        environment,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    console.log(`[SUCCESS] Handshake successful for appId: ${appId}, environment: ${environment}`);

    res.json({
      success: true,
      token,
      expiresIn: TOKEN_EXPIRY,
    });
  } catch (error) {
    console.error("[ERROR] Handshake error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to process handshake",
    });
  }
});

/**
 * Secrets endpoint - returns environment variables for authenticated app
 * GET /secrets
 * Headers: { Authorization: "Bearer <token>" }
 */
// @ts-ignore
app.get("/secrets", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // @ts-ignore
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Token expired",
          message: "Please perform a new handshake",
        });
      }
      return res.status(401).json({
        error: "Invalid token",
        message: "Token verification failed",
      });
    }

    const { appId, environment } = decoded;

    // Load secrets for the requested environment
    // In production, load from secure vault or environment variables
    const secrets = loadSecretsForEnvironment(environment);

    console.log(`[SUCCESS] Secrets retrieved for appId: ${appId}, environment: ${environment}`);

    res.json({
      success: true,
      environment,
      secrets,
    });
  } catch (error) {
    console.error("[ERROR] Secrets retrieval error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to retrieve secrets",
    });
  }
});

/**
 * Health check endpoint
 */
// @ts-ignore
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Load secrets for a specific environment
 * In production, this should load from a secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)
 */
// @ts-ignore
function loadSecretsForEnvironment(environment) {
  // For now, load from environment variables
  // In production, use a secure vault service
  const secrets = {
    AUTH_SECRET: process.env[`${environment.toUpperCase()}_AUTH_SECRET`] || process.env.AUTH_SECRET,
    AUTH_DISCORD_ID: process.env[`${environment.toUpperCase()}_AUTH_DISCORD_ID`] || process.env.AUTH_DISCORD_ID,
    AUTH_DISCORD_SECRET: process.env[`${environment.toUpperCase()}_AUTH_DISCORD_SECRET`] || process.env.AUTH_DISCORD_SECRET,
    NEXTAUTH_URL: process.env[`${environment.toUpperCase()}_NEXTAUTH_URL`] || process.env.NEXTAUTH_URL,
    DB_ADMIN_USER: process.env[`${environment.toUpperCase()}_DB_ADMIN_USER`] || process.env.DB_ADMIN_USER,
    DB_ADMIN_PASSWORD: process.env[`${environment.toUpperCase()}_DB_ADMIN_PASSWORD`] || process.env.DB_ADMIN_PASSWORD,
    DB_HOST: process.env[`${environment.toUpperCase()}_DB_HOST`] || process.env.DB_HOST,
    DB_PORT: process.env[`${environment.toUpperCase()}_DB_PORT`] || process.env.DB_PORT,
    DB_NAME: process.env[`${environment.toUpperCase()}_DB_NAME`] || process.env.DB_NAME,
    DATABASE_URL: process.env[`${environment.toUpperCase()}_DATABASE_URL`] || process.env.DATABASE_URL,
    STREAMING_KEY: process.env[`${environment.toUpperCase()}_STREAMING_KEY`] || process.env.STREAMING_KEY,
    SONGBIRD_API_KEY: process.env[`${environment.toUpperCase()}_SONGBIRD_API_KEY`] || process.env.SONGBIRD_API_KEY,
  };

  // Remove undefined values
  Object.keys(secrets).forEach((key) => {
    // @ts-ignore
    if (secrets[key] === undefined) {
      // @ts-ignore
      delete secrets[key];
    }
  });

  return secrets;
}

// Start server
app.listen(PORT, () => {
  console.log(`🔐 Secret Keeper Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`⏱️  Token expiry: ${TOKEN_EXPIRY}s`);
});


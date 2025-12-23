// File: electron/secret-loader.cjs
// Handles secure secret fetching from secret keeper server

const https = require("https");
const http = require("http");
const { URL } = require("url");
const path = require("path");
const fs = require("fs");

/**
 * Configuration for secret server
 * These should be set at build time or via environment variables
 * Can also be loaded from electron/config.cjs if it exists
 */
let config = {
  SECRET_SERVER_URL: process.env.SECRET_SERVER_URL || "http://localhost:3001",
  APP_ID: process.env.APP_ID || "darkfloor-art",
  APP_SECRET: process.env.APP_SECRET || "",
  APP_ENVIRONMENT: process.env.NODE_ENV === "production" ? "production" : "development",
};

// Try to load from config file if it exists
try {
  const configPath = path.join(__dirname, "config.cjs");
  if (fs.existsSync(configPath)) {
    const fileConfig = require(configPath);
    if (fileConfig.secretServer) {
      config.SECRET_SERVER_URL = fileConfig.secretServer.url || config.SECRET_SERVER_URL;
      config.APP_ID = fileConfig.secretServer.appId || config.APP_ID;
      config.APP_SECRET = fileConfig.secretServer.appSecret || config.APP_SECRET;
    }
  }
} catch (err) {
  // Config file doesn't exist or has errors, use defaults
}

const SECRET_SERVER_URL = config.SECRET_SERVER_URL;
const APP_ID = config.APP_ID;
const APP_SECRET = config.APP_SECRET;
const APP_ENVIRONMENT = config.APP_ENVIRONMENT;

/**
 * Perform handshake with secret server and get JWT token
 * @returns {Promise<string>} JWT token
 */
async function performHandshake() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SECRET_SERVER_URL}/handshake`);
    const client = url.protocol === "https:" ? https : http;

    const postData = JSON.stringify({
      appId: APP_ID,
      appSecret: APP_SECRET,
      environment: APP_ENVIRONMENT,
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 10000, // 10 second timeout
    };

    const req = client.request(url, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode !== 200) {
          try {
            const error = JSON.parse(data);
            reject(
              new Error(
                `Handshake failed: ${error.message || "Unknown error"}`,
              ),
            );
          } catch {
            reject(
              new Error(
                `Handshake failed with status ${res.statusCode}: ${data}`,
              ),
            );
          }
          return;
        }

        try {
          const response = JSON.parse(data);
          if (response.success && response.token) {
            resolve(response.token);
          } else {
            reject(new Error("Handshake response missing token"));
          }
        } catch (error) {
          reject(new Error(`Failed to parse handshake response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Handshake request failed: ${error.message}`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Handshake request timed out"));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Fetch secrets from secret server using JWT token
 * @param {string} token - JWT token from handshake
 * @returns {Promise<Record<string, string>>} Secrets object
 */
async function fetchSecrets(token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SECRET_SERVER_URL}/secrets`);
    const client = url.protocol === "https:" ? https : http;

    const options = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000, // 10 second timeout
    };

    const req = client.request(url, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode !== 200) {
          try {
            const error = JSON.parse(data);
            reject(
              new Error(
                `Failed to fetch secrets: ${error.message || "Unknown error"}`,
              ),
            );
          } catch {
            reject(
              new Error(
                `Failed to fetch secrets with status ${res.statusCode}: ${data}`,
              ),
            );
          }
          return;
        }

        try {
          const response = JSON.parse(data);
          if (response.success && response.secrets) {
            resolve(response.secrets);
          } else {
            reject(new Error("Secrets response missing secrets"));
          }
        } catch (error) {
          reject(
            new Error(`Failed to parse secrets response: ${error.message}`),
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Secrets request failed: ${error.message}`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Secrets request timed out"));
    });

    req.end();
  });
}

/**
 * Load secrets from secret server
 * Performs handshake, gets token, then fetches secrets
 * @returns {Promise<Record<string, string>>} Secrets object
 */
async function loadSecrets() {
  try {
    console.log("[SecretLoader] Starting handshake with secret server...");
    console.log(`[SecretLoader] Server URL: ${SECRET_SERVER_URL}`);
    console.log(`[SecretLoader] App ID: ${APP_ID}`);
    console.log(`[SecretLoader] Environment: ${APP_ENVIRONMENT}`);

    // Perform handshake
    const token = await performHandshake();
    console.log("[SecretLoader] Handshake successful, token received");

    // Fetch secrets
    console.log("[SecretLoader] Fetching secrets...");
    const secrets = await fetchSecrets(token);
    console.log("[SecretLoader] Secrets fetched successfully");
    console.log(
      `[SecretLoader] Loaded ${Object.keys(secrets).length} secrets`,
    );

    return secrets;
  } catch (error) {
    console.error("[SecretLoader] Error loading secrets:", error);
    throw error;
  }
}

/**
 * Check if secret server is available
 * @returns {Promise<boolean>}
 */
async function checkServerHealth() {
  return new Promise((resolve) => {
    const url = new URL(`${SECRET_SERVER_URL}/health`);
    const client = url.protocol === "https:" ? https : http;

    const req = client.request(url, { timeout: 5000 }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on("error", () => {
      resolve(false);
    });

    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

module.exports = {
  loadSecrets,
  checkServerHealth,
  SECRET_SERVER_URL,
  APP_ID,
  APP_ENVIRONMENT,
};


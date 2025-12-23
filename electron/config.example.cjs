// File: electron/config.example.cjs
// Copy this file to config.cjs and fill in your values
// This file should NOT be committed to version control

module.exports = {
  // Secret Keeper Server Configuration
  secretServer: {
    // URL of your secret keeper server
    // For local development: "http://localhost:3001"
    // For production: "https://your-secret-server.com"
    url: process.env.SECRET_SERVER_URL || "http://localhost:3001",
    
    // App credentials for handshake
    appId: process.env.APP_ID || "darkfloor-art",
    appSecret: process.env.APP_SECRET || "", // REQUIRED: Set via environment variable
    
    // Enable/disable secret server
    // Set to "true" to use secret server, "false" to use .env files
    enabled: process.env.USE_SECRET_SERVER === "true" || !!process.env.APP_SECRET,
  },
};


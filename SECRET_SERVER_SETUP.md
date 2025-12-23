# Secret Server Setup Guide

This guide explains how to set up and use the secure secret keeper server for your Electron app.

## Overview

The secret keeper server provides a secure way to load environment variables at runtime, preventing secrets from being embedded in the Electron build. The system uses:

1. **Handshake**: App authenticates with App ID + Secret
2. **Token**: Server returns a JWT token
3. **Secrets**: App uses token to fetch environment variables
4. **Fallback**: If server unavailable, falls back to .env files

## Setup Steps

### 1. Set Up Secret Keeper Server

```bash
cd secret-server
npm install
```

### 2. Configure Server

Create `.env.server` file:

```bash
cp secret-server/.env.server.example secret-server/.env.server
```

Edit `.env.server` with your configuration:

```env
# Server Configuration
SECRET_SERVER_PORT=3001
JWT_SECRET=your-generated-jwt-secret
TOKEN_EXPIRY=3600
APP_SECRET=your-app-secret

# Environment-specific secrets
DEVELOPMENT_AUTH_SECRET=...
DEVELOPMENT_AUTH_DISCORD_ID=...
DEVELOPMENT_AUTH_DISCORD_SECRET=...
DEVELOPMENT_DATABASE_URL=...
# ... etc

PRODUCTION_AUTH_SECRET=...
PRODUCTION_AUTH_DISCORD_ID=...
# ... etc
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start Secret Server

```bash
cd secret-server
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### 4. Configure Electron App

Set environment variables before building/running:

```bash
# Windows PowerShell
$env:SECRET_SERVER_URL="http://localhost:3001"
$env:APP_ID="darkfloor-art"
$env:APP_SECRET="your-app-secret"
$env:USE_SECRET_SERVER="true"

# Linux/Mac
export SECRET_SERVER_URL="http://localhost:3001"
export APP_ID="darkfloor-art"
export APP_SECRET="your-app-secret"
export USE_SECRET_SERVER="true"
```

Or create `electron/config.cjs` (copy from `electron/config.example.cjs`):

```javascript
module.exports = {
  secretServer: {
    url: "http://localhost:3001",
    appId: "darkfloor-art",
    appSecret: "your-app-secret",
    enabled: true,
  },
};
```

**Important**: Never commit `config.cjs` or `.env.server` to version control!

### 5. Build Electron App

The app will automatically:
1. Check if secret server is enabled
2. Perform handshake on startup
3. Load secrets from server
4. Fall back to .env files if server unavailable

```bash
npm run electron:build:win
```

## How It Works

### Startup Flow

1. **App Starts** → Electron main process loads
2. **Check Configuration** → Is `USE_SECRET_SERVER=true` or `APP_SECRET` set?
3. **Health Check** → Check if secret server is available
4. **Handshake** → Authenticate with App ID + Secret
5. **Get Token** → Receive JWT token from server
6. **Fetch Secrets** → Use token to get environment variables
7. **Set process.env** → Load secrets into Node.js environment
8. **Start Next.js Server** → Server starts with loaded secrets
9. **Fallback** → If any step fails, use .env files

### Security Features

- ✅ **App Authentication**: App ID + Secret required
- ✅ **JWT Tokens**: Time-limited tokens (1 hour default)
- ✅ **Rate Limiting**: Prevents brute force attacks
- ✅ **Environment Isolation**: Separate secrets per environment
- ✅ **HTTPS Ready**: Supports HTTPS for production
- ✅ **Graceful Fallback**: Falls back to .env if server unavailable

## Production Deployment

### Secret Server

1. **Deploy to secure server** (separate from app)
2. **Use HTTPS** with SSL certificate
3. **Set strong JWT_SECRET** (32+ bytes random)
4. **Use secure vault** (AWS Secrets Manager, HashiCorp Vault) instead of .env files
5. **Enable firewall** - only allow app servers to connect
6. **Monitor logs** for suspicious activity

### Electron App

1. **Set environment variables** at build time or runtime:
   ```bash
   SECRET_SERVER_URL=https://secrets.yourdomain.com
   APP_SECRET=<strong-random-secret>
   USE_SECRET_SERVER=true
   ```

2. **Or use config file** (not in build):
   - Store `config.cjs` separately
   - Load at runtime
   - Never commit to version control

3. **Build with secrets**:
   ```bash
   npm run electron:build:win
   ```

## Troubleshooting

### Server Not Available

If the secret server is unavailable, the app will:
- Log a warning
- Fall back to .env files
- Continue normally

### Authentication Failed

Check:
- `APP_SECRET` matches server configuration
- `APP_ID` matches server configuration
- Server is running and accessible

### Token Expired

Tokens expire after 1 hour (configurable). The app will need to:
- Perform a new handshake
- Get a new token
- Fetch secrets again

### Secrets Not Loading

1. Check server logs
2. Verify environment variables are set
3. Check network connectivity
4. Verify JWT_SECRET matches (if using multiple servers)

## API Reference

### POST /handshake

Authenticate and get token.

**Request:**
```json
{
  "appId": "darkfloor-art",
  "appSecret": "your-secret",
  "environment": "production"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "expiresIn": 3600
}
```

### GET /secrets

Get environment variables.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "environment": "production",
  "secrets": {
    "AUTH_SECRET": "...",
    "DATABASE_URL": "...",
    ...
  }
}
```

## Security Best Practices

1. ✅ **Never commit secrets** to version control
2. ✅ **Use HTTPS** in production
3. ✅ **Rotate secrets** regularly
4. ✅ **Monitor access logs** for suspicious activity
5. ✅ **Use strong secrets** (32+ bytes random)
6. ✅ **Limit network access** to secret server
7. ✅ **Use secure vault** for production secrets
8. ✅ **Set token expiry** appropriately (1 hour recommended)


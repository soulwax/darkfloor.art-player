# Secret Keeper Server

Standalone server that securely provides environment variables to Electron apps via a handshake and token-based authentication system.

## Features

- 🔐 App ID + Secret handshake authentication
- 🎫 JWT tokens with expiration
- 🛡️ Rate limiting
- 🌍 Environment-specific secrets
- 🔒 Secure token-based access

## Setup

1. **Install dependencies:**
   ```bash
   cd secret-server
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.server.example .env.server
   # Edit .env.server with your secrets
   ```

3. **Generate JWT Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Start server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## API Endpoints

### POST /handshake

Authenticates the app and returns a JWT token.

**Request:**
```json
{
  "appId": "darkfloor-art",
  "appSecret": "your-app-secret",
  "environment": "production"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### GET /secrets

Retrieves environment variables using the JWT token.

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
    "AUTH_DISCORD_ID": "...",
    "DATABASE_URL": "...",
    ...
  }
}
```

### GET /health

Health check endpoint.

## Security Considerations

1. **Use HTTPS in production** - The server should run over HTTPS to protect tokens in transit
2. **Secure storage** - In production, integrate with a secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **App secrets** - Store app secrets securely, not in code
4. **Rate limiting** - Already implemented to prevent brute force attacks
5. **Token expiry** - Tokens expire after 1 hour by default (configurable)

## Production Deployment

For production, consider:
- Using a reverse proxy (nginx) with SSL/TLS
- Integrating with AWS Secrets Manager or HashiCorp Vault
- Using environment variables or secure vault for app credentials
- Monitoring and logging
- IP whitelisting if needed


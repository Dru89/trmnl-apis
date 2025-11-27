# TRMNL APIs

A Node.js serverless API service built with Express and deployed on Netlify. Includes API key authentication for secure access.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your API key:
   ```
   API_KEY=your-secret-api-key-here
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:8888/.netlify/functions/api`

## API Endpoints

### Health Check (No Auth Required)
```bash
GET /.netlify/functions/api/health
```

### Protected Endpoints (Require API Key)

All endpoints below require the `Authorization: Bearer <token>` header:

**Hello Endpoint:**
```bash
GET /.netlify/functions/api/hello
```

**Echo Endpoint:**
```bash
POST /.netlify/functions/api/echo
Content-Type: application/json

{
  "message": "test"
}
```

**Greeting Endpoint:**
```bash
GET /.netlify/functions/api/greet/:name?title=Mr
```

## Authentication

Protected endpoints require an API key passed in the `Authorization` header using the Bearer token format:

```bash
curl -H "Authorization: Bearer your-secret-api-key-here" \
  http://localhost:8888/.netlify/functions/api/hello
```

## Deployment

1. **Connect to Netlify:**
   ```bash
   netlify init
   ```

2. **Set environment variables in Netlify:**
   - Go to your site settings in Netlify
   - Navigate to "Environment variables"
   - Add `API_KEY` with your secret key

3. **Deploy:**
   ```bash
   npm run deploy
   ```

## Adding New Endpoints

Edit [netlify/functions/api.js](netlify/functions/api.js) to add new routes:

```javascript
// Add after the validateApiKey middleware
app.get('/api/your-endpoint', (req, res) => {
  res.json({ message: 'Your response' });
});
```

All routes after `app.use(validateApiKey)` will automatically require API key authentication.

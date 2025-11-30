# TRMNL APIs

A TypeScript serverless API service built with Express and deployed on Netlify. Includes API key authentication for secure access.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your configuration:
   ```
   API_KEY=your-secret-api-key-here
   OPENWEATHER_API_KEY=your-openweather-api-key-here
   LATITUDE=40.7128
   LONGITUDE=-74.0060
   TIMEZONE=America/Los_Angeles
   ```
   Get a free OpenWeatherMap API key at https://openweathermap.org/api

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

**Dashboard Endpoint:**
```bash
GET /.netlify/functions/api/dashboard
```

Returns current weather conditions, moon phase, temperature, and recycling schedule information:
```json
{
  "temperature": 72,
  "moonPhase": 0.5,
  "weather": "partly_cloudy",
  "isRecyclingWeek": true,
  "recyclingMessage": "This week is recycling pickup"
}
```

**Weather conditions:** `clear`, `partly_cloudy`, `cloudy`, `rain`, `snow`, `thunderstorm`, `drizzle`, `mist`, `unknown`

**Recycling messages:**
- `"This week is recycling pickup"` - Recycling pickup is this Tuesday
- `"Next week is recycling pickup"` - Recycling pickup is next Tuesday
- `"This week is trash only"` - No recycling this Tuesday
- `"Next week is trash only"` - No recycling next Tuesday

**Note:** Recycling calculations use the configured timezone (defaults to Pacific Time). After 12pm on Tuesday, the system looks ahead to next week's pickup.

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
   - Add `OPENWEATHER_API_KEY` with your OpenWeatherMap API key
   - Optionally add `LATITUDE` and `LONGITUDE` for your location
   - Optionally add `TIMEZONE` for recycling calculations (defaults to `America/Los_Angeles`)

3. **Deploy:**
   ```bash
   npm run deploy
   ```

## Development

**Build TypeScript:**
```bash
npm run build
```

**Type checking:**
```bash
npm run type-check
```

## Project Structure

```
trmnl-apis/
├── src/
│   ├── api.ts                    # Main Express app
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── services/
│   │   ├── weatherService.ts   # OpenWeatherMap integration
│   │   └── recyclingService.ts # Recycling schedule logic
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── dist/                         # Compiled JavaScript (generated)
└── netlify.toml                  # Netlify configuration
```

## Adding New Endpoints

Edit [src/api.ts](src/api.ts) to add new routes:

```typescript
// Add after the validateApiKey middleware
app.get('/api/your-endpoint', (req: Request, res: Response) => {
  res.json({ message: 'Your response' });
});
```

All routes after `app.use(validateApiKey)` will automatically require API key authentication. Run `npm run build` to compile TypeScript before testing.

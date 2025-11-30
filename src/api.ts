import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import serverless from 'serverless-http';
import { validateApiKey } from './middleware/auth';
import { getWeatherData } from './services/weatherService';
import { getRecyclingInfo } from './services/recyclingService';
import { DashboardData } from './types';

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint (no auth required)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Apply API key authentication to all routes below this line
app.use(validateApiKey);

// Dashboard endpoint - returns temperature, moon phase, weather, and recycling status
app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    // Default coordinates - you can make these configurable via env vars if needed
    const lat = parseFloat(process.env.LATITUDE || '40.7128');
    const lon = parseFloat(process.env.LONGITUDE || '-74.0060');
    const timezone = process.env.TIMEZONE || 'America/Los_Angeles';

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error(`Invalid coordinates: LATITUDE=${process.env.LATITUDE}, LONGITUDE=${process.env.LONGITUDE}`);
    }

    // Fetch weather data
    const weatherData = await getWeatherData(lat, lon);

    // Calculate recycling status with timezone
    const recyclingInfo = getRecyclingInfo(new Date(), timezone);

    const dashboardData: DashboardData = {
      temperature: weatherData.temperature,
      moonPhase: weatherData.moonPhase,
      weather: weatherData.weather,
      isRecyclingWeek: recyclingInfo.isRecyclingWeek,
      recyclingMessage: recyclingInfo.message
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Example protected endpoint
app.get('/api/hello', (req: Request, res: Response) => {
  res.json({
    message: 'Hello! You are authenticated.',
    timestamp: new Date().toISOString()
  });
});

// Example POST endpoint
app.post('/api/echo', (req: Request, res: Response) => {
  res.json({
    message: 'Echo endpoint',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Example endpoint with query parameters
app.get('/api/greet/:name', (req: Request, res: Response) => {
  const { name } = req.params;
  const { title } = req.query;

  const greeting = title
    ? `Hello, ${title} ${name}!`
    : `Hello, ${name}!`;

  res.json({
    greeting,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

export const handler = serverless(app);

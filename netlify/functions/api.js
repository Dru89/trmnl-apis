require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const { validateApiKey } = require('./middleware/auth');

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Apply API key authentication to all routes below this line
app.use(validateApiKey);

// Example protected endpoint
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello! You are authenticated.',
    timestamp: new Date().toISOString()
  });
});

// Example POST endpoint
app.post('/api/echo', (req, res) => {
  res.json({
    message: 'Echo endpoint',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Example endpoint with query parameters
app.get('/api/greet/:name', (req, res) => {
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
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

module.exports.handler = serverless(app);

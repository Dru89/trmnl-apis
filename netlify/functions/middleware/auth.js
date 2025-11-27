/**
 * API Key Authentication Middleware
 *
 * Validates that requests include a valid bearer token in the Authorization header.
 * Set your API key in the API_KEY environment variable.
 */

function validateApiKey(req, res, next) {
  const authHeader = req.headers['authorization'];
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    return res.status(500).json({
      error: 'Server configuration error: API_KEY not set'
    });
  }

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized: API key required',
      message: 'Please provide an API key in the Authorization header (Bearer <token>)'
    });
  }

  // Extract Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized: Invalid authorization format',
      message: 'Authorization header must be in the format: Bearer <token>'
    });
  }

  const apiKey = parts[1];

  if (apiKey !== validApiKey) {
    return res.status(403).json({
      error: 'Forbidden: Invalid API key'
    });
  }

  next();
}

module.exports = { validateApiKey };

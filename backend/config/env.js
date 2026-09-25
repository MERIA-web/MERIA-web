const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const PORT = Number(process.env.PORT) || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET || 'development-secret-change-me';

const GOOGLE_BOOKS_API_KEY =
  process.env.GOOGLE_BOOKS_API_KEY || '';

const CORS_ORIGIN =
  process.env.CORS_ORIGIN ||
  'http://127.0.0.1:5500,http://localhost:5500';

module.exports = {
  PORT,
  JWT_SECRET,
  GOOGLE_BOOKS_API_KEY,
  CORS_ORIGIN: CORS_ORIGIN
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
};
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';

  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Authentification requise.'
    });
  }

  try {
    req.admin = jwt.verify(token, JWT_SECRET);

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token invalide ou expiré.'
    });
  }
}

module.exports = {
  requireAuth
};
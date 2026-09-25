const express = require('express');
const cors = require('cors');

const {
  PORT,
  CORS_ORIGIN
} = require('./config/env');

const {
  initDatabase
} = require('./app/db');

const authRoutes =
  require('./app/routes/auth');

const booksRoutes =
  require('./app/routes/books');

const suggestionsRoutes =
  require('./app/routes/suggestions');

const app = express();

app.use(
  cors({
    origin:
      CORS_ORIGIN.length
        ? CORS_ORIGIN
        : true
  })
);

app.use(
  express.json({
    limit: '1mb'
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      status: 'ok',
      service: 'BookFinder API'
    });
  }
);

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/books',
  booksRoutes
);

app.use(
  '/api/suggestions',
  suggestionsRoutes
);

app.use(
  (req, res) => {
    res.status(404).json({
      error:
        'Route introuvable.'
    });
  }
);

app.use(
  (error, req, res, next) => {

    console.error(error);

    res.status(500).json({
      error:
        'Erreur interne du serveur.'
    });
  }
);

initDatabase()
  .then(() => {

    app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `BookFinder API démarrée sur le port ${PORT}`
    );
  }
);

  })
  .catch(error => {

    console.error(
      'Erreur d’initialisation de la base de données:',
      error
    );

    process.exit(1);
  });
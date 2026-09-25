const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
  JWT_SECRET
} = require('../../config/env');

const {
  get,
  run
} = require('../db');

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function createToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      email: admin.email
    },
    JWT_SECRET,
    {
      expiresIn: '2h'
    }
  );
}

async function register(req, res) {

  try {

    const username =
      String(req.body.username || '').trim();

    const email =
      String(req.body.email || '')
        .trim()
        .toLowerCase();

    const password =
      String(req.body.password || '');

    if (username.length < 3) {
      return res.status(400).json({
        error:
          'Le nom d’utilisateur doit contenir au moins 3 caractères.'
      });
    }

    if (!validEmail(email)) {
      return res.status(400).json({
        error:
          'Adresse email invalide.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error:
          'Le mot de passe doit contenir au moins 8 caractères.'
      });
    }

    const existing = await get(
      'SELECT id FROM admins WHERE email = ?',
      [email]
    );

    if (existing) {
      return res.status(409).json({
        error:
          'Un administrateur existe déjà avec cet email.'
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const result = await run(
      `INSERT INTO admins
       (username, email, password_hash)
       VALUES (?, ?, ?)`,
      [
        username,
        email,
        passwordHash
      ]
    );

    return res.status(201).json({
      message:
        'Administrateur créé avec succès.',

      admin: {
        id: result.id,
        username,
        email
      }
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        'Impossible de créer le compte.'
    });
  }
}

async function login(req, res) {

  try {

    const email =
      String(req.body.email || '')
        .trim()
        .toLowerCase();

    const password =
      String(req.body.password || '');

    const admin = await get(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    );

    if (!admin) {
      return res.status(401).json({
        error:
          'Email ou mot de passe incorrect.'
      });
    }

    const valid =
      await bcrypt.compare(
        password,
        admin.password_hash
      );

    if (!valid) {
      return res.status(401).json({
        error:
          'Email ou mot de passe incorrect.'
      });
    }

    const safeAdmin = {
      id: admin.id,
      username: admin.username,
      email: admin.email
    };

    return res.json({
      token: createToken(safeAdmin),
      admin: safeAdmin
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        'Impossible de se connecter.'
    });
  }
}

function me(req, res) {
  return res.json({
    admin: req.admin
  });
}

module.exports = {
  register,
  login,
  me
};
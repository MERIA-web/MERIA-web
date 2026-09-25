const {
  all,
  get,
  run
} = require('../db');

const fields = [
  'title',
  'author',
  'description',
  'cover_url',
  'category',
  'external_book_id',
  'link',
  'status'
];

function cleanPayload(body) {

  const payload = {};

  for (const field of fields) {

    if (body[field] !== undefined) {
      payload[field] =
        String(body[field]).trim();
    }
  }

  return payload;
}

function validate(payload) {

  if (
    !payload.title ||
    payload.title.length > 200
  ) {
    return 'Le titre est obligatoire et doit contenir au maximum 200 caractères.';
  }

  if (
    !payload.author ||
    payload.author.length > 200
  ) {
    return 'L’auteur est obligatoire et doit contenir au maximum 200 caractères.';
  }

  if (
    payload.description &&
    payload.description.length > 5000
  ) {
    return 'La description est trop longue.';
  }

  if (
    payload.status &&
    !['active', 'inactive'].includes(
      payload.status
    )
  ) {
    return 'Statut invalide.';
  }

  return null;
}

async function list(req, res) {

  try {

    const suggestions = await all(
      `SELECT * FROM suggestions
       WHERE status = 'active'
       ORDER BY created_at DESC`
    );

    return res.json({
      suggestions
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        'Impossible de récupérer les suggestions.'
    });
  }
}

async function getOne(req, res) {

  try {

    const suggestion = await get(
      'SELECT * FROM suggestions WHERE id = ?',
      [req.params.id]
    );

    if (!suggestion) {
      return res.status(404).json({
        error:
          'Suggestion introuvable.'
      });
    }

    return res.json({
      suggestion
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        'Impossible de récupérer la suggestion.'
    });
  }
}

async function byCategory(req, res) {

  try {

    const category =
      String(req.params.category || '').trim();

    const exclude =
      Number(req.query.exclude) || 0;

    const suggestions = await all(
      `SELECT * FROM suggestions
       WHERE status = 'active'
       AND category = ?
       AND id != ?
       ORDER BY created_at DESC
       LIMIT 6`,
      [
        category,
        exclude
      ]
    );

    return res.json({
      suggestions
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        'Impossible de récupérer les suggestions liées.'
    });
  }
}

async function getOneInternal(id) {

  return get(
    'SELECT * FROM suggestions WHERE id = ?',
    [id]
  );
}

async function create(req, res) {

  const payload =
    cleanPayload(req.body || {});

  const errorMessage =
    validate(payload);

  if (errorMessage) {
    return res.status(400).json({
      error: errorMessage
    });
  }

  try {

    const result = await run(
      `INSERT INTO suggestions
       (
         title,
         author,
         description,
         cover_url,
         category,
         external_book_id,
         link,
         status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.title,
        payload.author,
        payload.description || '',
        payload.cover_url || '',
        payload.category || '',
        payload.external_book_id || '',
        payload.link || '',
        payload.status || 'active'
      ]
    );

    const suggestion =
      await getOneInternal(result.id);

    return res.status(201).json({
      message:
        'Suggestion ajoutée.',
      suggestion
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        'Impossible d’ajouter la suggestion.'
    });
  }
}

async function update(req, res) {

  const payload =
    cleanPayload(req.body || {});

  const errorMessage =
    validate(payload);

  if (errorMessage) {
    return res.status(400).json({
      error: errorMessage
    });
  }

  try {

    const existing =
      await getOneInternal(
        req.params.id
      );

    if (!existing) {
      return res.status(404).json({
        error:
          'Suggestion introuvable.'
      });
    }

    await run(
      `UPDATE suggestions
       SET
         title = ?,
         author = ?,
         description = ?,
         cover_url = ?,
         category = ?,
         external_book_id = ?,
         link = ?,
         status = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        payload.title,
        payload.author,
        payload.description || '',
        payload.cover_url || '',
        payload.category || '',
        payload.external_book_id || '',
        payload.link || '',
        payload.status || 'active',
        req.params.id
      ]
    );

    return res.json({
      message:
        'Suggestion modifiée.',

      suggestion:
        await getOneInternal(
          req.params.id
        )
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        'Impossible de modifier la suggestion.'
    });
  }
}

async function remove(req, res) {

  try {

    const result = await run(
      'DELETE FROM suggestions WHERE id = ?',
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error:
          'Suggestion introuvable.'
      });
    }

    return res.json({
      message:
        'Suggestion supprimée.'
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        'Impossible de supprimer la suggestion.'
    });
  }
}

async function adminList(req, res) {

  try {

    const suggestions = await all(
      `SELECT *
       FROM suggestions
       ORDER BY created_at DESC`
    );

    return res.json({
      suggestions
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        'Impossible de récupérer les suggestions.'
    });
  }
}

async function stats(req, res) {

  try {

    const total = await get(
      'SELECT COUNT(*) AS count FROM suggestions'
    );

    const active = await get(
      `SELECT COUNT(*) AS count
       FROM suggestions
       WHERE status = 'active'`
    );

    const admins = await get(
      'SELECT COUNT(*) AS count FROM admins'
    );

    return res.json({
      totalSuggestions: total.count,
      activeSuggestions: active.count,
      totalAdmins: admins.count
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        'Impossible de récupérer les statistiques.'
    });
  }
}

module.exports = {
  list,
  getOne,
  byCategory,
  create,
  update,
  remove,
  adminList,
  stats
};
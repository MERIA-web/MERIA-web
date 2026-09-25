const {
  GOOGLE_BOOKS_API_KEY
} = require('../../config/env');

const BASE_URL =
  'https://www.googleapis.com/books/v1/volumes';

function buildUrl(params) {
  const url = new URL(BASE_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      url.searchParams.set(key, value);
    }
  });

  if (GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set(
      'key',
      GOOGLE_BOOKS_API_KEY
    );
  }

  return url.toString();
}

function normalizeBook(item) {
  const info = item.volumeInfo || {};

  const identifiers =
    info.industryIdentifiers || [];

  return {
    id: item.id,

    title:
      info.title ||
      'Titre inconnu',

    subtitle:
      info.subtitle ||
      '',

    authors:
      Array.isArray(info.authors)
        ? info.authors
        : [],

    publisher:
      info.publisher ||
      '',

    publishedDate:
      info.publishedDate ||
      '',

    description:
      info.description ||
      '',

    pageCount:
      info.pageCount ||
      null,

    categories:
      Array.isArray(info.categories)
        ? info.categories
        : [],

    language:
      info.language ||
      '',

    isbn: identifiers.map(
      identifier => identifier.identifier
    ),

    coverUrl:
      info.imageLinks?.thumbnail ||
      info.imageLinks?.smallThumbnail ||
      '',

    infoLink:
      info.infoLink ||
      '',

    previewLink:
      info.previewLink ||
      ''
  };
}

async function fetchJson(url) {
  const controller =
    new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    8000
  );

  try {
    const response = await fetch(
      url,
      {
        signal: controller.signal
      }
    );

    if (!response.ok) {
      throw new Error(
        `Le service Google Books a répondu avec le statut ${response.status}.`
      );
    }

    return await response.json();

  } catch (error) {

    if (error.name === 'AbortError') {
      throw new Error(
        'Le service de livres a mis trop de temps à répondre.'
      );
    }

    throw error;

  } finally {
    clearTimeout(timeout);
  }
}

async function searchBooksByAuthor(author) {
  const url = buildUrl({
    q: `inauthor:${author}`,
    maxResults: 20,
    startIndex: 0
  });

  const data = await fetchJson(url);

  return Array.isArray(data.items)
    ? data.items.map(normalizeBook)
    : [];
}

async function getBookById(id) {
  const url = buildUrl({});

  const data = await fetchJson(
    `${url}/${encodeURIComponent(id)}`
  );

  return normalizeBook(data);
}

async function suggestAuthors(query) {
  const url = buildUrl({
    q: `inauthor:${query}`,
    maxResults: 10,
    startIndex: 0
  });

  const data = await fetchJson(url);

  const names = new Set();

  for (const item of data.items || []) {

    for (
      const author of
      item.volumeInfo?.authors || []
    ) {
      names.add(author);
    }
  }

  return [...names].slice(0, 8);
}

module.exports = {
  searchBooksByAuthor,
  getBookById,
  suggestAuthors
};
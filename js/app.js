// URL de base de notre API backend (à adapter si déployée ailleurs)
const API_URL = 'http://localhost:5000/api';

let selectedBook = null;

async function searchBooks() {
  const author = document.getElementById('authorInput').value.trim();
  const resultsDiv = document.getElementById('results');
  const suggestionsDiv = document.getElementById('adminSuggestions');

  if (!author) {
    alert("Veuillez entrer un nom d'auteur.");
    return;
  }

  resultsDiv.innerHTML = '<p class="loading">Recherche en cours...</p>';
  suggestionsDiv.innerHTML = '';

  // 1) Recherche des livres via l'API (qui consomme elle-même Open Library)
  try {
    const res = await fetch(`${API_URL}/books/search?author=${encodeURIComponent(author)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur inconnue');
    displayResults(data.results, author);
  } catch (err) {
    resultsDiv.innerHTML = `<p class="error">Impossible de contacter l'API (${err.message}). Vérifiez que le serveur backend est démarré.</p>`;
  }

  // 2) Récupération des suggestions ajoutées manuellement par l'admin pour cet auteur
  try {
    const res2 = await fetch(`${API_URL}/suggestions/author/${encodeURIComponent(author)}`);
    const sugg = await res2.json();
    displaySuggestions(sugg);
  } catch (err) {
    // silencieux : les suggestions admin sont un bonus, pas bloquant
  }
}

function displayResults(books, author) {
  const resultsDiv = document.getElementById('results');

  if (!books || books.length === 0) {
    resultsDiv.innerHTML = `<p class="empty">Aucun livre trouvé pour "${escapeHtml(author)}".</p>`;
    return;
  }

  resultsDiv.innerHTML = books.map((b, i) => `
    <div class="book-card" data-index="${i}">
      <img src="${b.cover || 'https://via.placeholder.com/160x220?text=Pas+de+couverture'}" alt="${escapeHtml(b.title)}">
      <div class="book-info">
        <h3>${escapeHtml(b.title)}</h3>
        <p>${escapeHtml(b.author)}</p>
        <span>${b.year || 'Année inconnue'}</span>
      </div>
    </div>
  `).join('');

  // On attache les écouteurs après insertion (évite les soucis d'échappement dans onclick)
  resultsDiv.querySelectorAll('.book-card').forEach((card, i) => {
    card.addEventListener('click', () => selectBook(books[i]));
  });
}

function displaySuggestions(suggestions) {
  const div = document.getElementById('adminSuggestions');
  if (!suggestions || suggestions.length === 0) {
    div.innerHTML = '';
    return;
  }
  div.innerHTML = `<h3>💡 Suggestions de l'administrateur</h3>` + suggestions.map(s => `
    <div class="suggestion-card">
      <strong>${escapeHtml(s.title)}</strong> — ${escapeHtml(s.author)}
      <p>${escapeHtml(s.description || '')}</p>
    </div>
  `).join('');
}

function selectBook(book) {
  selectedBook = book;
  document.getElementById('selection').innerHTML = `
    <h3>✅ Votre sélection</h3>
    <p><strong>${escapeHtml(book.title)}</strong> de ${escapeHtml(book.author)} (${book.year || 'année inconnue'})</p>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

document.getElementById('searchBtn').addEventListener('click', searchBooks);
document.getElementById('authorInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchBooks();
});

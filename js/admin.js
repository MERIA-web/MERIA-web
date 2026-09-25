const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('adminToken');

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// Affiche le tableau de bord si un token existe déjà, sinon la connexion
if (token) {
  showSection('dashboard');
  loadSuggestions();
} else {
  showSection('login');
}

// --- Navigation entre formulaires ---
document.getElementById('showRegister').addEventListener('click', (e) => {
  e.preventDefault();
  showSection('register');
});
document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showSection('login');
});

// --- Inscription admin via l'API ---
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  document.getElementById('registerMsg').textContent = data.message;

  if (res.ok) {
    document.getElementById('registerForm').reset();
    setTimeout(() => showSection('login'), 800);
  }
});

// --- Connexion admin ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (res.ok) {
    token = data.token;
    localStorage.setItem('adminToken', token);
    showSection('dashboard');
    loadSuggestions();
  } else {
    document.getElementById('loginMsg').textContent = data.message;
  }
});

// --- Déconnexion ---
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  token = null;
  showSection('login');
});

// --- Ajout / modification d'une suggestion ---
document.getElementById('suggestionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('suggestionId').value;
  const author = document.getElementById('suggAuthor').value;
  const title = document.getElementById('suggTitle').value;
  const description = document.getElementById('suggDescription').value;
  const coverUrl = document.getElementById('suggCover').value;

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/suggestions/${id}` : `${API_URL}/suggestions`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ author, title, description, coverUrl })
  });
  const data = await res.json();

  if (res.ok) {
    document.getElementById('suggestionForm').reset();
    document.getElementById('suggestionId').value = '';
    loadSuggestions();
  } else {
    alert(data.message);
  }
});

// --- Chargement de la liste des suggestions ---
async function loadSuggestions() {
  const res = await fetch(`${API_URL}/suggestions`);
  const data = await res.json();
  const list = document.getElementById('suggestionsList');

  if (data.length === 0) {
    list.innerHTML = '<p>Aucune suggestion pour le moment.</p>';
    return;
  }

  list.innerHTML = '';
  data.forEach(s => {
    const row = document.createElement('div');
    row.className = 'admin-suggestion-row';
    row.innerHTML = `
      <div><strong>${escapeHtml(s.title)}</strong> — ${escapeHtml(s.author)}<br><small>${escapeHtml(s.description || '')}</small></div>
      <div>
        <button data-action="edit">Modifier</button>
        <button data-action="delete">Supprimer</button>
      </div>
    `;
    row.querySelector('[data-action="edit"]').addEventListener('click', () => editSuggestion(s));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteSuggestion(s.id));
    list.appendChild(row);
  });
}

function editSuggestion(s) {
  document.getElementById('suggestionId').value = s.id;
  document.getElementById('suggAuthor').value = s.author;
  document.getElementById('suggTitle').value = s.title;
  document.getElementById('suggDescription').value = s.description || '';
  document.getElementById('suggCover').value = s.coverUrl || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteSuggestion(id) {
  if (!confirm('Supprimer cette suggestion ?')) return;
  const res = await fetch(`${API_URL}/suggestions/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.ok) {
    loadSuggestions();
  } else {
    const data = await res.json();
    alert(data.message);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// Configuration
const SUPABASE_URL = 'https://tsvgxlmrgqlfkyijnllj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzdmd4bG1yZ3FsZmt5aWpubGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTYzNzUwMjcsImV4cCI6MjAxMjE4MjYyN30.9pPvuRKAj8x9K7EjVc-KX7fPCdV5nVxnHwpQ4K2JzOQ';
const API_BASE = `${SUPABASE_URL}/rest/v1`;

// State
let allCategories = [];
let currentResults = [];
let currentPage = 0;
const RESULTS_PER_PAGE = 20;
let selectedCategoryId = 'all';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const categoriesList = document.getElementById('categoriesList');
const resultsList = document.getElementById('resultsList');
const resultsInfo = document.getElementById('resultsInfo');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Event Listeners
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});
loadMoreBtn.addEventListener('click', loadMore);

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  displayDefaultResults();
});

// Fetch categories
async function loadCategories() {
  try {
    showSpinner(true);
    const response = await fetch(
      `${API_BASE}/categories?select=id,name,icon,prompt_count&order=name.asc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);

    allCategories = await response.json();
    renderCategories();
  } catch (error) {
    console.error('Error loading categories:', error);
    resultsInfo.textContent = 'Error loading categories. Please refresh.';
  } finally {
    showSpinner(false);
  }
}

// Render category sidebar
function renderCategories() {
  const html = allCategories.map(cat => `
    <li>
      <a
        href="#"
        data-category-id="${cat.id}"
        class="category-link"
        onclick="selectCategory(event, '${cat.id}')"
      >
        ${cat.icon} ${cat.name}
        <span style="color: var(--dim); font-size: 12px;">(${cat.prompt_count})</span>
      </a>
    </li>
  `).join('');

  categoriesList.innerHTML = `
    <li><a href="#" data-category-id="all" class="category-link active" onclick="selectCategory(event, 'all')">All Categories</a></li>
    ${html}
  `;
}

// Select category
function selectCategory(event, categoryId) {
  event.preventDefault();
  selectedCategoryId = categoryId;

  // Update active class
  document.querySelectorAll('.category-link').forEach(link => {
    link.classList.remove('active');
  });
  event.target.closest('a').classList.add('active');

  // Reset search and perform new search
  currentPage = 0;
  performSearch();
}

// Perform search
async function performSearch() {
  const query = searchInput.value.trim();
  currentPage = 0;

  try {
    showSpinner(true);
    loadMoreBtn.style.display = 'none';

    // Build URL with filters
    let url = `${API_BASE}/prompts?select=id,title,description,content,source,source_url,author,created_at,category_id&limit=1000`;

    if (selectedCategoryId !== 'all') {
      url += `&category_id=eq.${selectedCategoryId}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);

    let prompts = await response.json();

    // Client-side full-text search
    if (query) {
      const queryLower = query.toLowerCase();
      prompts = prompts.filter(p =>
        p.title.toLowerCase().includes(queryLower) ||
        p.description?.toLowerCase().includes(queryLower) ||
        p.content.toLowerCase().includes(queryLower)
      );
    }

    currentResults = prompts;
    displayResults();
  } catch (error) {
    console.error('Search error:', error);
    resultsInfo.textContent = 'Error searching. Please try again.';
  } finally {
    showSpinner(false);
  }
}

// Display results
function displayResults() {
  const start = currentPage * RESULTS_PER_PAGE;
  const end = start + RESULTS_PER_PAGE;
  const pageResults = currentResults.slice(start, end);

  if (currentResults.length === 0) {
    resultsList.innerHTML = '<p style="color: var(--dim); text-align: center;">No prompts found.</p>';
    resultsInfo.textContent = '';
    return;
  }

  resultsInfo.textContent = `Showing ${start + 1}–${Math.min(end, currentResults.length)} of ${currentResults.length} prompts`;

  const html = pageResults.map(prompt => `
    <div class="prompt-card">
      <h3 class="prompt-title">${escapeHtml(prompt.title)}</h3>
      <p class="prompt-description">${escapeHtml(prompt.description || '')}</p>
      <div class="prompt-meta">
        <span class="prompt-source">${prompt.source.toUpperCase()}</span>
        <span>${prompt.author || 'Unknown'}</span>
        <span>${new Date(prompt.created_at).toLocaleDateString()}</span>
      </div>
      <div class="prompt-content">${escapeHtml(prompt.content.substring(0, 300))}${prompt.content.length > 300 ? '...' : ''}</div>
      <div class="prompt-actions">
        <button class="copy-btn" onclick="copyPrompt(event, '${escapeHtml(prompt.content)}')">
          📋 Copy Prompt
        </button>
        <a href="${escapeHtml(prompt.source_url)}" target="_blank" style="padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; color: var(--dim); text-decoration: none; font-size: 12px;">
          Source ↗
        </a>
      </div>
    </div>
  `).join('');

  resultsList.innerHTML = html;

  // Show load more button if needed
  if (end < currentResults.length) {
    loadMoreBtn.style.display = 'block';
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

// Load more results
function loadMore() {
  currentPage++;
  displayResults();
  window.scrollTo({ top: resultsList.offsetTop, behavior: 'smooth' });
}

// Copy to clipboard
async function copyPrompt(event, text) {
  event.preventDefault();
  try {
    await navigator.clipboard.writeText(text);
    const btn = event.target;
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copy Prompt';
      btn.classList.remove('copied');
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    alert('Failed to copy prompt');
  }
}

// Display default results on load
async function displayDefaultResults() {
  try {
    showSpinner(true);
    const response = await fetch(
      `${API_BASE}/prompts?select=id,title,description,content,source,source_url,author,created_at&limit=${RESULTS_PER_PAGE}&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (response.ok) {
      currentResults = await response.json();
      displayResults();
    }
  } catch (error) {
    console.error('Error loading default results:', error);
  } finally {
    showSpinner(false);
  }
}

// Utilities
function showSpinner(show) {
  loadingSpinner.style.display = show ? 'inline-block' : 'none';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

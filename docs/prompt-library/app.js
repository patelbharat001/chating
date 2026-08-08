// Load configuration
let SUPABASE_URL = '';
let SUPABASE_KEY = '';
let API_BASE = '';

const loadConfig = async () => {
  try {
    const res = await fetch('../config.json');
    const config = await res.json();
    SUPABASE_URL = config.supabase.url;
    SUPABASE_KEY = config.supabase.anonKey;
    API_BASE = `${SUPABASE_URL}/rest/v1`;
  } catch (err) {
    console.error('Failed to load config:', err);
  }
};

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

// State for debouncing (Fix #7)
let searchTimeout;

// Event Listeners
searchBtn.addEventListener('click', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => performSearch(), 300);
});
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    clearTimeout(searchTimeout);
    performSearch();
  }
});
loadMoreBtn.addEventListener('click', loadMore);

// Event delegation for dynamic content (Fix #6)
categoriesList.addEventListener('click', (e) => {
  if (e.target.classList.contains('category-link')) {
    e.preventDefault();
    selectCategory(e);
  }
});

resultsList.addEventListener('click', (e) => {
  if (e.target.classList.contains('copy-btn')) {
    copyPrompt(e);
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
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
      >
        ${cat.icon} ${cat.name}
        <span style="color: var(--dim); font-size: 12px;">(${cat.prompt_count})</span>
      </a>
    </li>
  `).join('');

  categoriesList.innerHTML = `
    <li><a href="#" data-category-id="all" class="category-link active">All Categories</a></li>
    ${html}
  `;
}

// Select category (Fix #2: use data attribute instead of parameter)
function selectCategory(event) {
  event.preventDefault();
  const categoryLink = event.target.closest('a');
  selectedCategoryId = categoryLink.dataset.categoryId;

  // Update active class
  document.querySelectorAll('.category-link').forEach(link => {
    link.classList.remove('active');
  });
  categoryLink.classList.add('active');

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

// Validate prompt has required fields (Fix #5)
function validatePrompt(prompt) {
  return !!(
    prompt.id && prompt.title && prompt.content &&
    prompt.source && prompt.source_url && prompt.author && prompt.created_at
  );
}

// Validate and get safe URL (Fix #3)
function getSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? url : '#';
  } catch {
    return '#';
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

  const html = pageResults.map(prompt => {
    // Validate prompt before rendering (Fix #5)
    if (!validatePrompt(prompt)) {
      console.warn('Skipping invalid prompt:', prompt);
      return '';
    }

    const safeUrl = getSafeUrl(prompt.source_url);
    const contentPreview = escapeHtml(prompt.content.substring(0, 300));
    const fullContent = prompt.content;

    return `
      <div class="prompt-card">
        <h3 class="prompt-title">${escapeHtml(prompt.title)}</h3>
        <p class="prompt-description">${escapeHtml(prompt.description || '')}</p>
        <div class="prompt-meta">
          <span class="prompt-source">${escapeHtml(prompt.source).toUpperCase()}</span>
          <span>${escapeHtml(prompt.author || 'Unknown')}</span>
          <span>${new Date(prompt.created_at).toLocaleDateString()}</span>
        </div>
        <div class="prompt-content">${contentPreview}${prompt.content.length > 300 ? '...' : ''}</div>
        <div class="prompt-actions">
          <button class="copy-btn" data-content="${escapeHtml(fullContent)}">
            📋 Copy Prompt
          </button>
          <a href="${safeUrl}" target="_blank" style="padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; color: var(--dim); text-decoration: none; font-size: 12px;">
            Source ↗
          </a>
        </div>
      </div>
    `;
  }).filter(Boolean).join('');

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

// Copy to clipboard (Fix #1: use data attribute instead of escaped parameter)
async function copyPrompt(event) {
  event.preventDefault();
  const btn = event.target;
  const text = btn.dataset.content;

  try {
    await navigator.clipboard.writeText(text);
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
    } else {
      // Fix #4: Add error message instead of silent failure
      resultsInfo.textContent = 'Failed to load prompts. Please refresh the page.';
      console.error('Failed to load default results:', response.status);
    }
  } catch (error) {
    // Fix #4: Add error message for network/parsing errors
    resultsInfo.textContent = 'Error loading prompts. Please refresh the page.';
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

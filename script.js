/* =====================================================
   FICTOPEDIA — script.js
   Handles routing, article loading, search, and rendering
   ===================================================== */

'use strict';

/* ── Utilities ── */
const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ── Fetch helpers ── */
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

/* ─────────────────────────────────────────────
   HOMEPAGE  (index.html)
   ───────────────────────────────────────────── */

let allWars = [];
let activeCategory = 'all';
let searchQuery = '';

async function initHomepage() {
  const container = qs('#war-list');
  if (!container) return;

  // Show loading
  container.innerHTML = `<div class="state-message"><span class="state-icon">✦</span>Loading the chronicles…</div>`;

  try {
    allWars = await fetchJSON('articles/index.json');
  } catch (e) {
    container.innerHTML = `<div class="state-message"><span class="state-icon">✦</span>Unable to load articles.<br><small>${escapeHtml(e.message)}</small></div>`;
    return;
  }

  // Stats
  const categories = [...new Set(allWars.map(w => w.category))];
  qs('#stat-total').textContent = allWars.length;
  qs('#stat-cats').textContent = categories.length;

  // Build category tabs
  buildCategoryTabs(categories);

  // Render
  renderWarList(allWars);

  // Homepage search
  const searchInput = qs('#homepage-search-input');
  const searchBtn = qs('#homepage-search-btn');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      renderWarList(filterWars());
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') renderWarList(filterWars());
    });
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      renderWarList(filterWars());
    });
  }
}

function buildCategoryTabs(categories) {
  const tabs = qs('#category-tabs');
  if (!tabs) return;

  tabs.innerHTML = '';
  const allBtn = createTabButton('All Wars', 'all', true);
  tabs.appendChild(allBtn);

  categories.forEach(cat => {
    tabs.appendChild(createTabButton(cat, cat, false));
  });
}

function createTabButton(label, value, isActive) {
  const btn = document.createElement('button');
  btn.className = 'cat-tab' + (isActive ? ' active' : '');
  btn.textContent = label;
  btn.dataset.cat = value;
  btn.addEventListener('click', () => {
    activeCategory = value;
    qsa('.cat-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderWarList(filterWars());
  });
  return btn;
}

function filterWars() {
  return allWars.filter(w => {
    const matchesCat = activeCategory === 'all' || w.category === activeCategory;
    const matchesSearch = !searchQuery ||
      w.title.toLowerCase().includes(searchQuery) ||
      w.subtitle.toLowerCase().includes(searchQuery) ||
      w.summary.toLowerCase().includes(searchQuery) ||
      (w.belligerents || []).some(b => b.toLowerCase().includes(searchQuery));
    return matchesCat && matchesSearch;
  });
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const safe = escapeHtml(text);
  const safeQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${safeQuery})`, 'gi'), '<mark>$1</mark>');
}

function renderWarList(wars) {
  const container = qs('#war-list');
  if (!container) return;

  if (wars.length === 0) {
    container.innerHTML = `<div class="state-message"><span class="state-icon">✦</span>No articles match your search.</div>`;
    return;
  }

  container.innerHTML = '';

  wars.forEach((war, i) => {
    const card = document.createElement('a');
    card.className = 'war-card';
    card.href = `article.html?id=${encodeURIComponent(war.id)}`;
    card.style.animationDelay = `${i * 0.04}s`;

    card.innerHTML = `
      <div class="war-card-years">${escapeHtml(war.years)}</div>
      <div class="war-card-body">
        <div class="war-card-title">${highlightMatch(war.title, searchQuery)}</div>
        <div class="war-card-subtitle">${highlightMatch(war.subtitle, searchQuery)}</div>
        <div class="war-card-summary">${highlightMatch(war.summary, searchQuery)}</div>
      </div>
      <div class="war-card-badge">${escapeHtml(war.category)}</div>
    `;

    container.appendChild(card);
  });
}

/* ─────────────────────────────────────────────
   ARTICLE PAGE  (article.html)
   ───────────────────────────────────────────── */

async function initArticle() {
  const main = qs('#article-main');
  if (!main) return;

  const id = getParam('id');
  if (!id) {
    showArticleError('No article specified. <a href="index.html">Return to index</a>.');
    return;
  }

  // Show loading
  main.innerHTML = `<div class="state-message"><span class="state-icon">✦</span>Loading article…</div>`;

  let article;
  try {
    article = await fetchJSON(`articles/${encodeURIComponent(id)}.json`);
  } catch (e) {
    showArticleError(`Article "<strong>${escapeHtml(id)}</strong>" could not be loaded. It may not exist yet.`);
    return;
  }

  renderArticle(article);
}

function showArticleError(msg) {
  const main = qs('#article-main');
  if (main) main.innerHTML = `<div class="state-message"><span class="state-icon">✦</span>${msg}</div>`;
}

function renderArticle(a) {
  // Update page title
  document.title = `${a.title} — GoonPedia`;

  // Breadcrumb
  const bc = qs('#breadcrumb');
  if (bc) {
    bc.innerHTML = `
      <a href="index.html">GoonPedia</a>
      <span class="sep">›</span>
      <a href="index.html?cat=${encodeURIComponent(a.category || '')}">${escapeHtml(a.category || 'Wars')}</a>
      <span class="sep">›</span>
      ${escapeHtml(a.title)}
    `;
  }

  const main = qs('#article-main');
  main.innerHTML = '';

  // Outer layout
  const layout = document.createElement('div');
  layout.className = 'article-layout';

  // ── Left: main content
  const content = document.createElement('div');
  content.className = 'article-content';

  // Header
  const header = buildArticleHeader(a);
  content.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'article-body';

  // TOC
  const toc = buildTOC(a.sections);
  body.appendChild(toc);

  // Sections
  a.sections.forEach(section => {
    body.appendChild(buildSection(section));
  });

  content.appendChild(body);
  layout.appendChild(content);

  // ── Right: sidebar / infobox
  const sidebar = document.createElement('div');
  sidebar.className = 'article-sidebar';
  if (a.infobox) {
    sidebar.appendChild(buildInfobox(a));
  }
  layout.appendChild(sidebar);

  main.appendChild(layout);
}

function buildArticleHeader(a) {
  const h = document.createElement('div');
  h.className = 'article-header';
  h.innerHTML = `
    <div class="article-category-tag">${escapeHtml(a.category || 'War')} · Fictional Conflict</div>
    <h1 class="article-title">${escapeHtml(a.title)}</h1>
    <div class="article-subtitle">${escapeHtml(a.subtitle)}</div>
    <div class="article-lead">
      <span>Duration: <strong>${escapeHtml(a.years)}</strong></span>
      ${a.infobox ? `<span>Location: <strong>${escapeHtml(a.infobox.location || '')}</strong></span>` : ''}
    </div>
  `;
  return h;
}

function buildTOC(sections) {
  const wrap = document.createElement('div');
  wrap.className = 'toc-box';

  const header = document.createElement('div');
  header.className = 'toc-header';

  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'hide';
  let shown = true;

  header.innerHTML = `<span>Contents</span>`;
  header.appendChild(toggleBtn);

  const list = document.createElement('ol');
  list.className = 'toc-list';

  sections.forEach((sec, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#section-${sec.id}`;
    a.textContent = sec.title;
    li.appendChild(a);

    if (sec.subsections && sec.subsections.length) {
      const sub = document.createElement('ol');
      sub.className = 'toc-sub';
      sec.subsections.forEach(ss => {
        const sli = document.createElement('li');
        const sa = document.createElement('a');
        sa.href = `#section-${ss.id}`;
        sa.textContent = ss.title;
        sli.appendChild(sa);
        sub.appendChild(sli);
      });
      li.appendChild(sub);
    }

    list.appendChild(li);
  });

  toggleBtn.addEventListener('click', () => {
    shown = !shown;
    list.style.display = shown ? '' : 'none';
    toggleBtn.textContent = shown ? 'hide' : 'show';
  });

  wrap.appendChild(header);
  wrap.appendChild(list);
  return wrap;
}

function buildSection(section) {
  const div = document.createElement('div');
  div.className = 'article-section';
  div.id = `section-${section.id}`;

  const h2 = document.createElement('h2');
  h2.className = 'section-heading';
  h2.textContent = section.title;
  div.appendChild(h2);

  if (section.content) {
    section.content.split('\n\n').forEach(para => {
      if (para.trim()) {
        const p = document.createElement('p');
        p.textContent = para.trim();
        div.appendChild(p);
      }
    });
  }

  if (section.subsections) {
    section.subsections.forEach(ss => {
      const ssDiv = document.createElement('div');
      ssDiv.id = `section-${ss.id}`;

      const h3 = document.createElement('h3');
      h3.className = 'subsection-heading';
      h3.textContent = ss.title;
      ssDiv.appendChild(h3);

      ss.content.split('\n\n').forEach(para => {
        if (para.trim()) {
          const p = document.createElement('p');
          p.textContent = para.trim();
          ssDiv.appendChild(p);
        }
      });

      div.appendChild(ssDiv);
    });
  }

  // References
  if (section.references) {
    const ul = document.createElement('ol');
    ul.className = 'references-list';

    section.references.forEach(ref => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="ref-num">[${ref.id}]</span>
        <span>
          <span class="ref-author">${escapeHtml(ref.author)}</span>
          ${ref.year ? `(${escapeHtml(ref.year)}).` : ''}
          <span class="ref-title"> ${escapeHtml(ref.title)}</span>.
          <em>${escapeHtml(ref.publisher)}</em>.
          ${ref.note ? `<span class="ref-note">${escapeHtml(ref.note)}</span>` : ''}
        </span>
      `;
      ul.appendChild(li);
    });

    div.appendChild(ul);
  }

  return div;
}

function buildInfobox(a) {
  const ib = a.infobox;
  const box = document.createElement('div');
  box.className = 'infobox';

  box.innerHTML = `<div class="infobox-title">${escapeHtml(a.title)}</div>`;
  if (a.subtitle) {
    box.innerHTML += `<div class="infobox-subtitle">${escapeHtml(a.subtitle)}</div>`;
  }

  const table = document.createElement('table');

  function row(label, value) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${label}</td><td>${value}</td>`;
    return tr;
  }

  function sectionHead(label) {
    const tr = document.createElement('tr');
    tr.className = 'infobox-section-head';
    tr.innerHTML = `<td colspan="2">${label}</td>`;
    return tr;
  }

  if (ib.date) table.appendChild(row('Date', escapeHtml(ib.date)));
  if (ib.location) table.appendChild(row('Location', escapeHtml(ib.location)));
  if (ib.result) {
    const resultText = ib.result.length > 80
      ? ib.result.substring(0, 80) + '…'
      : ib.result;
    table.appendChild(row('Result', escapeHtml(resultText)));
  }

  // Belligerents
  if (ib.belligerents && ib.belligerents.length) {
    table.appendChild(sectionHead('Belligerents'));
    const tr = document.createElement('tr');
    let sides = ib.belligerents.map((side, i) => {
      const labelClass = i === 0 ? 'side-label' : 'side-label alt';
      const members = (side.members || []).map(m => `<li>${escapeHtml(m)}</li>`).join('');
      return `<td>
        <span class="${labelClass}">${i === 0 ? 'Side A' : 'Side B'}</span><br>
        <strong>${escapeHtml(side.side)}</strong>
        ${members ? `<ul>${members}</ul>` : ''}
      </td>`;
    });
    tr.innerHTML = sides.join('');
    table.appendChild(tr);
  }

  // Commanders
  if (ib.commanders && ib.commanders.length) {
    table.appendChild(sectionHead('Commanders'));
    const tr = document.createElement('tr');
    let sides = ib.commanders.map((side, i) => {
      const labelClass = i === 0 ? 'side-label' : 'side-label alt';
      const leaders = (side.leaders || []).map(l => {
        const note = l.note ? `<span class="dagger">${escapeHtml(l.note)}</span>` : '';
        return `<li>${escapeHtml(l.name)}${note}</li>`;
      }).join('');
      return `<td>
        <span class="${labelClass}">${i === 0 ? 'Side A' : 'Side B'}</span>
        ${leaders ? `<ul>${leaders}</ul>` : ''}
      </td>`;
    });
    tr.innerHTML = sides.join('');
    table.appendChild(tr);
  }

  // Strength
  if (ib.strength && ib.strength.length) {
    table.appendChild(sectionHead('Strength'));
    ib.strength.forEach(s => {
      table.appendChild(row(escapeHtml(s.side), escapeHtml(s.value)));
    });
  }

  // Casualties
  if (ib.casualties && ib.casualties.length) {
    table.appendChild(sectionHead('Casualties'));
    ib.casualties.forEach(c => {
      table.appendChild(row(escapeHtml(c.side), escapeHtml(c.value)));
    });
  }

  box.appendChild(table);
  return box;
}

/* ─────────────────────────────────────────────
   GLOBAL HEADER SEARCH
   ───────────────────────────────────────────── */

function initHeaderSearch() {
  const input = qs('#global-search-input');
  const btn = qs('#global-search-btn');
  if (!input || !btn) return;

  function doSearch() {
    const q = input.value.trim();
    if (!q) return;
    window.location.href = `index.html?q=${encodeURIComponent(q)}`;
  }

  btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

/* Handle incoming search query on homepage */
async function handleIncomingSearch() {
  const q = getParam('q');
  if (!q) return;

  // Wait for allWars to be populated, then apply search
  const wait = () => new Promise(r => setTimeout(r, 100));
  while (allWars.length === 0) await wait();

  const input = qs('#homepage-search-input');
  if (input) input.value = q;
  searchQuery = q.toLowerCase();

  const banner = qs('#search-results-banner');
  if (banner) {
    banner.style.display = 'block';
    banner.innerHTML = `Showing results for <strong>"${escapeHtml(q)}"</strong>`;
  }

  renderWarList(filterWars());
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initHeaderSearch();

  const page = document.body.dataset.page;

  if (page === 'home') {
    initHomepage().then(handleIncomingSearch);
  } else if (page === 'article') {
    initArticle();
  }
});

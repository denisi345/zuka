/* ZUKA MARKETPLACE - PRODUCTION MODULE */
(function () {
  if (window.__zukaMarketplaceLoaded) return;
  window.__zukaMarketplaceLoaded = true;

  const CATEGORIES = [
    'All',
    'Vehicles',
    'Property Rentals',
    'Electronics',
    'Clothing & Shoes',
    'Home & Garden',
    'Furniture',
    'Phones & Accessories',
    'Sports & Outdoors',
    'Free Stuff'
  ];

  const CONDITIONS = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'];

  const DEFAULT_PLACEHOLDER_IMG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://w3.org" width="600" height="600" viewBox="0 0 600 600">' +
        '<rect width="600" height="600" fill="#E4E6EB"/>' +
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#65676B" font-family="sans-serif" font-size="24" font-weight="600">ZUKA Marketplace</text>' +
      '</svg>'
    );

  const state = {
    listings: [],
    savedIds: JSON.parse(localStorage.getItem('zuka_mp_saved') || '[]'),
    activeTab: 'browse',
    category: 'All',
    search: '',
    minPrice: '',
    maxPrice: '',
    condition: 'All',
    sort: 'newest',
    activeTable: 'marketplace_listings',
    currentUser: null,
    isLoading: false
  };

  function getSupabase() {
    return window.supabaseClient || window.supabase || null;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPrice(price, currency) {
    const amount = Number(price || 0);
    if (amount === 0) return 'Free';
    return `${currency || 'TZS'} ${amount.toLocaleString()}`;
  }

  function injectStyles() {
    if (document.getElementById('zuka-mp-styles')) return;
    const style = document.createElement('style');
    style.id = 'zuka-mp-styles';
    style.textContent = `
      #zuka-mp-overlay {
        position: fixed;
        inset: 0;
        z-index: 2150;
        background: #F0F2F5;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #050505;
      }
      #zuka-mp-overlay.open { display: flex; }
      .zmp-topbar {
        height: 56px;
        min-height: 56px;
        background: #FFFFFF;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px;
        z-index: 10;
      }
      .zmp-topbar-left { display: flex; align-items: center; gap: 10px; }
      .zmp-back-btn {
        width: 36px; height: 36px; border-radius: 50%; border: none;
        background: #E4E6EB; color: #050505; font-size: 18px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
      }
      .zmp-title { font-size: 22px; font-weight: 700; margin: 0; color: #050505; }
      .zmp-topbar-actions { display: flex; align-items: center; gap: 8px; }
      .zmp-pill-btn {
        background: #E4E6EB; color: #050505; border: none; border-radius: 18px;
        padding: 8px 14px; font-size: 14px; font-weight: 600; cursor: pointer;
      }
      .zmp-pill-btn.primary { background: #1877F2; color: #FFFFFF; }
      .zmp-pill-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .zmp-body {
        flex: 1;
        display: flex;
        overflow: hidden;
        width: 100%;
      }
      .zmp-sidebar {
        width: 360px;
        min-width: 360px;
        background: #FFFFFF;
        border-right: 1px solid #E4E6EB;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .zmp-search-box {
        width: 100%; height: 38px; border-radius: 20px; border: none;
        background: #F0F2F5; padding: 0 14px; font-size: 15px; outline: none;
        box-sizing: border-box;
      }
      .zmp-nav-item {
        display: flex; align-items: center; gap: 10px; padding: 10px 12px;
        border-radius: 8px; border: none; background: transparent; width: 100%;
        text-align: left; font-size: 15px; font-weight: 600; cursor: pointer; color: #050505;
      }
      .zmp-nav-item:hover, .zmp-nav-item.active { background: #E7F3FF; color: #1877F2; }
      .zmp-filter-group { border-top: 1px solid #E4E6EB; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
      .zmp-filter-label { font-size: 14px; font-weight: 700; color: #65676B; }
      .zmp-price-row { display: flex; gap: 8px; }
      .zmp-input, .zmp-select, .zmp-textarea {
        width: 100%; padding: 9px 12px; border-radius: 8px; border: 1px solid #CED0D4;
        background: #FFFFFF; font-size: 14px; box-sizing: border-box; color: #050505;
      }
      .zmp-main {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px;
      }
      .zmp-mobile-bar {
        display: none;
        background: #FFFFFF;
        padding: 8px 10px;
        gap: 8px;
        border-bottom: 1px solid #E4E6EB;
      }
      .zmp-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 16px;
      }
      .zmp-card {
        background: transparent;
        cursor: pointer;
        display: flex;
        flex-direction: column;
      }
      .zmp-card-img-wrap {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 8px;
        overflow: hidden;
        background: #E4E6EB;
      }
      .zmp-card-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .zmp-sold-badge {
        position: absolute; top: 8px; left: 8px;
        background: #E41E3F; color: #FFFFFF; font-size: 11px; font-weight: 700;
        padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px;
      }
      .zmp-card-price { font-size: 17px; font-weight: 700; color: #050505; margin-top: 8px; line-height: 1.2; }
      .zmp-card-title {
        font-size: 15px; color: #050505; margin-top: 3px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .zmp-card-loc { font-size: 13px; color: #65676B; margin-top: 2px; }
      .zmp-empty-state {
        grid-column: 1 / -1;
        background: #FFFFFF;
        border-radius: 8px;
        padding: 36px 20px;
        text-align: center;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      .zmp-modal-backdrop {
        position: fixed; inset: 0; z-index: 2300; background: rgba(0, 0, 0, 0.65);
        display: flex; align-items: center; justify-content: center; padding: 12px;
      }
      .zmp-modal {
        background: #FFFFFF; border-radius: 12px; width: 100%; max-width: 680px;
        max-height: 90dvh; overflow-y: auto; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
        padding: 16px; box-sizing: border-box;
      }
      .zmp-modal-header {
        display: flex; align-items: center; justify-content: space-between;
        border-bottom: 1px solid #E4E6EB; padding-bottom: 10px; margin-bottom: 14px;
      }
      .zmp-detail-img {
        width: 100%; max-height: 360px; object-fit: cover; border-radius: 8px; background: #E4E6EB;
      }
      @media (max-width: 767px) {
        .zmp-sidebar { display: none; }
        .zmp-sidebar.mobile-open {
          display: flex; position: fixed; inset: 56px 0 0 0; width: 100%; min-width: 100%; z-index: 2200;
        }
        .zmp-mobile-bar { display: flex; }
        .zmp-main { padding: 8px; }
        .zmp-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      }
    `;
    document.head.appendChild(style);
  }
  function closeOtherOverlays() {
    document.querySelectorAll('video').forEach((video) => {
      try {
        video.pause();
        video.muted = true;
      } catch (_) {}
    });
    const selectors = [
      '#reels-overlay', '#reelsOverlay', '.reels-overlay',
      '#messenger-drawer', '#messengerDrawer', '#chat-drawer', '.chat-drawer',
      '#story-modal', '#storyModal', '#nav-menu-dropdown', '.nav-dropdown'
    ];
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.style.display = 'none';
        el.classList.remove('open', 'active');
      });
    });
  }

  async function detectUserAndTable() {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const { data } = await sb.auth.getUser();
      if (data && data.user) state.currentUser = data.user;
    } catch (_) {}

    for (const tableName of ['marketplace_listings', 'marketplace_items']) {
      try {
        const { error } = await sb.from(tableName).select('id').limit(1);
        if (!error) {
          state.activeTable = tableName;
          break;
        }
      } catch (_) {}
    }
  }

  async function fetchListings() {
    const sb = getSupabase();
    state.isLoading = true;
    renderGrid();

    if (!sb) {
      state.listings = [];
      state.isLoading = false;
      renderGrid();
      return;
    }

    try {
      const { data, error } = await sb
        .from(state.activeTable)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(80);

      if (!error && Array.isArray(data)) {
        state.listings = data.map((row) => ({
          id: row.id,
          title: row.title || row.name || 'Untitled Listing',
          price: Number(row.price ?? 0),
          currency: row.currency || 'TZS',
          category: row.category || 'Electronics',
          condition: row.condition || 'New',
          location: row.location || 'Location not specified',
          description: row.description || '',
          image_url: row.image_url || row.image || DEFAULT_PLACEHOLDER_IMG,
          seller_name: row.seller_name || row.author_name || 'ZUKA Member',
          seller_id: row.user_id || row.seller_id || null,
          status: row.status || (row.is_sold ? 'sold' : 'active'),
          created_at: row.created_at || new Date().toISOString()
        }));
      } else {
        state.listings = [];
      }
    } catch (_) {
      state.listings = [];
    } finally {
      state.isLoading = false;
      renderGrid();
    }
  }

  function getFilteredListings() {
    let items = [...state.listings];
    if (state.activeTab === 'saved') {
      items = items.filter((item) => state.savedIds.includes(String(item.id)));
    } else if (state.activeTab === 'selling') {
      items = state.currentUser
        ? items.filter((item) => String(item.seller_id) === String(state.currentUser.id))
        : [];
    }
    if (state.category && state.category !== 'All') {
      items = items.filter((item) => item.category === state.category);
    }
    if (state.condition && state.condition !== 'All') {
      items = items.filter((item) => item.condition === state.condition);
    }
    if (state.minPrice !== '') {
      items = items.filter((item) => Number(item.price) >= Number(state.minPrice));
    }
    if (state.maxPrice !== '') {
      items = items.filter((item) => Number(item.price) <= Number(state.maxPrice));
    }
    if (state.search.trim()) {
      const q = state.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          (item.title || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          (item.location || '').toLowerCase().includes(q)
      );
    }
    if (state.sort === 'price_asc') {
      items.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (state.sort === 'price_desc') {
      items.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return items;
  }

  function ensureShell() {
    injectStyles();
    let overlay = document.getElementById('zuka-mp-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'zuka-mp-overlay';
    overlay.innerHTML = `
      <div class="zmp-topbar">
        <div class="zmp-topbar-left">
          <button type="button" class="zmp-back-btn" id="zmp-close-btn" aria-label="Back to Feed">&larr;</button>
          <h2 class="zmp-title">Marketplace</h2>
        </div>
        <div class="zmp-topbar-actions">
          <button type="button" class="zmp-pill-btn primary" id="zmp-open-sell-btn">+ Sell</button>
          <button type="button" class="zmp-pill-btn" id="zmp-toggle-filters-btn">Categories</button>
        </div>
      </div>
      <div class="zmp-mobile-bar">
        <input type="search" id="zmp-mobile-search" class="zmp-search-box" placeholder="Search Marketplace" />
      </div>
      <div class="zmp-body">
        <aside class="zmp-sidebar" id="zmp-sidebar">
          <input type="search" id="zmp-desktop-search" class="zmp-search-box" placeholder="Search Marketplace" />
          <button type="button" class="zmp-pill-btn primary" id="zmp-sidebar-sell-btn" style="width:100%;padding:10px;">+ Create new listing</button>
          <div>
            <button type="button" class="zmp-nav-item active" data-mptab="browse">Browse all</button>
            <button type="button" class="zmp-nav-item" data-mptab="saved">Saved items</button>
            <button type="button" class="zmp-nav-item" data-mptab="selling">Your listings</button>
          </div>
          <div class="zmp-filter-group">
            <span class="zmp-filter-label">Filters &amp; Sort</span>
            <select id="zmp-sort-select" class="zmp-select">
              <option value="newest">Sort: Newest first</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <select id="zmp-condition-select" class="zmp-select">
              <option value="All">Condition: All</option>
              ${CONDITIONS.map((c) => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <div class="zmp-price-row">
              <input type="number" id="zmp-min-price" class="zmp-input" placeholder="Min price" min="0" />
              <input type="number" id="zmp-max-price" class="zmp-input" placeholder="Max price" min="0" />
            </div>
          </div>
          <div class="zmp-filter-group">
            <span class="zmp-filter-label">Categories</span>
            <div id="zmp-cat-list"></div>
          </div>
        </aside>
        <main class="zmp-main">
          <div id="zmp-grid" class="zmp-grid"></div>
        </main>
      </div>
    `;
    document.body.appendChild(overlay);
    bindShellEvents();
    return overlay;
  }

  function renderCategories() {
    const catList = document.getElementById('zmp-cat-list');
    if (!catList) return;
    catList.innerHTML = CATEGORIES.map(
      (cat) => `
        <button type="button" class="zmp-nav-item ${state.category === cat ? 'active' : ''}" data-mpcat="${escapeHtml(cat)}">
          ${escapeHtml(cat)}
        </button>
      `
    ).join('');
    catList.querySelectorAll('[data-mpcat]').forEach((btn) => {
      btn.onclick = () => {
        state.category = btn.getAttribute('data-mpcat');
        document.getElementById('zmp-sidebar')?.classList.remove('mobile-open');
        renderCategories();
        renderGrid();
      };
    });
  }

  function renderGrid() {
    const grid = document.getElementById('zmp-grid');
    if (!grid) return;

    if (state.isLoading) {
      grid.innerHTML = `<div class="zmp-empty-state"><p style="margin:0;color:#65676B;font-size:15px;">Loading Marketplace listings...</p></div>`;
      return;
    }

    const items = getFilteredListings();
    if (!items.length) {
      grid.innerHTML = `
        <div class="zmp-empty-state">
          <h3 style="margin:0 0 8px;font-size:18px;color:#050505;">No listings found</h3>
          <p style="margin:0 0 16px;font-size:14px;color:#65676B;">Be the first to list an item for sale on ZUKA Marketplace.</p>
          <button type="button" class="zmp-pill-btn primary" id="zmp-empty-sell-btn">+ Create new listing</button>
        </div>
      `;
      const emptyBtn = document.getElementById('zmp-empty-sell-btn');
      if (emptyBtn) emptyBtn.onclick = openSellModal;
      return;
    }

    grid.innerHTML = items
      .map(
        (item) => `
        <div class="zmp-card" data-mpid="${escapeHtml(item.id)}">
          <div class="zmp-card-img-wrap">
            <img class="zmp-card-img" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='${DEFAULT_PLACEHOLDER_IMG}'" />
            ${item.status === 'sold' ? '<span class="zmp-sold-badge">SOLD</span>' : ''}
          </div>
          <div class="zmp-card-price">${escapeHtml(formatPrice(item.price, item.currency))}</div>
          <div class="zmp-card-title">${escapeHtml(item.title)}</div>
          <div class="zmp-card-loc">${escapeHtml(item.location)}</div>
        </div>
      `
      )
      .join('');

    grid.querySelectorAll('.zmp-card').forEach((card) => {
      card.onclick = () => {
        const id = card.getAttribute('data-mpid');
        const found = state.listings.find((entry) => String(entry.id) === String(id));
        if (found) openDetailModal(found);
      };
    });
  }

  function openDetailModal(item) {
    const isSaved = state.savedIds.includes(String(item.id));
    const isOwner = state.currentUser && String(item.seller_id) === String(state.currentUser.id);
    const backdrop = document.createElement('div');
    backdrop.className = 'zmp-modal-backdrop';
    backdrop.innerHTML = `
      <div class="zmp-modal">
        <div class="zmp-modal-header">
          <strong>${escapeHtml(item.title)}</strong>
          <button type="button" class="zmp-back-btn" id="zmp-detail-close" aria-label="Close">&times;</button>
        </div>
        <img class="zmp-detail-img" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" onerror="this.src='${DEFAULT_PLACEHOLDER_IMG}'" />
        <div style="margin-top:12px;">
          <div style="font-size:22px;font-weight:700;">${escapeHtml(formatPrice(item.price, item.currency))}</div>
          <div style="font-size:14px;color:#65676B;margin-top:4px;">${escapeHtml(item.category)} &middot; ${escapeHtml(item.condition)} &middot; ${escapeHtml(item.location)}</div>
          <p style="font-size:15px;margin:12px 0;line-height:1.45;">${escapeHtml(item.description || 'No description provided.')}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
            <button type="button" class="zmp-pill-btn" id="zmp-save-btn">${isSaved ? 'Saved' : 'Save'}</button>
            <button type="button" class="zmp-pill-btn" id="zmp-share-btn">Share</button>
            ${isOwner && item.status !== 'sold' ? '<button type="button" class="zmp-pill-btn primary" id="zmp-mark-sold-btn">Mark as Sold</button>' : ''}
            ${isOwner ? '<button type="button" class="zmp-pill-btn" id="zmp-delete-btn" style="color:#E41E3F;">Delete Listing</button>' : ''}
          </div>
          <div style="background:#F0F2F5;padding:12px;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;margin-bottom:6px;">Seller: ${escapeHtml(item.seller_name)}</div>
            <div style="display:flex;gap:8px;">
              <input type="text" id="zmp-inquiry-input" class="zmp-input" value="Hi, is this still available?" />
              <button type="button" class="zmp-pill-btn primary" id="zmp-send-inquiry-btn">Send</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelector('#zmp-detail-close').onclick = () => backdrop.remove();
    backdrop.onclick = (e) => {
      if (e.target === backdrop) backdrop.remove();
    };

    backdrop.querySelector('#zmp-save-btn').onclick = () => {
      const sid = String(item.id);
      if (state.savedIds.includes(sid)) {
        state.savedIds = state.savedIds.filter((x) => x !== sid);
      } else {
        state.savedIds.push(sid);
      }
      localStorage.setItem('zuka_mp_saved', JSON.stringify(state.savedIds));
      backdrop.remove();
      openDetailModal(item);
      renderGrid();
    };

    backdrop.querySelector('#zmp-share-btn').onclick = () => {
      if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
      const btn = backdrop.querySelector('#zmp-share-btn');
      if (btn) btn.textContent = 'Link Copied';
    };

    const soldBtn = backdrop.querySelector('#zmp-mark-sold-btn');
    if (soldBtn) {
      soldBtn.onclick = async () => {
        const sb = getSupabase();
        if (sb) {
          try {
            await sb.from(state.activeTable).update({ status: 'sold' }).eq('id', item.id);
          } catch (_) {}
        }
        item.status = 'sold';
        backdrop.remove();
        renderGrid();
      };
    }

    const delBtn = backdrop.querySelector('#zmp-delete-btn');
    if (delBtn) {
      delBtn.onclick = async () => {
        const sb = getSupabase();
        if (sb) {
          try {
            await sb.from(state.activeTable).delete().eq('id', item.id);
          } catch (_) {}
        }
        state.listings = state.listings.filter((entry) => String(entry.id) !== String(item.id));
        backdrop.remove();
        renderGrid();
      };
    }

    backdrop.querySelector('#zmp-send-inquiry-btn').onclick = async () => {
      const text = backdrop.querySelector('#zmp-inquiry-input').value.trim();
      if (!text) return;
      const sb = getSupabase();
      const messageBody = `[Marketplace: ${item.title}] ${text}`;
      if (sb && state.currentUser && item.seller_id) {
        try {
          await sb.from('messages').insert({
            sender_id: state.currentUser.id,
            receiver_id: item.seller_id,
            content: messageBody
          });
        } catch (_) {}
      }
      backdrop.remove();
      closeMarketplace();
      if (typeof window.openZukaMessenger === 'function') {
        window.openZukaMessenger(item.seller_id, item.seller_name, messageBody);
      }
    };
  }

  function openSellModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'zmp-modal-backdrop';
    backdrop.innerHTML = `
      <div class="zmp-modal">
        <div class="zmp-modal-header">
          <strong>Create New Listing</strong>
          <button type="button" class="zmp-back-btn" id="zmp-sell-close" aria-label="Close">&times;</button>
        </div>
        <form id="zmp-sell-form" style="display:flex;flex-direction:column;gap:10px;">
          <input type="text" id="zmp-f-title" class="zmp-input" placeholder="Title" required />
          <div class="zmp-price-row">
            <input type="number" id="zmp-f-price" class="zmp-input" placeholder="Price (0 for Free)" min="0" required />
            <select id="zmp-f-currency" class="zmp-select" style="max-width:110px;">
              <option value="TZS">TZS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <select id="zmp-f-category" class="zmp-select">
            ${CATEGORIES.filter((c) => c !== 'All').map((c) => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <select id="zmp-f-condition" class="zmp-select">
            ${CONDITIONS.map((c) => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <input type="text" id="zmp-f-location" class="zmp-input" placeholder="Location" required />
          <input type="file" id="zmp-f-file" class="zmp-input" accept="image/*" />
          <input type="url" id="zmp-f-url" class="zmp-input" placeholder="Image URL (optional)" />
          <textarea id="zmp-f-desc" class="zmp-textarea" rows="3" placeholder="Description"></textarea>
          <button type="submit" class="zmp-pill-btn primary" id="zmp-f-submit" style="padding:11px;font-size:15px;">Publish Listing</button>
        </form>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelector('#zmp-sell-close').onclick = () => backdrop.remove();
    backdrop.onclick = (e) => {
      if (e.target === backdrop) backdrop.remove();
    };

    backdrop.querySelector('#zmp-sell-form').onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = backdrop.querySelector('#zmp-f-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Publishing...';

      const sb = getSupabase();
      let imageUrl = backdrop.querySelector('#zmp-f-url').value.trim() || DEFAULT_PLACEHOLDER_IMG;
      const fileInput = backdrop.querySelector('#zmp-f-file');

      if (sb && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
        const storagePath = `marketplace/${Date.now()}_${safeName}`;
        for (const bucket of ['media', 'marketplace', 'public']) {
          try {
            const { error: uploadErr } = await sb.storage.from(bucket).upload(storagePath, file);
            if (!uploadErr) {
              const { data: pubData } = sb.storage.from(bucket).getPublicUrl(storagePath);
              if (pubData && pubData.publicUrl) {
                imageUrl = pubData.publicUrl;
                break;
              }
            }
          } catch (_) {}
        }
      }

      const newListing = {
        title: backdrop.querySelector('#zmp-f-title').value.trim(),
        price: Number(backdrop.querySelector('#zmp-f-price').value || 0),
        currency: backdrop.querySelector('#zmp-f-currency').value,
        category: backdrop.querySelector('#zmp-f-category').value,
        condition: backdrop.querySelector('#zmp-f-condition').value,
        location: backdrop.querySelector('#zmp-f-location').value.trim(),
        description: backdrop.querySelector('#zmp-f-desc').value.trim(),
        image_url: imageUrl,
        status: 'active'
      };

      let savedRecord = null;
      if (sb) {
        try {
          const payload = { ...newListing };
          if (state.currentUser) payload.user_id = state.currentUser.id;
          const { data, error } = await sb.from(state.activeTable).insert(payload).select().single();
          if (!error && data) savedRecord = data;
        } catch (_) {}
      }

      state.listings.unshift({
        id: savedRecord?.id || `listing-${Date.now()}`,
        ...newListing,
        seller_name: 'ZUKA Member',
        seller_id: state.currentUser?.id || null,
        created_at: new Date().toISOString()
      });

      backdrop.remove();
      renderGrid();
    };
  }

  function bindShellEvents() {
    document.getElementById('zmp-close-btn').onclick = closeMarketplace;
    document.getElementById('zmp-open-sell-btn').onclick = openSellModal;
    document.getElementById('zmp-sidebar-sell-btn').onclick = openSellModal;
    document.getElementById('zmp-toggle-filters-btn').onclick = () => {
      document.getElementById('zmp-sidebar')?.classList.toggle('mobile-open');
    };

    const handleSearch = (value) => {
      state.search = value;
      renderGrid();
    };
    document.getElementById('zmp-desktop-search').oninput = (e) => handleSearch(e.target.value);
    document.getElementById('zmp-mobile-search').oninput = (e) => handleSearch(e.target.value);

    document.getElementById('zmp-sort-select').onchange = (e) => {
      state.sort = e.target.value;
      renderGrid();
    };
    document.getElementById('zmp-condition-select').onchange = (e) => {
      state.condition = e.target.value;
      renderGrid();
    };
    document.getElementById('zmp-min-price').oninput = (e) => {
      state.minPrice = e.target.value;
      renderGrid();
    };
    document.getElementById('zmp-max-price').oninput = (e) => {
      state.maxPrice = e.target.value;
      renderGrid();
    };

    document.querySelectorAll('[data-mptab]').forEach((btn) => {
      btn.onclick = () => {
        state.activeTab = btn.getAttribute('data-mptab');
        document.querySelectorAll('[data-mptab]').forEach((el) => el.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('zmp-sidebar')?.classList.remove('mobile-open');
        renderGrid();
      };
    });
  }

  async function openMarketplace() {
    closeOtherOverlays();
    const overlay = ensureShell();
    overlay.classList.add('open');
    renderCategories();
    await detectUserAndTable();
    await fetchListings();
  }

  function closeMarketplace() {
    const overlay = document.getElementById('zuka-mp-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  window.openZukaMarketplace = openMarketplace;
  window.closeZukaMarketplace = closeMarketplace;
  window.initMarketplace = openMarketplace;

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest(
      '[data-tab="marketplace"], [data-nav="marketplace"], #nav-marketplace, #tab-marketplace, .marketplace-tab, a[href*="marketplace"]'
    );
    if (trigger) {
      e.preventDefault();
      openMarketplace();
    }
  });
})();

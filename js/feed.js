const feedGrid = document.getElementById('feedGrid');
const feedLoading = document.getElementById('feedLoading');
const feedError = document.getElementById('feedError');
const sortChipsContainer = document.querySelector('.feed__sort');
const styleFiltersContainer = document.getElementById('styleFilters');
const outfitDetailModal = document.getElementById('outfitDetailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const detailImage = document.getElementById('detailImage');
const detailAvatar = document.getElementById('detailAvatar');
const detailAuthorName = document.getElementById('detailAuthorName');
const detailPieces = document.getElementById('detailPieces');
const detailLikeBtn = document.getElementById('detailLikeBtn');
const detailSaveBtn = document.getElementById('detailSaveBtn');
const STYLE_LABELS = { casual: 'Casual', streetwear: 'Streetwear', chic: 'Chic', sport: 'Sport' };
const STYLE_VISUALS = {
  casual:     { from: '#FBEFE4', to: '#E08D6D', emoji: '👕' },
  chic:       { from: '#2A2432', to: '#C9A24B', emoji: '👗' },
  streetwear: { from: '#FFE8EC', to: '#F2637E', emoji: '🧢' },
  sport:      { from: '#E8F3EA', to: '#6FA37A', emoji: '👟' },
};
let outfits = [];
let currentSort = 'trending';
let currentStyleFilter = 'all';
let openOutfitId = null;
function generateOutfitImage(outfit) {
  const visual = STYLE_VISUALS[outfit.style] || STYLE_VISUALS.casual;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${visual.from}" />
          <stop offset="100%" stop-color="${visual.to}" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#g)" />
      <text x="50%" y="46%" font-size="120" text-anchor="middle" dominant-baseline="middle">${visual.emoji}</text>
      <text x="50%" y="72%" font-size="22" font-family="sans-serif" font-weight="600"
            fill="${visual.to === '#C9A24B' ? '#F1EAE4' : '#2B2622'}" text-anchor="middle">
        ${STYLE_LABELS[outfit.style] || outfit.style}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
function getUserKey() {
  return localStorage.getItem('currentUser') || 'guest';
}
function loadIdSet(prefix) {
  const raw = localStorage.getItem(`${prefix}_${getUserKey()}`);
  return new Set(raw ? JSON.parse(raw) : []);
}
function saveIdSet(prefix, idSet) {
  localStorage.setItem(`${prefix}_${getUserKey()}`, JSON.stringify([...idSet]));
}
function loadMyShared() {
  const raw = localStorage.getItem(`mesPublications_${getUserKey()}`);
  const shared = raw ? JSON.parse(raw) : [];
  const dressing = JSON.parse(localStorage.getItem(`dressing_${getUserKey()}`) || '[]');
  const resolveName = (id) => {
    const item = dressing.find((i) => i.id === id);
    return item ? item.name : null;
  };
  return shared.map((pub) => {
    const ids = pub.pieceIds || {};
    const pieceNames = [
      resolveName(ids.hautId),
      resolveName(ids.basId),
      resolveName(ids.chaussuresId),
      ids.accessoireId ? resolveName(ids.accessoireId) : null,
    ].filter(Boolean);
    return {
      id: `mine-${pub.id}`,
      originalId: pub.id,
      isMine: true,
      author: { name: 'Toi', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=user' },
      image: pub.image || null,
      style: pub.criteria.style || 'casual',
      likes: 0,
      saved: false,
      pieces: pieceNames.length ? pieceNames : ['Tenue personnalisée'],
    };
  });
}
function deleteMyShared(originalId) {
  const raw = localStorage.getItem(`mesPublications_${getUserKey()}`);
  const shared = raw ? JSON.parse(raw) : [];
  const updated = shared.filter((pub) => pub.id !== originalId);
  localStorage.setItem(`mesPublications_${getUserKey()}`, JSON.stringify(updated));
}
let likedIds = loadIdSet('likes');
let savedIds = loadIdSet('favoris');
function loadFeed() {
  feedLoading.hidden = false;
  feedError.hidden = true;
  feedGrid.innerHTML = '';
  fetch('data/communaute.json')
    .then((response) => {
      if (!response.ok) throw new Error('Réponse réseau invalide');
      return response.json();
    })
    .then((data) => {
      outfits = [...loadMyShared(), ...data];
      feedLoading.hidden = true;
      renderFeed();
    })
    .catch((error) => {
      console.error('Erreur de chargement du feed :', error);
      feedLoading.hidden = true;
      feedError.hidden = false;
    });
}
function getDisplayedLikes(outfit) {
  return outfit.likes + (likedIds.has(outfit.id) ? 1 : 0);
}
function getVisibleOutfits() {
  let list = outfits.filter(
    (o) => currentStyleFilter === 'all' || o.style === currentStyleFilter
  );
  if (currentSort === 'trending') {
    list = [...list].sort((a, b) => getDisplayedLikes(b) - getDisplayedLikes(a));
  } else if (currentSort === 'recent') {
    list = [...list].reverse();
  }
  return list;
}
function renderFeed() {
  const visible = getVisibleOutfits();
  feedGrid.innerHTML = '';
  visible.forEach((outfit) => feedGrid.appendChild(createOutfitCard(outfit)));
}
function createOutfitCard(outfit) {
  const card = document.createElement('article');
  card.className = 'outfit-post';
  card.dataset.id = outfit.id;
  const isLiked = likedIds.has(outfit.id);
  const isSaved = savedIds.has(outfit.id);
  const displayedLikes = getDisplayedLikes(outfit);
  const imageSrc = outfit.image || generateOutfitImage(outfit);
  card.innerHTML = `
    <div class="outfit-post__header">
      <img class="outfit-post__avatar" src="${outfit.author.avatar}" alt="Avatar de ${outfit.author.name}">
      <span class="outfit-post__author">${outfit.author.name}</span>
      <span class="outfit-post__style-badge">${STYLE_LABELS[outfit.style] || outfit.style}</span>
      ${outfit.isMine ? '<button class="outfit-post__delete" type="button" aria-label="Supprimer ma publication">🗑</button>' : ''}
    </div>
    <div class="outfit-post__image-wrap">
      <img class="outfit-post__img" src="${imageSrc}" alt="Tenue de ${outfit.author.name}">
    </div>
    <div class="outfit-post__actions">
      <button class="outfit-post__like" type="button" data-liked="${isLiked}" aria-label="J'aime">
        <span class="icon">${isLiked ? '♥' : '♡'}</span>
        <span class="like-count">${displayedLikes}</span>
      </button>
      <button class="outfit-post__save" type="button" data-saved="${isSaved}" aria-label="Enregistrer">
        <span class="icon">🔖</span>
        <span class="save-label">${isSaved ? 'Enregistré' : 'Enregistrer'}</span>
      </button>
    </div>
    <div class="outfit-post__pieces">
      ${outfit.pieces.map((p) => `<span class="piece-chip">${p}</span>`).join('')}
    </div>
  `;
  const avatarImg = card.querySelector('.outfit-post__avatar');
  avatarImg.addEventListener('error', () => {
    const initialSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" rx="30" fill="#E08D6D"/><text x="50%" y="55%" font-size="26" fill="#fff" text-anchor="middle" font-family="sans-serif">${outfit.author.name.charAt(0).toUpperCase()}</text></svg>`;
    avatarImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(initialSvg)}`;
  });
  const outfitImg = card.querySelector('.outfit-post__img');
  outfitImg.addEventListener('error', () => {
    outfitImg.src = generateOutfitImage(outfit);
  });
  if (outfit.isMine) {
    const deleteBtn = card.querySelector('.outfit-post__delete');
    deleteBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteMyShared(outfit.originalId);
      outfits = outfits.filter((o) => o.id !== outfit.id);
      renderFeed();
    });
  }
  const likeBtn = card.querySelector('.outfit-post__like');
  likeBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleLike(outfit.id, likeBtn);
  });
  const saveBtn = card.querySelector('.outfit-post__save');
  saveBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleSave(outfit.id, saveBtn);
  });
  card.addEventListener('click', () => openDetail(outfit.id));
  return card;
}
function toggleLike(outfitId, likeBtnElement) {
  const wasLiked = likedIds.has(outfitId);
  wasLiked ? likedIds.delete(outfitId) : likedIds.add(outfitId);
  saveIdSet('likes', likedIds);
  const outfit = outfits.find((o) => o.id === outfitId);
  const nowLiked = !wasLiked;
  likeBtnElement.dataset.liked = nowLiked;
  likeBtnElement.querySelector('.icon').textContent = nowLiked ? '♥' : '♡';
  const countEl = likeBtnElement.querySelector('.like-count');
  if (countEl) countEl.textContent = getDisplayedLikes(outfit);
  likeBtnElement.classList.add('is-pulsing');
  setTimeout(() => likeBtnElement.classList.remove('is-pulsing'), 350);
  syncCardAfterAction(outfitId);
}
function toggleSave(outfitId, saveBtnElement) {
  const wasSaved = savedIds.has(outfitId);
  wasSaved ? savedIds.delete(outfitId) : savedIds.add(outfitId);
  saveIdSet('favoris', savedIds);
  const nowSaved = !wasSaved;
  saveBtnElement.dataset.saved = nowSaved;
  saveBtnElement.querySelector('.save-label').textContent = nowSaved ? 'Enregistré' : 'Enregistrer';
  saveBtnElement.classList.add('is-pulsing');
  setTimeout(() => saveBtnElement.classList.remove('is-pulsing'), 350);
  if (detailSaveBtn && openOutfitId === outfitId) {
    detailSaveBtn.textContent = nowSaved ? 'Enregistré ✓' : 'Enregistrer';
  }
}
function syncCardAfterAction(outfitId) {
  const likeBtnInGrid = feedGrid.querySelector(`.outfit-post[data-id="${outfitId}"] .outfit-post__like`);
  if (!likeBtnInGrid) return;
  const outfit = outfits.find((o) => o.id === outfitId);
  const liked = likedIds.has(outfitId);
  likeBtnInGrid.dataset.liked = liked;
  likeBtnInGrid.querySelector('.icon').textContent = liked ? '♥' : '♡';
  likeBtnInGrid.querySelector('.like-count').textContent = getDisplayedLikes(outfit);
}
function openDetail(outfitId) {
  const outfit = outfits.find((o) => o.id === outfitId);
  if (!outfit) return;
  openOutfitId = outfitId;
  detailImage.src = outfit.image || generateOutfitImage(outfit);
  detailImage.onerror = () => { detailImage.src = generateOutfitImage(outfit); };
  detailImage.alt = `Tenue de ${outfit.author.name}`;
  detailAvatar.src = outfit.author.avatar;
  detailAvatar.alt = `Avatar de ${outfit.author.name}`;
  detailAuthorName.textContent = outfit.author.name;
  detailPieces.innerHTML = outfit.pieces.map((p) => `<span class="piece-tag">${p}</span>`).join('');
  const isLiked = likedIds.has(outfitId);
  detailLikeBtn.dataset.liked = isLiked;
  detailLikeBtn.textContent = isLiked ? 'Aimé ♥' : "J'aime ♡";
  const isSaved = savedIds.has(outfitId);
  detailSaveBtn.textContent = isSaved ? 'Enregistré ✓' : 'Enregistrer';
  outfitDetailModal.hidden = false;
}
function closeDetail() {
  outfitDetailModal.hidden = true;
  openOutfitId = null;
}
function handleDetailLikeClick() {
  if (!openOutfitId) return;
  toggleLike(openOutfitId, detailLikeBtn);
  detailLikeBtn.textContent = likedIds.has(openOutfitId) ? 'Aimé ♥' : "J'aime ♡";
}
function handleDetailSaveClick() {
  if (!openOutfitId) return;
  const fakeBtn = { dataset: {}, querySelector: () => ({ textContent: '' }), classList: { add() {}, remove() {} } };
  toggleSave(openOutfitId, fakeBtn);
}
function handleSortClick(event) {
  const clicked = event.target.closest('.chip');
  if (!clicked) return;
  sortChipsContainer.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
  clicked.classList.add('is-active');
  currentSort = clicked.dataset.sort;
  renderFeed();
}
function handleStyleFilterClick(event) {
  const clicked = event.target.closest('.chip');
  if (!clicked) return;
  styleFiltersContainer.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
  clicked.classList.add('is-active');
  currentStyleFilter = clicked.dataset.style;
  renderFeed();
}
document.addEventListener('DOMContentLoaded', () => {
  loadFeed();
  sortChipsContainer.addEventListener('click', handleSortClick);
  styleFiltersContainer.addEventListener('click', handleStyleFilterClick);
  closeDetailModal.addEventListener('click', closeDetail);
  detailLikeBtn.addEventListener('click', handleDetailLikeClick);
  detailSaveBtn.addEventListener('click', handleDetailSaveClick);
  outfitDetailModal.addEventListener('click', (event) => {
    if (event.target === outfitDetailModal) closeDetail();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !outfitDetailModal.hidden) closeDetail();
  });
});
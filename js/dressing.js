const dressingGrid = document.getElementById('dressingGrid');
const itemCount = document.getElementById('itemCount');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');
const seasonFilter = document.getElementById('seasonFilter');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const itemModal = document.getElementById('itemModal');
const closeItemModal = document.getElementById('closeItemModal');
const itemForm = document.getElementById('itemForm');
const modalTitle = document.getElementById('modalTitle');
const itemIdInput = document.getElementById('itemId');
const itemNameInput = document.getElementById('itemName');
const itemCategoryInput = document.getElementById('itemCategory');
const itemColorInput = document.getElementById('itemColor');
const itemImageInput = document.getElementById('itemImage');
const itemImagePreview = document.getElementById('itemImagePreview');
const confirmDeleteModal = document.getElementById('confirmDeleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const itemFormError = document.getElementById('itemFormError');

const CATEGORY_LABELS = { haut: 'Haut', bas: 'Bas', chaussures: 'Chaussures', accessoire: 'Accessoire' };

let items = [];
let currentFilters = { category: 'all', season: 'all', search: '' };
let currentImageData = null;
let pendingDeleteId = null;

function getStorageKey() {
  const currentUser = localStorage.getItem('currentUser') || 'guest';
  return `dressing_${currentUser}`;
}

function loadItems() {
  const raw = localStorage.getItem(getStorageKey());
  return raw ? JSON.parse(raw) : [];
}

function saveItems() {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(items));
    return true;
  } catch (error) {
    console.error('Erreur localStorage :', error);
    return false;
  }
}

function showFormError(message) {
  if (!itemFormError) return;
  itemFormError.textContent = message;
  itemFormError.hidden = false;
}

function hideFormError() {
  if (!itemFormError) return;
  itemFormError.hidden = true;
}

function getFilteredItems() {
  return items.filter((item) => {
    const seasons = item.seasons || [];
    const name = item.name || '';
    const matchCategory = currentFilters.category === 'all' || item.category === currentFilters.category;
    const matchSeason = currentFilters.season === 'all' || seasons.includes(currentFilters.season);
    const matchSearch = name.toLowerCase().includes(currentFilters.search.toLowerCase());
    return matchCategory && matchSeason && matchSearch;
  });
}

function renderGrid() {
  const filtered = getFilteredItems();
  dressingGrid.innerHTML = '';
  filtered.forEach((item) => dressingGrid.appendChild(createCardElement(item)));

  if (items.length === 0) {
    emptyState.textContent = "Ton dressing est vide pour l'instant. Ajoute ta première pièce !";
    emptyState.hidden = false;
  } else if (filtered.length === 0) {
    emptyState.textContent = 'Aucun vêtement ne correspond à ta recherche.';
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }
  updateItemCount();
}

function updateItemCount() {
  const total = items.length;
  itemCount.textContent = total <= 1 ? `${total} pièce` : `${total} pièces`;
}

function createCardElement(item) {
  const card = document.createElement('article');
  card.className = 'clothing-card';
  card.dataset.id = item.id;
  const seasons = item.seasons || [];
  const seasonsLabel = seasons.length ? seasons.join(', ') : 'Toute saison';
  card.innerHTML = `
    <div class="clothing-card__img-wrap">
      <img class="clothing-card__img" src="${item.image}" alt="${item.name}">
      <span class="clothing-card__tag">${CATEGORY_LABELS[item.category] || item.category}</span>
      <div class="clothing-card__actions">
        <button class="clothing-card__edit" type="button" aria-label="Modifier">✎</button>
        <button class="clothing-card__delete" type="button" aria-label="Supprimer">✕</button>
      </div>
    </div>
    <p class="clothing-card__name">${item.name}</p>
    <p class="clothing-card__meta">${item.color || 'Couleur non précisée'} · ${seasonsLabel}</p>
  `;
  card.querySelector('.clothing-card__edit').addEventListener('click', () => openEditModal(item.id));
  card.querySelector('.clothing-card__delete').addEventListener('click', () => openConfirmDelete(item.id));
  return card;
}

function getPlaceholderImage(category) {
  const emojis = { haut: '👕', bas: '👖', chaussures: '👟', accessoire: '👜' };
  const emoji = emojis[category] || '🧥';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#F1E9E0" /><text x="50%" y="50%" font-size="90" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function compressImage(dataUrl, callback) {
  const img = new Image();
  img.onload = () => {
    const maxSize = 350;
    let width = img.width;
    let height = img.height;
    if (width > height && width > maxSize) {
      height = Math.round(height * (maxSize / width));
      width = maxSize;
    } else if (height > maxSize) {
      width = Math.round(width * (maxSize / height));
      height = maxSize;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    callback(canvas.toDataURL('image/jpeg', 0.55));
  };
  img.src = dataUrl;
}

function openAddModal() {
  itemForm.reset();
  itemIdInput.value = '';
  currentImageData = null;
  itemImagePreview.hidden = true;
  hideFormError();
  modalTitle.textContent = 'Ajouter un vêtement';
  itemModal.hidden = false;
}

function openEditModal(id) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  itemForm.reset();
  hideFormError();
  modalTitle.textContent = 'Modifier ce vêtement';
  itemIdInput.value = item.id;
  itemNameInput.value = item.name;
  itemCategoryInput.value = item.category;
  itemColorInput.value = item.color;
  const seasons = item.seasons || [];
  document.querySelectorAll('input[name="itemSeason"]').forEach((checkbox) => {
    checkbox.checked = seasons.includes(checkbox.value);
  });
  currentImageData = item.image;
  itemImagePreview.src = item.image;
  itemImagePreview.hidden = false;
  itemModal.hidden = false;
}

function closeModal() {
  itemModal.hidden = true;
  itemForm.reset();
  currentImageData = null;
}

function handleImageChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    compressImage(reader.result, (compressedDataUrl) => {
      currentImageData = compressedDataUrl;
      itemImagePreview.src = compressedDataUrl;
      itemImagePreview.hidden = false;
    });
  };
  reader.readAsDataURL(file);
}

function handleFormSubmit(event) {
  event.preventDefault();
  hideFormError();

  const selectedSeasons = Array.from(document.querySelectorAll('input[name="itemSeason"]:checked')).map((c) => c.value);
  const category = itemCategoryInput.value;
  const itemData = {
    name: itemNameInput.value.trim(),
    category: category,
    color: itemColorInput.value.trim(),
    seasons: selectedSeasons,
    image: currentImageData || getPlaceholderImage(category),
  };
  const existingId = itemIdInput.value;
  const backupItems = items.slice();

  if (existingId) {
    const index = items.findIndex((i) => i.id === existingId);
    if (index !== -1) items[index] = { ...items[index], ...itemData };
  } else {
    items.push({ id: crypto.randomUUID(), dateAdded: new Date().toISOString(), ...itemData });
  }

  const saved = saveItems();
  if (!saved) {
    items = backupItems;
    showFormError("Impossible d'enregistrer : stockage plein. Supprime un vêtement existant, puis réessaie.");
    return;
  }

  renderGrid();
  closeModal();
}

function openConfirmDelete(id) {
  pendingDeleteId = id;
  confirmDeleteModal.hidden = false;
}

function closeConfirmDelete() {
  pendingDeleteId = null;
  confirmDeleteModal.hidden = true;
}

function confirmDelete() {
  items = items.filter((item) => item.id !== pendingDeleteId);
  saveItems();
  renderGrid();
  closeConfirmDelete();
}

function handleSearchInput(event) {
  currentFilters.search = event.target.value;
  renderGrid();
}

function handleCategoryFilterClick(event) {
  const clickedChip = event.target.closest('.chip');
  if (!clickedChip) return;
  document.querySelectorAll('#categoryFilters .chip').forEach((chip) => chip.classList.remove('is-active'));
  clickedChip.classList.add('is-active');
  currentFilters.category = clickedChip.dataset.category;
  renderGrid();
}

function handleSeasonFilterChange(event) {
  currentFilters.season = event.target.value;
  renderGrid();
}

document.addEventListener('DOMContentLoaded', () => {
  items = loadItems();
  renderGrid();
  openAddModalBtn.addEventListener('click', openAddModal);
  closeItemModal.addEventListener('click', closeModal);
  itemForm.addEventListener('submit', handleFormSubmit);
  itemImageInput.addEventListener('change', handleImageChange);
  searchInput.addEventListener('input', handleSearchInput);
  categoryFilters.addEventListener('click', handleCategoryFilterClick);
  seasonFilter.addEventListener('change', handleSeasonFilterChange);
  confirmDeleteBtn.addEventListener('click', confirmDelete);
  cancelDeleteBtn.addEventListener('click', closeConfirmDelete);
  itemModal.addEventListener('click', (e) => { if (e.target === itemModal) closeModal(); });
  confirmDeleteModal.addEventListener('click', (e) => { if (e.target === confirmDeleteModal) closeConfirmDelete(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!itemModal.hidden) closeModal();
      if (!confirmDeleteModal.hidden) closeConfirmDelete();
    }
  });
});
document.addEventListener('DOMContentLoaded', () => {
  initActiveLink();
  initHamburgerMenu();
  initThemeSwitcher();
  loadSavedTheme();
  initLogout();
  initAuthDisplay();
});

function initActiveLink() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;
  document.querySelectorAll('.nav-link').forEach((link) => {
    if (link.dataset.page === currentPage) link.classList.add('is-active');
  });
  positionIndicator();
  window.addEventListener('resize', positionIndicator);
}

function positionIndicator() {
  const indicator = document.getElementById('navIndicator');
  const activeDesktopLink = document.querySelector('.navbar__links .nav-link.is-active');
  if (!indicator || !activeDesktopLink) return;
  indicator.style.width = `${activeDesktopLink.offsetWidth}px`;
  indicator.style.transform = `translateX(${activeDesktopLink.offsetLeft}px)`;
}

function initHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');
  if (!hamburgerBtn || !mobileMenu || !mobileOverlay) return;

  hamburgerBtn.addEventListener('click', () => {
    mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
  });
  mobileOverlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  function openMenu() {
    mobileMenu.classList.add('is-open');
    hamburgerBtn.classList.add('is-open');
    mobileOverlay.hidden = false;
    hamburgerBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    mobileMenu.classList.remove('is-open');
    hamburgerBtn.classList.remove('is-open');
    mobileOverlay.hidden = true;
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  }
}

function initThemeSwitcher() {
  document.querySelectorAll('.theme-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      applyTheme(dot.dataset.theme);
      localStorage.setItem('theme', dot.dataset.theme);
    });
  });
}

function applyTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  document.querySelectorAll('.theme-dot').forEach((dot) => {
    dot.classList.toggle('is-active', dot.dataset.theme === themeName);
  });
}

function loadSavedTheme() {
  applyTheme(localStorage.getItem('theme') || 'light');
}

function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
    });
  }
  initUserMenuToggle();
}

// Ouvre/ferme le menu déroulant (avatar) au clic, et le ferme si on clique ailleurs.
function initUserMenuToggle() {
  const trigger = document.getElementById('userMenuTrigger');
  const dropdown = document.getElementById('userDropdown');
  if (!trigger || !dropdown) return;

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
  });

  document.addEventListener('click', (event) => {
    if (!dropdown.hidden && !dropdown.contains(event.target) && event.target !== trigger) {
      dropdown.hidden = true;
    }
  });
}

function initAuthDisplay() {
  const loginNavLink = document.getElementById('loginNavLink');
  const mobileLoginLink = document.getElementById('mobileLoginLink');
  const userMenu = document.getElementById('userMenu');
  const mobileLogoutLink = document.getElementById('mobileLogoutLink');
  const userDropdown = document.getElementById('userDropdown');
  const logoutBtn = document.getElementById('logoutBtn');

  const currentUser = localStorage.getItem('currentUser');
  const isLoggedIn = !!currentUser;

  if (loginNavLink) loginNavLink.hidden = isLoggedIn;
  if (mobileLoginLink) mobileLoginLink.hidden = isLoggedIn;
  if (userMenu) userMenu.hidden = !isLoggedIn;
  if (mobileLogoutLink) mobileLogoutLink.hidden = !isLoggedIn;

  if (userDropdown && logoutBtn) {
    let usernameLabel = document.getElementById('currentUserLabel');
    if (isLoggedIn) {
      if (!usernameLabel) {
        usernameLabel = document.createElement('p');
        usernameLabel.id = 'currentUserLabel';
        usernameLabel.style.cssText = 'font-size:0.8rem;font-weight:700;margin:0 0 0.4rem;padding:0 0.2rem;';
        userDropdown.insertBefore(usernameLabel, logoutBtn);
      }
      usernameLabel.textContent = currentUser;
    } else if (usernameLabel) {
      usernameLabel.remove();
    }
  }
}
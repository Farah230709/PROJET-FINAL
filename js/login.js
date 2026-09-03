function loadUsers() {
  const raw = localStorage.getItem('users');
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function showError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
}

function hideError(element) {
  if (!element) return;
  element.hidden = true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

let selectedStyles = [];

document.addEventListener('DOMContentLoaded', () => {
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');
  const styleChips = document.getElementById('styleChips');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');

  function switchTab(tabName) {
    const isLogin = tabName === 'login';
    if (tabLogin) tabLogin.classList.toggle('is-active', isLogin);
    if (tabRegister) tabRegister.classList.toggle('is-active', !isLogin);
    if (loginForm) loginForm.hidden = !isLogin;
    if (registerForm) registerForm.hidden = isLogin;
    hideError(loginError);
    hideError(registerError);
  }

  if (tabLogin) tabLogin.addEventListener('click', () => switchTab('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchTab('register'));
  if (switchToRegister) {
    switchToRegister.addEventListener('click', (event) => {
      event.preventDefault();
      switchTab('register');
    });
  }
  if (switchToLogin) {
    switchToLogin.addEventListener('click', (event) => {
      event.preventDefault();
      switchTab('login');
    });
  }

  if (styleChips) {
    styleChips.addEventListener('click', (event) => {
      const clicked = event.target.closest('.chip');
      if (!clicked) return;
      clicked.classList.toggle('is-active');
      const style = clicked.dataset.style;
      if (selectedStyles.includes(style)) {
        selectedStyles = selectedStyles.filter((s) => s !== style);
      } else {
        selectedStyles.push(style);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      hideError(loginError);

      const identifier = document.getElementById('loginIdentifier').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;

      const users = loadUsers();
      const matchedUser = users.find(
        (user) =>
          user.username.toLowerCase() === identifier ||
          user.email.toLowerCase() === identifier
      );

      if (!matchedUser || matchedUser.password !== password) {
        showError(loginError, 'Identifiant ou mot de passe incorrect.');
        return;
      }

      localStorage.setItem('currentUser', matchedUser.username);
      window.location.href = 'home.html';
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      hideError(registerError);

      const username = document.getElementById('registerPseudo').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;
      const confirm = document.getElementById('registerConfirm').value;

      if (!username || !email || !password || !confirm) {
        showError(registerError, 'Merci de remplir tous les champs obligatoires.');
        return;
      }
      if (!isValidEmail(email)) {
        showError(registerError, 'Cette adresse email ne semble pas valide.');
        return;
      }
      if (password.length < 6) {
        showError(registerError, 'Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }
      if (password !== confirm) {
        showError(registerError, 'Les deux mots de passe ne correspondent pas.');
        return;
      }

      const users = loadUsers();
      const alreadyExists = users.some(
        (user) =>
          user.email.toLowerCase() === email.toLowerCase() ||
          user.username.toLowerCase() === username.toLowerCase()
      );

      if (alreadyExists) {
        showError(registerError, 'Ce pseudo ou cet email est déjà utilisé.');
        return;
      }

      users.push({ username, email, password, styles: selectedStyles });
      saveUsers(users);

      localStorage.setItem('currentUser', username);
      window.location.href = 'home.html';
    });
  }
});
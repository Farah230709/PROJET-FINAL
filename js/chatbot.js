const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const quickReplies = document.getElementById('quickReplies');
const clearChatBtn = document.getElementById('clearChatBtn');

function getUser() {
  return localStorage.getItem('currentUser') || 'guest';
}

function loadDressing() {
  const raw = localStorage.getItem(`dressing_${getUser()}`);
  return raw ? JSON.parse(raw) : [];
}

function loadHistory() {
  const raw = localStorage.getItem(`chatHistory_${getUser()}`);
  return raw ? JSON.parse(raw) : [];
}

function saveHistory(history) {
  localStorage.setItem(`chatHistory_${getUser()}`, JSON.stringify(history));
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Nettoie le texte : minuscules + retire les accents, pour mieux reconnaître
// les messages même écrits vite ou sans accents.
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function suggestOutfitText() {
  const dressing = loadDressing();
  const hauts = dressing.filter((i) => i.category === 'haut');
  const bas = dressing.filter((i) => i.category === 'bas');
  const chaussures = dressing.filter((i) => i.category === 'chaussures');

  if (!hauts.length || !bas.length || !chaussures.length) {
    return "Je n'ai pas encore assez de pièces dans ton dressing pour te proposer une vraie combinaison. Ajoute quelques vêtements sur la page Dressing !";
  }

  const haut = pickRandom(hauts);
  const b = pickRandom(bas);
  const chaussure = pickRandom(chaussures);
  return `Je te propose : ton ${haut.name.toLowerCase()} avec ${b.name.toLowerCase()} et ${chaussure.name.toLowerCase()}.`;
}

// Liste de règles élargie : plusieurs mots-clés/synonymes par thème,
// pour reconnaître plus de formulations différentes.
const RULES = [
  { keywords: ['entretien', 'job', 'travail', 'boulot', 'bureau'], response: () => `Pour ça, mieux vaut rester sobre et soigné(e). ${suggestOutfitText()}` },
  { keywords: ['soiree', 'soir', 'fete', 'sortir', 'boite'], response: () => `Pour une soirée, on peut oser un peu plus. ${suggestOutfitText()}` },
  { keywords: ['rdv', 'rendez-vous', 'rencard', 'date', 'amoureux'], response: () => `Pour un rendez-vous, quelque chose de soigné mais pas trop habillé. ${suggestOutfitText()}` },
  { keywords: ['mariage', 'cérémonie', 'ceremonie'], response: () => 'Pour un mariage, privilégie une tenue élégante, évite le blanc total, et pense au confort si la journée est longue.' },
  { keywords: ['chaud', 'canicule', 'ete'], response: () => 'Par temps chaud, privilégie des matières légères (coton, lin) et des couleurs claires.' },
  { keywords: ['froid', 'hiver', 'neige'], response: () => 'Par temps froid, pense aux superpositions : pull chaud, veste, et chaussures fermées.' },
  { keywords: ['pluie', 'pleut'], response: () => "S'il pleut, une veste imperméable et des chaussures fermées sont indispensables." },
  { keywords: ['casual', 'decontracte', 'cool', 'confortable', 'ecole', 'cours'], response: () => `Pour un look décontracté : ${suggestOutfitText()}` },
  { keywords: ['sport', 'gym', 'courir', 'running'], response: () => 'Pour le sport, mise sur des matières respirantes et des chaussures adaptées à ton activité.' },
  { keywords: ['jean', 'denim'], response: () => 'Un jean se marie avec presque tout : t-shirt simple pour un look décontracté, chemise pour un rendu plus soigné.' },
  { keywords: ['couleur', 'noir'], response: () => 'Le noir se marie avec presque tout. Pour un effet chic : blanc, beige, doré. Pour un effet vif : rouge, jaune moutarde.' },
  { keywords: ['tenue', 'porter', 'habiller', 'mettre', 'quoi mettre', 'idee'], response: () => suggestOutfitText() },
  { keywords: ['bonjour', 'salut', 'coucou', 'hello'], response: () => 'Salut ! Dis-moi une occasion, la météo, ou un style, et je te fais une suggestion.' },
  { keywords: ['merci'], response: () => "Avec plaisir ! N'hésite pas si tu veux une autre idée." },
];

const DEFAULT_RESPONSES = [
  "Je ne suis pas encore sûr de comprendre. Essaie de me parler d'une occasion, de la météo, ou d'un style comme casual ou chic.",
  "Reformule peut-être ? Je peux t'aider sur : une occasion, la météo, une couleur, ou un vêtement précis.",
];

function getBotResponse(userText) {
  const text = normalize(userText);
  const matchedRule = RULES.find((rule) =>
    rule.keywords.some((keyword) => text.includes(normalize(keyword)))
  );
  if (matchedRule) return matchedRule.response();
  return pickRandom(DEFAULT_RESPONSES);
}

// Construction des bulles avec createElement (pas d'innerHTML)
function createBubble(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-bubble--${role}`;

  const avatar = document.createElement('span');
  avatar.className = 'chat-bubble__avatar';
  avatar.textContent = role === 'bot' ? '👗' : '🙂';

  const content = document.createElement('span');
  content.className = 'chat-bubble__content';
  content.textContent = text;

  bubble.appendChild(avatar);
  bubble.appendChild(content);
  return bubble;
}

function addMessage(role, text) {
  chatWindow.appendChild(createBubble(role, text));
  scrollToBottom();
}

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTypingIndicator() {
  const typing = document.createElement('div');
  typing.className = 'chat-bubble chat-bubble--bot chat-bubble--typing';
  typing.id = 'typingIndicator';

  const avatar = document.createElement('span');
  avatar.className = 'chat-bubble__avatar';
  avatar.textContent = '👗';

  const content = document.createElement('span');
  content.className = 'chat-bubble__content';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    content.appendChild(dot);
  }

  typing.appendChild(avatar);
  typing.appendChild(content);
  chatWindow.appendChild(typing);
  scrollToBottom();
}

function removeTypingIndicator() {
  const typing = document.getElementById('typingIndicator');
  if (typing) typing.remove();
}

function renderHistory() {
  const history = loadHistory();
  chatWindow.textContent = '';

  if (history.length === 0) {
    const greeting = 'Bonjour ! Je suis ton styliste. Demande-moi une idée de tenue, un conseil météo, ou clique sur une suggestion ci-dessous.';
    addMessage('bot', greeting);
    saveHistory([{ role: 'bot', text: greeting }]);
    return;
  }

  history.forEach((message) => addMessage(message.role, message.text));
}

function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const history = loadHistory();
  history.push({ role: 'user', text: trimmed });
  addMessage('user', trimmed);
  saveHistory(history);

  chatInput.value = '';
  showTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator();
    const response = getBotResponse(trimmed);
    const updatedHistory = loadHistory();
    updatedHistory.push({ role: 'bot', text: response });
    addMessage('bot', response);
    saveHistory(updatedHistory);
  }, 700);
}

function handleFormSubmit(event) {
  event.preventDefault();
  sendMessage(chatInput.value);
}

function handleQuickReplyClick(event) {
  const clicked = event.target.closest('.chip');
  if (!clicked) return;
  sendMessage(clicked.dataset.message);
}

function handleClearChat() {
  localStorage.removeItem(`chatHistory_${getUser()}`);
  renderHistory();
}

document.addEventListener('DOMContentLoaded', () => {
  renderHistory();
  chatForm.addEventListener('submit', handleFormSubmit);
  quickReplies.addEventListener('click', handleQuickReplyClick);
  clearChatBtn.addEventListener('click', handleClearChat);
});
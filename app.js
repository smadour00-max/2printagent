/* ============================================================
   NEXUS CRÉATIF — Application JavaScript
   ============================================================ */

'use strict';

// ── ÉTAT DE L'APPLICATION ──────────────────────────────────
const STATE = {
  mode: 'branding',
  conversationId: generateId(),
  isLoading: false,
  totalTokens: 0,
  pendingImage: null,
  pendingImageType: null,
  pendingImageName: null,
  hasStartedConversation: false,
};

// ── CONFIGURATION DES MODES ────────────────────────────────
const MODES = {
  branding: {
    label: 'Identité & Branding',
    icon: '◈',
    prompts: [
      { title: 'Identité complète', desc: 'Créer une charte graphique pour une marque de cosmétiques naturels' },
      { title: 'Logo conceptuel', desc: 'Concevoir un logo pour une agence d\'architecture contemporaine' },
      { title: 'Palette chromatique', desc: 'Définir la palette couleurs d\'une marque premium de café' },
      { title: 'Typographie & usage', desc: 'Recommander un système typographique pour une revue culturelle' },
    ]
  },
  packaging: {
    label: 'Packaging & Labels',
    icon: '⬡',
    prompts: [
      { title: 'Étiquette vin', desc: 'Concevoir une étiquette élégante pour un Bordeaux Grand Cru' },
      { title: 'Packaging bio', desc: 'Créer un packaging pour une gamme de produits bio artisanaux' },
      { title: 'Boîte cadeau', desc: 'Designing a luxury gift box for a Swiss watchmaker' },
      { title: 'Label cosmétique', desc: 'Étiquette haut de gamme pour une crème anti-âge au sérum d\'or' },
    ]
  },
  photographie: {
    label: 'Direction Photo',
    icon: '◎',
    prompts: [
      { title: 'Portrait studio', desc: 'Direction photo pour un portrait exécutif en lumière Rembrandt' },
      { title: 'Packshot produit', desc: 'Prompt détaillé pour un packshot de parfum en lumière rasante' },
      { title: 'Ambiance lifestyle', desc: 'Scène lifestyle pour une marque de maison de luxe scandinave' },
      { title: 'Photo culinaire', desc: 'Composition et éclairage pour une photo gastronomique en flat lay' },
    ]
  },
  analyse: {
    label: 'Analyse & Itération',
    icon: '◉',
    prompts: [
      { title: 'Analyse logo', desc: 'Analyser et moderniser mon logo en joignant l\'image ci-dessous' },
      { title: 'Critique packaging', desc: 'Évaluer la hiérarchie visuelle de cette étiquette produit' },
      { title: 'Extraction palette', desc: 'Extraire les codes HEX exacts de cette identité visuelle' },
      { title: 'Rénovation identité', desc: 'Proposer une modernisation de cette charte graphique' },
    ]
  },
  concept: {
    label: 'Concepts Créatifs',
    icon: '✧',
    prompts: [
      { title: 'Moodboard textuel', desc: 'Créer un moodboard pour une marque de mode éthique et parisienne' },
      { title: 'Direction artistique', desc: 'Concept DA pour une campagne publicitaire d\'une eau de parfum' },
      { title: 'Storytelling marque', desc: 'Développer le storytelling d\'une startup fintech nouvelle génération' },
      { title: 'Univers visuel', desc: 'Définir l\'univers sémantique et symbolique d\'un hôtel boutique' },
    ]
  },
};

// ── ÉLÉMENTS DOM ───────────────────────────────────────────
const DOM = {
  sidebar:        document.getElementById('sidebar'),
  btnToggle:      document.getElementById('btn-toggle-sidebar'),
  navBtns:        document.querySelectorAll('.nav-btn[data-mode]'),
  topbarIcon:     document.getElementById('topbar-mode-icon'),
  topbarLabel:    document.getElementById('topbar-mode-label'),
  welcomeScreen:  document.getElementById('welcome-screen'),
  conversation:   document.getElementById('conversation'),
  messages:       document.getElementById('messages'),
  userInput:      document.getElementById('user-input'),
  btnSend:        document.getElementById('btn-send'),
  fileUpload:     document.getElementById('file-upload'),
  imgPreviewBar:  document.getElementById('image-preview-bar'),
  imgThumb:       document.getElementById('image-thumb'),
  imgName:        document.getElementById('image-preview-name'),
  btnRemoveImg:   document.getElementById('btn-remove-image'),
  tokensCount:    document.getElementById('tokens-count'),
  quickPrompts:   document.getElementById('quick-prompts'),
  btnExport:      document.getElementById('btn-export'),
  btnClear:       document.getElementById('btn-clear'),
};

// ── INIT ───────────────────────────────────────────────────
function init() {
  renderQuickPrompts();
  bindEvents();
  adjustTextareaHeight();
}

// ── ÉVÉNEMENTS ─────────────────────────────────────────────
function bindEvents() {
  // Sidebar toggle
  DOM.btnToggle.addEventListener('click', toggleSidebar);

  // Mode navigation
  DOM.navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  });

  // Envoi message
  DOM.btnSend.addEventListener('click', sendMessage);
  DOM.userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  DOM.userInput.addEventListener('input', adjustTextareaHeight);

  // Upload image
  DOM.fileUpload.addEventListener('change', handleFileUpload);

  // Retirer image
  DOM.btnRemoveImg.addEventListener('click', clearPendingImage);

  // Export
  DOM.btnExport.addEventListener('click', exportConversation);

  // Clear history
  DOM.btnClear.addEventListener('click', clearHistory);

  // Fermer sidebar sur mobile en cliquant hors
  document.addEventListener('click', e => {
    if (window.innerWidth <= 768) {
      if (!DOM.sidebar.contains(e.target) && !DOM.btnToggle.contains(e.target)) {
        DOM.sidebar.classList.remove('mobile-open');
      }
    }
  });
}

// ── SIDEBAR ────────────────────────────────────────────────
function toggleSidebar() {
  if (window.innerWidth <= 768) {
    DOM.sidebar.classList.toggle('mobile-open');
  } else {
    DOM.sidebar.classList.toggle('collapsed');
  }
}

// ── MODE ───────────────────────────────────────────────────
function switchMode(mode) {
  STATE.mode = mode;
  STATE.conversationId = generateId();
  STATE.hasStartedConversation = false;

  // Mise à jour UI nav
  DOM.navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));

  // Mise à jour topbar
  const m = MODES[mode];
  DOM.topbarIcon.textContent  = m.icon;
  DOM.topbarLabel.textContent = m.label;

  // Reset conversation
  DOM.messages.innerHTML = '';
  showWelcome();
  renderQuickPrompts();

  // Fermer sidebar mobile
  if (window.innerWidth <= 768) DOM.sidebar.classList.remove('mobile-open');
}

function showWelcome() {
  DOM.welcomeScreen.style.display = 'flex';
  DOM.conversation.style.display  = 'none';
}

function showConversation() {
  DOM.welcomeScreen.style.display = 'none';
  DOM.conversation.style.display  = 'flex';
}

// ── QUICK PROMPTS ──────────────────────────────────────────
function renderQuickPrompts() {
  const prompts = MODES[STATE.mode].prompts;
  DOM.quickPrompts.innerHTML = prompts.map(p => `
    <div class="quick-prompt-card" data-prompt="${escHtml(p.desc)}">
      <strong>${escHtml(p.title)}</strong>
      <span>${escHtml(p.desc)}</span>
    </div>
  `).join('');

  DOM.quickPrompts.querySelectorAll('.quick-prompt-card').forEach(card => {
    card.addEventListener('click', () => {
      DOM.userInput.value = card.dataset.prompt;
      adjustTextareaHeight();
      DOM.userInput.focus();
    });
  });
}

// ── UPLOAD IMAGE ───────────────────────────────────────────
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 20 * 1024 * 1024) {
    showToast('Fichier trop volumineux (max 20 Mo)');
    return;
  }

  const reader = new FileReader();
  reader.onload = ev => {
    const b64 = ev.target.result.split(',')[1];
    STATE.pendingImage     = b64;
    STATE.pendingImageType = file.type;
    STATE.pendingImageName = file.name;

    DOM.imgThumb.src                = ev.target.result;
    DOM.imgName.textContent         = file.name;
    DOM.imgPreviewBar.style.display = 'flex';
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function clearPendingImage() {
  STATE.pendingImage     = null;
  STATE.pendingImageType = null;
  STATE.pendingImageName = null;
  DOM.imgPreviewBar.style.display = 'none';
  DOM.imgThumb.src = '';
}

// ── SEND MESSAGE ───────────────────────────────────────────
async function sendMessage() {
  const text = DOM.userInput.value.trim();
  if (!text || STATE.isLoading) return;

  if (!STATE.hasStartedConversation) {
    STATE.hasStartedConversation = true;
    showConversation();
  }

  // Afficher message user
  appendUserMessage(text, STATE.pendingImage ? DOM.imgThumb.src : null);

  // Copier l'image avant de reset
  const imgBase64  = STATE.pendingImage;
  const imgType    = STATE.pendingImageType;

  // Reset input
  DOM.userInput.value = '';
  adjustTextareaHeight();
  if (STATE.pendingImage) clearPendingImage();

  // Typing indicator
  const typingId = appendTypingIndicator();

  // Bloquer l'UI
  setLoading(true);

  try {
    const formData = new FormData();
    formData.append('action', 'chat');
    formData.append('message', text);
    formData.append('mode', STATE.mode);
    formData.append('conversation_id', STATE.conversationId);
    if (imgBase64) {
      formData.append('image', imgBase64);
      formData.append('image_type', imgType);
    }

    const res = await fetch(window.location.href, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: formData,
    });

    const data = await res.json();

    removeTypingIndicator(typingId);

    if (data.error) {
      appendErrorMessage(data.error);
    } else {
      appendAssistantMessage(data.message);
      STATE.totalTokens += data.tokens || 0;
      DOM.tokensCount.textContent = STATE.totalTokens.toLocaleString('fr');
      STATE.conversationId = data.conversation_id || STATE.conversationId;
    }
  } catch (err) {
    removeTypingIndicator(typingId);
    appendErrorMessage('Erreur de connexion. Vérifiez que Laragon est démarré et rechargez la page.');
  }

  setLoading(false);
  scrollToBottom();
}

// ── MESSAGES ───────────────────────────────────────────────
function appendUserMessage(text, imageSrc) {
  const time = now();
  const el   = document.createElement('div');
  el.className = 'msg user';
  el.innerHTML = `
    <div class="msg-avatar">V</div>
    <div class="msg-body">
      <div class="msg-header">
        <span class="msg-name">Vous</span>
        <span class="msg-time">${time}</span>
      </div>
      ${imageSrc ? `<img class="msg-image" src="${imageSrc}" alt="Image jointe">` : ''}
      <div class="msg-content">${escHtml(text).replace(/\n/g, '<br>')}</div>
    </div>
  `;
  DOM.messages.appendChild(el);
  scrollToBottom();
}

function appendAssistantMessage(markdownText) {
  const time = now();
  const el   = document.createElement('div');
  el.className = 'msg assistant';

  const html = typeof marked !== 'undefined'
    ? marked.parse(markdownText)
    : escHtml(markdownText).replace(/\n/g, '<br>');

  el.innerHTML = `
    <div class="msg-avatar">✦</div>
    <div class="msg-body">
      <div class="msg-header">
        <span class="msg-name">Nexus Créatif</span>
        <span class="msg-time">${time}</span>
      </div>
      <div class="msg-content">${html}</div>
      <div class="msg-actions">
        <button class="msg-action-btn" onclick="copyMsg(this)">Copier</button>
        <button class="msg-action-btn" onclick="downloadMsg(this)">Télécharger</button>
      </div>
    </div>
  `;
  DOM.messages.appendChild(el);
  scrollToBottom();
}

function appendErrorMessage(errText) {
  const el = document.createElement('div');
  el.className = 'msg assistant';
  el.innerHTML = `
    <div class="msg-avatar" style="background:#c0392b;color:#fff">!</div>
    <div class="msg-body">
      <div class="msg-header"><span class="msg-name" style="color:#c0392b">Erreur</span></div>
      <div class="msg-content" style="border-color:#f5c6c6;background:#fff8f7;color:#c0392b">
        ${escHtml(errText)}
      </div>
    </div>
  `;
  DOM.messages.appendChild(el);
  scrollToBottom();
}

function appendTypingIndicator() {
  const id = 'typing-' + generateId();
  const el = document.createElement('div');
  el.className = 'msg assistant';
  el.id = id;
  el.innerHTML = `
    <div class="msg-avatar">✦</div>
    <div class="msg-body">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  DOM.messages.appendChild(el);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ── ACTIONS MESSAGES ───────────────────────────────────────
function copyMsg(btn) {
  const content = btn.closest('.msg-body').querySelector('.msg-content');
  navigator.clipboard.writeText(content.innerText).then(() => showToast('Copié !'));
}

function downloadMsg(btn) {
  const content = btn.closest('.msg-body').querySelector('.msg-content');
  const blob = new Blob([content.innerText], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `nexus-creatif-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── EXPORT ─────────────────────────────────────────────────
function exportConversation() {
  const msgs = DOM.messages.querySelectorAll('.msg');
  if (!msgs.length) { showToast('Aucune conversation à exporter'); return; }

  let content = `NEXUS CRÉATIF — Export Conversation\n`;
  content += `Mode : ${MODES[STATE.mode].label}\n`;
  content += `Date : ${new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })}\n`;
  content += `${'─'.repeat(60)}\n\n`;

  msgs.forEach(msg => {
    const name    = msg.querySelector('.msg-name')?.textContent || '';
    const msgText = msg.querySelector('.msg-content')?.innerText || '';
    const time    = msg.querySelector('.msg-time')?.textContent || '';
    content += `[${time}] ${name.toUpperCase()}\n${msgText}\n\n${'─'.repeat(40)}\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `nexus-creatif-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Conversation exportée');
}

// ── CLEAR HISTORY ──────────────────────────────────────────
async function clearHistory() {
  if (!confirm('Effacer tout l\'historique de conversation ?')) return;

  try {
    const formData = new FormData();
    formData.append('action', 'clear_history');
    await fetch(window.location.href, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: formData,
    });
  } catch(_) {}

  DOM.messages.innerHTML = '';
  STATE.conversationId   = generateId();
  STATE.totalTokens      = 0;
  STATE.hasStartedConversation = false;
  DOM.tokensCount.textContent  = '0';
  showWelcome();
  showToast('Historique effacé');
}

// ── HELPERS ────────────────────────────────────────────────
function setLoading(val) {
  STATE.isLoading = val;
  DOM.btnSend.disabled     = val;
  DOM.userInput.disabled   = val;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    const c = DOM.conversation;
    c.scrollTop = c.scrollHeight;
  });
}

function adjustTextareaHeight() {
  const ta = DOM.userInput;
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
}

function now() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── DÉMARRAGE ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

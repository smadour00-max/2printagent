<?php
// ============================================================
// NEXUS CRÉATIF — Configuration
// ============================================================
session_start();

// Charger la config depuis config.php
$config = require_once __DIR__ . '/config.php';

// Initialiser l'historique de conversation
if (!isset($_SESSION['conversations'])) {
    $_SESSION['conversations'] = [];
}
if (!isset($_SESSION['current_project'])) {
    $_SESSION['current_project'] = null;
}

// Traitement des requêtes AJAX
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
    header('Content-Type: application/json');
    $action = $_POST['action'] ?? '';

    if ($action === 'chat') {
        $userMessage  = trim($_POST['message'] ?? '');
        $mode         = $_POST['mode'] ?? 'branding';
        $imageBase64  = $_POST['image'] ?? null;
        $imageType    = $_POST['image_type'] ?? 'image/jpeg';
        $conversationId = $_POST['conversation_id'] ?? uniqid('conv_');

        if (empty($userMessage)) {
            echo json_encode(['error' => 'Message vide']);
            exit;
        }

        // Construire la réponse Mistral
        $response = callMistral($userMessage, $mode, $imageBase64, $imageType, $conversationId, $config);
        echo json_encode($response);
        exit;
    }

    if ($action === 'clear_history') {
        $_SESSION['conversations'] = [];
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'save_project') {
        $project = json_decode($_POST['project'] ?? '{}', true);
        $_SESSION['current_project'] = $project;
        echo json_encode(['success' => true]);
        exit;
    }

    echo json_encode(['error' => 'Action inconnue']);
    exit;
}

// ============================================================
// Fonction d'appel à l'API Mistral
// ============================================================
function callMistral($userMessage, $mode, $imageBase64, $imageType, $conversationId, $config) {
    $systemPrompts = [
        'branding' => "Tu es 'Nexus Créatif', un Directeur Artistique et Designer Graphique Expert. Tu crées des identités de marque professionnelles, des logos, des chartes graphiques complètes (palettes de couleurs, typographies, déclinaisons). Tes designs sont cohérents et adaptés au web et à l'impression. Tu fournis des spécifications techniques précises et des codes couleurs HEX/CMJN/Pantone. Tu présentes toujours tes concepts avec des détails visuels richement décrits, des codes couleurs exacts, et des recommandations typographiques. Réponds en français avec un ton professionnel, créatif et proactif.",
        'packaging' => "Tu es 'Nexus Créatif', expert en Design de Packaging et Mockups. Tu crées des étiquettes haute définition pour divers produits (agroalimentaire, boissons, équipements) en tenant compte des contraintes d'impression (fonds perdus, pantones, résolution 300dpi min). Tu décris avec précision les mises en page, hiérarchies visuelles, et spécifications techniques. Tu fournis des directives détaillées pour la réalisation de mockups 3D photoréalistes avec un éclairage studio. Réponds en français avec précision technique.",
        'photographie' => "Tu es 'Nexus Créatif', expert en Génération d'Images et Photographie Virtuelle. Tu génères des descriptions de visuels avec une précision photographique absolue : résolution (4K/8K), focale (35mm/50mm/85mm/135mm), ouverture (f/1.4 à f/16), ISO, température de couleur en Kelvin, type d'éclairage (Rembrandt, split, butterfly, boucle), composition (règle des tiers, nombre d'or, leading lines). Tu maintiens une cohérence stricte des personnages et des scènes. Décris les décors avec une richesse de détails extrême. Réponds en français.",
        'analyse' => "Tu es 'Nexus Créatif', expert en Analyse et Itération de designs. Tu analyses les images fournies pour en extraire : palette chromatique exacte (codes HEX), style typographique, équilibre visuel, hiérarchie de l'information, ton et personnalité de la marque, points d'amélioration. Tu proposes des modernisations concrètes tout en respectant l'ADN original. Si une image est fournie, extrais l'OCR du texte visible. Réponds en français avec une analyse structurée.",
        'concept' => "Tu es 'Nexus Créatif', Directeur Artistique expert. Tu génères des concepts créatifs complets : moodboards textuels détaillés, directions artistiques avec références (époque, mouvement artistique, influences culturelles), univers sémantiques et symboliques, storytelling de marque. Tu explores plusieurs pistes créatives avant de recommander la plus pertinente. Chaque concept inclut : nom du concept, palette chromatique, typographies recommandées, ambiance générale, références culturelles. Réponds en français."
    ];

    $system = $systemPrompts[$mode] ?? $systemPrompts['branding'];

    // Gestion de l'historique de conversation
    if (!isset($_SESSION['conversations'][$conversationId])) {
        $_SESSION['conversations'][$conversationId] = [];
    }

    // Construire le message utilisateur
    $userContent = [];
    if ($imageBase64) {
        $userContent[] = [
            'type' => 'image_url',
            'image_url' => ['url' => "data:{$imageType};base64,{$imageBase64}"]
        ];
    }
    $userContent[] = ['type' => 'text', 'text' => $userMessage];

    // Ajouter au contexte
    $_SESSION['conversations'][$conversationId][] = [
        'role' => 'user',
        'content' => $imageBase64 ? $userContent : $userMessage
    ];

    // Limiter l'historique à 10 échanges
    $history = array_slice($_SESSION['conversations'][$conversationId], -20);

    $payload = [
        'model'       => $config['model'],
        'messages'    => array_merge([['role' => 'system', 'content' => $system]], $history),
        'temperature' => 0.85,
        'max_tokens'  => 4096,
        'top_p'       => 0.95,
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => 'https://api.mistral.ai/v1/chat/completions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $config['mistral_api_key'],
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_TIMEOUT        => 120,
    ]);

    $raw     = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        return ['error' => 'Erreur réseau : ' . $curlErr];
    }

    $data = json_decode($raw, true);

    if ($httpCode !== 200) {
        $errMsg = $data['error']['message'] ?? 'Erreur API inconnue (HTTP ' . $httpCode . ')';
        return ['error' => $errMsg];
    }

    $assistantMessage = $data['choices'][0]['message']['content'] ?? '';
    $tokensUsed       = $data['usage']['total_tokens'] ?? 0;

    // Sauvegarder la réponse dans l'historique
    $_SESSION['conversations'][$conversationId][] = [
        'role'    => 'assistant',
        'content' => $assistantMessage
    ];

    return [
        'success'         => true,
        'message'         => $assistantMessage,
        'tokens'          => $tokensUsed,
        'conversation_id' => $conversationId,
        'model'           => $data['model'] ?? $config['model'],
    ];
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nexus Créatif — Studio IA</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>

<!-- GRAIN OVERLAY -->
<div class="grain"></div>

<!-- SIDEBAR -->
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <div class="logo">
      <span class="logo-icon">✦</span>
      <div>
        <h1>Nexus Créatif</h1>
        <p>Studio IA — Direction Artistique</p>
      </div>
    </div>
  </div>

  <nav class="nav-modes">
    <p class="nav-label">MODULES</p>
    <button class="nav-btn active" data-mode="branding" title="Identité & Branding">
      <span class="nav-icon">◈</span>
      <span>Identité & Branding</span>
    </button>
    <button class="nav-btn" data-mode="packaging" title="Packaging & Labels">
      <span class="nav-icon">⬡</span>
      <span>Packaging & Labels</span>
    </button>
    <button class="nav-btn" data-mode="photographie" title="Direction Photo">
      <span class="nav-icon">◎</span>
      <span>Direction Photo</span>
    </button>
    <button class="nav-btn" data-mode="analyse" title="Analyse & Itération">
      <span class="nav-icon">◉</span>
      <span>Analyse & Itération</span>
    </button>
    <button class="nav-btn" data-mode="concept" title="Concepts Créatifs">
      <span class="nav-icon">✧</span>
      <span>Concepts Créatifs</span>
    </button>
  </nav>

  <div class="nav-utilities">
    <p class="nav-label">OUTILS</p>
    <button class="nav-btn" id="btn-export">
      <span class="nav-icon">↓</span>
      <span>Exporter conversation</span>
    </button>
    <button class="nav-btn" id="btn-clear">
      <span class="nav-icon">⊘</span>
      <span>Effacer l'historique</span>
    </button>
  </div>

  <div class="sidebar-footer">
    <div class="model-badge">
      <span class="dot"></span>
      <span id="model-label">Mistral Pixtral Large</span>
    </div>
    <p class="tokens-info">Tokens : <strong id="tokens-count">0</strong></p>
  </div>
</aside>

<!-- MAIN -->
<main class="main" id="main">

  <!-- TOPBAR -->
  <header class="topbar">
    <button class="topbar-menu" id="btn-toggle-sidebar" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
    <div class="topbar-mode">
      <span id="topbar-mode-icon">◈</span>
      <span id="topbar-mode-label">Identité & Branding</span>
    </div>
    <div class="topbar-actions">
      <label class="upload-btn" for="file-upload" title="Joindre une image">
        <span>＋ Image</span>
        <input type="file" id="file-upload" accept="image/*,application/pdf" hidden>
      </label>
    </div>
  </header>

  <!-- WELCOME SCREEN -->
  <div class="welcome" id="welcome-screen">
    <div class="welcome-content">
      <div class="welcome-symbol">✦</div>
      <h2>Nexus Créatif</h2>
      <p class="welcome-sub">Votre Directeur Artistique IA.<br>Branding, Packaging, Photo, Concept.</p>
      <div class="quick-prompts" id="quick-prompts">
        <!-- générés dynamiquement selon le mode -->
      </div>
    </div>
  </div>

  <!-- CONVERSATION -->
  <div class="conversation" id="conversation" style="display:none">
    <div class="messages" id="messages"></div>
  </div>

  <!-- IMAGE PREVIEW -->
  <div class="image-preview-bar" id="image-preview-bar" style="display:none">
    <div class="image-thumb-wrap">
      <img id="image-thumb" src="" alt="Aperçu">
      <button class="remove-image" id="btn-remove-image" title="Supprimer l'image">×</button>
    </div>
    <span class="image-preview-label" id="image-preview-name">image.jpg</span>
  </div>

  <!-- INPUT ZONE -->
  <footer class="input-zone">
    <div class="input-wrapper">
      <textarea
        id="user-input"
        placeholder="Décrivez votre brief créatif… (Shift+Entrée pour saut de ligne)"
        rows="1"
        autocomplete="off"
        spellcheck="true"
      ></textarea>
      <button class="send-btn" id="btn-send" title="Envoyer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
    <p class="input-hint">
      Nexus Créatif peut faire des erreurs. Vérifiez les informations importantes.
    </p>
  </footer>

</main>

<script src="app.js"></script>
</body>
</html>

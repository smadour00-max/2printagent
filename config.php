<?php
// ============================================================
// NEXUS CRÉATIF — Configuration
// ============================================================
// ⚠️  Ne jamais committer ce fichier dans Git !
//     Ajoutez config.php à votre .gitignore
// ============================================================

return [

    // --- Clé API Mistral ---
    // Remplacez par votre vraie clé
    'mistral_api_key' => 'La4GxKHuw3sOkzRGJJ8bmJyQ2A8td3Gx',

    // --- Modèle Mistral ---
    // Options recommandées :
    //   'pixtral-large-latest'    → Vision + texte, le plus capable (recommandé)
    //   'mistral-large-latest'    → Texte uniquement, rapide
    //   'mistral-medium-latest'   → Bon équilibre coût/qualité
    'model' => 'pixtral-large-latest',

    // --- Paramètres optionnels ---
    'max_tokens'  => 4096,
    'temperature' => 0.85,

];

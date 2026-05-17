# ✦ NEXUS CRÉATIF — Studio IA

> Votre Directeur Artistique IA — Branding, Packaging, Direction Photo, Analyse & Concepts

---

## 📁 Structure du projet

```
nexus-creatif/
├── index.php       ← Application principale + backend Mistral API
├── config.php      ← 🔑 Configuration clé API (NE PAS publier)
├── style.css       ← Interface premium
├── app.js          ← Logique frontend
└── README.md       ← Ce fichier
```

---

## 🚀 Installation sur Laragon

### 1. Copier les fichiers

Placez le dossier `nexus-creatif` dans le répertoire `www` de Laragon :

```
C:\laragon\www\nexus-creatif\
```

### 2. Configurer la clé API Mistral

Ouvrez `config.php` et remplacez :

```php
'mistral_api_key' => 'VOTRE_CLE_API_MISTRAL_ICI',
```

par votre vraie clé API Mistral. Vous la trouverez sur :
👉 https://console.mistral.ai/api-keys

### 3. Lancer Laragon

- Démarrez **Apache** et **MySQL** dans Laragon
- Ouvrez votre navigateur et allez sur :

```
http://nexus-creatif.test
```
ou
```
http://localhost/nexus-creatif
```

### 4. Modèle recommandé

Dans `config.php`, le modèle `pixtral-large-latest` est pré-configuré.
Il supporte les **images** (analyse de logos, packagings, etc.).

Pour les requêtes texte uniquement (plus rapide et moins cher) :
```php
'model' => 'mistral-large-latest',
```

---

## 🎨 Modules disponibles

| Module | Description |
|--------|-------------|
| **Identité & Branding** | Logos, chartes graphiques, palettes, typographies |
| **Packaging & Labels** | Étiquettes produits, mockups 3D, contraintes impression |
| **Direction Photo** | Prompts photoréalistes avec specs techniques (focale, ISO, etc.) |
| **Analyse & Itération** | Analyse d'images uploadées, extraction couleurs, OCR |
| **Concepts Créatifs** | Moodboards, storytelling, directions artistiques |

---

## 💡 Utilisation

1. **Choisissez un module** dans la barre latérale
2. **Rédigez votre brief** ou cliquez sur un prompt suggéré
3. **Joignez une image** (logo, packaging, photo) via le bouton `+ Image`
4. **Envoyez** avec Entrée ou le bouton envoyer
5. **Exportez** vos conversations avec le bouton "Exporter conversation"

---

## 🔒 Sécurité

- Le fichier `config.php` contient votre clé API → **ne jamais le publier**
- Ajoutez `config.php` à votre `.gitignore`
- Pour une utilisation en production, ajoutez une authentification

---

## 🛠️ Configuration avancée

### .htaccess (optionnel)
Pour une URL propre (sans `/index.php`), créez un `.htaccess` :

```apache
Options -Indexes
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php [QSA,L]
```

### PHP requis
- PHP 7.4 ou supérieur
- Extensions : `curl`, `json`, `session`
- Laragon inclut tout par défaut ✓

---

## 📊 Modèles Mistral disponibles

| Modèle | Vision | Vitesse | Coût |
|--------|--------|---------|------|
| `pixtral-large-latest` | ✅ | Modérée | Élevé |
| `mistral-large-latest` | ❌ | Rapide | Moyen |
| `mistral-medium-latest` | ❌ | Très rapide | Faible |

---

*Nexus Créatif — Powered by Mistral AI*

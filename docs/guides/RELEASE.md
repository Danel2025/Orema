# Guide de Release Desktop — Oréma N+

Ce guide documente l'intégralité du processus pour compiler, signer et publier une nouvelle version de l'application desktop Oréma N+ (installeur Windows).

---

## 1. Prérequis

### Outils système

| Outil | Version minimale | Installation |
|-------|-----------------|--------------|
| **Node.js** | 20 LTS | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 9+ | `npm install -g pnpm` |
| **Rust + Cargo** | stable | `winget install Rustlang.Rustup` |
| **Visual Studio 2022 Build Tools** | — | voir ci-dessous |
| **WebView2 Runtime** | — | préinstallé Windows 11 |

### Visual Studio 2022 Build Tools

Le workload **"Desktop development with C++"** est obligatoire pour compiler Rust sur Windows.

```bash
winget install Microsoft.VisualStudio.2022.BuildTools
```

Après l'installation, ouvrir **Visual Studio Installer** et cocher :

- Workload : **Développement Desktop en C++**
- Composants inclus : MSVC v143, Windows SDK 10.x, CMake Tools

### WebView2 Runtime

Préinstallé sur Windows 11. Sur Windows 10, télécharger le bootstrapper depuis [developer.microsoft.com/microsoft-edge/webview2](https://developer.microsoft.com/microsoft-edge/webview2/).

> Note : le bundler NSIS est configuré avec `"type": "downloadBootstrapper"` — WebView2 sera téléchargé automatiquement chez l'utilisateur final s'il est absent.

### Vérifier l'environnement

```bash
node --version    # >= 20.x
pnpm --version    # >= 9.x
rustc --version   # >= 1.70.0 stable
cargo --version
```

---

## 2. Préparation de la release

### 2.1 Bumper la version

La version doit être synchronisée dans **deux fichiers** :

**`package.json`** (racine du projet) :

```json
{
  "version": "1.2.0"
}
```

**`src-tauri/tauri.conf.json`** :

```json
{
  "version": "1.2.0"
}
```

**`src-tauri/Cargo.toml`** :

```toml
[package]
version = "1.2.0"
```

> Les trois fichiers doivent avoir exactement la même version. Le numéro de version suit le [Versioning Sémantique](https://semver.org/) : `MAJEUR.MINEUR.PATCH`.

### 2.2 Mettre à jour le CHANGELOG

Documenter les changements dans `CHANGELOG.md` à la racine avant de builder.

---

## 3. Génération des clés de signature

Le plugin updater de Tauri requiert une paire de clés asymétriques pour signer les installeurs.

### 3.1 Générer la paire de clés

```bash
pnpm tauri signer generate -w ~/.tauri/orema-nplus.key
```

Cette commande génère :

- **`~/.tauri/orema-nplus.key`** — clé privée (ne jamais partager ni committer)
- **`~/.tauri/orema-nplus.key.pub`** — clé publique (à copier dans la config)

### 3.2 Configurer la clé publique

Copier le contenu de `~/.tauri/orema-nplus.key.pub` dans `src-tauri/tauri.conf.json` :

```json
{
  "plugins": {
    "updater": {
      "pubkey": "CONTENU_DE_orema-nplus.key.pub"
    }
  }
}
```

### 3.3 Stocker la clé privée

La clé privée doit être disponible au moment du build via la variable d'environnement `TAURI_SIGNING_PRIVATE_KEY`.

**En local (PowerShell, session courante) :**

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content ~/.tauri/orema-nplus.key -Raw)
```

**En CI/CD (GitHub Actions) :**

Ajouter la clé privée dans les secrets GitHub :
- Repo → Settings → Secrets and variables → Actions
- Créer le secret `TAURI_SIGNING_PRIVATE_KEY` avec le contenu de `~/.tauri/orema-nplus.key`

> **IMPORTANT** : Ne jamais committer `~/.tauri/orema-nplus.key` dans le dépôt git. La clé publique (`.key.pub`) peut être committée sans risque.

---

## 4. Build de production

### 4.1 Variables d'environnement requises

En plus de la clé de signature, les variables Supabase sont nécessaires pour le build Next.js :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service
AUTH_SECRET=votre-secret-jwt
TAURI_SIGNING_PRIVATE_KEY=contenu-de-la-cle-privee
```

### 4.2 Lancer le build

**Sur Windows (PowerShell) :**

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content ~/.tauri/orema-nplus.key -Raw)
pnpm tauri:build
```

**Sur Windows (cmd.exe) :**

```cmd
set TAURI_SIGNING_PRIVATE_KEY=VOTRE_CLE_PRIVEE_ICI
pnpm tauri:build
```

Le build effectue dans l'ordre :
1. `pnpm build` — build Next.js (génère le dossier `out/`)
2. Compilation Rust via Cargo
3. Bundling NSIS et MSI avec signature automatique

### 4.3 Artefacts générés

Après un build réussi, les fichiers se trouvent dans `src-tauri/target/release/bundle/` :

| Fichier | Description |
|---------|-------------|
| `nsis/Oréma N+_1.x.x_x64-setup.exe` | Installeur NSIS (recommandé) |
| `nsis/Oréma N+_1.x.x_x64-setup.exe.sig` | Signature de l'installeur NSIS |
| `msi/Oréma N+_1.x.x_x64_en-US.msi` | Installeur MSI |
| `msi/Oréma N+_1.x.x_x64_en-US.msi.sig` | Signature de l'installeur MSI |

> Le fichier `.sig` est généré automatiquement grâce à `"createUpdaterArtifacts": true` dans `tauri.conf.json`.

---

## 5. Publication sur GitHub Releases

### 5.1 Créer et pousser le tag

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock CHANGELOG.md
git commit -m "chore: release v1.x.x"
git tag v1.x.x
git push origin main --tags
```

### 5.2 Créer la release GitHub

Utiliser le CLI `gh` ou l'interface web GitHub.

**Via gh CLI :**

```bash
gh release create v1.x.x \
  "src-tauri/target/release/bundle/nsis/Oréma N+_1.x.x_x64-setup.exe" \
  "src-tauri/target/release/bundle/nsis/Oréma N+_1.x.x_x64-setup.exe.sig" \
  --title "Oréma N+ v1.x.x" \
  --notes "Description des changements"
```

### 5.3 Créer le fichier `latest.json`

Ce fichier est consulté par l'application pour détecter les mises à jour automatiques. L'endpoint configuré dans `tauri.conf.json` est :

```
https://github.com/Danel2025/Orema-n-/releases/latest/download/latest.json
```

Créer un fichier `latest.json` avec le contenu suivant (adapter la version et la signature) :

```json
{
  "version": "1.x.x",
  "notes": "Description des changements dans cette version",
  "pub_date": "2026-04-07T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "CONTENU_EXACT_DU_FICHIER_.SIG",
      "url": "https://github.com/Danel2025/Orema-n-/releases/download/v1.x.x/Or%C3%A9ma%20N+_1.x.x_x64-setup.exe"
    }
  }
}
```

> Pour obtenir la valeur de `signature`, afficher le contenu du fichier `.sig` :
> ```bash
> cat "src-tauri/target/release/bundle/nsis/Oréma N+_1.x.x_x64-setup.exe.sig"
> ```

Uploader `latest.json` dans la release GitHub :

```bash
gh release upload v1.x.x latest.json
```

### 5.4 Vérifier la release

L'application vérifie automatiquement les mises à jour au démarrage via le composant `UpdateNotifier`. Pour tester manuellement :

1. Installer une ancienne version de l'application
2. Lancer l'application
3. La bannière de mise à jour doit apparaître en bas à droite dans les secondes qui suivent

---

## 6. Comportement de la mise à jour automatique

Le composant `components/layout/update-notifier.tsx` est intégré dans le layout dashboard et gère l'intégralité du flux de mise à jour côté utilisateur.

### Fonctionnement

1. **Au démarrage** : le composant vérifie si `window.__TAURI_INTERNALS__` est présent. En mode web (navigateur), il ne fait rien.
2. **Vérification** : appel à `check()` du plugin `@tauri-apps/plugin-updater` contre l'endpoint GitHub.
3. **Notification** : si une version supérieure est disponible, une bannière apparaît en bas à droite avec animation.
4. **Installation** : le clic sur "Mettre à jour" appelle `downloadAndInstall()` puis `relaunch()` — l'application redémarre automatiquement sur la nouvelle version.
5. **Report** : le clic sur "Plus tard" ferme la bannière pour la session en cours.

### États de la bannière

| État | Affichage |
|------|-----------|
| `available` | "Mise à jour v1.x.x disponible" + boutons "Plus tard" / "Mettre à jour" |
| `downloading` | "Téléchargement en cours..." + spinner animé |
| `error` | "Erreur de mise à jour" + bouton fermeture, retour automatique à `available` après 3 secondes |

### Propriétés importantes

- Non bloquant : les erreurs de vérification sont silencieuses, le POS reste utilisable
- Transparent en mode web : aucun rendu si `__TAURI_INTERNALS__` est absent
- Nettoyage automatique : la vérification est annulée si le composant est démonté

---

## 7. Processus complet — Récapitulatif

```
1. Bumper la version dans package.json, tauri.conf.json, Cargo.toml
2. Mettre à jour CHANGELOG.md
3. Builder : $env:TAURI_SIGNING_PRIVATE_KEY = ... && pnpm tauri:build
4. Préparer latest.json avec la version, notes, date, signature et URL
5. Committer, tagger et pousser : git tag vX.X.X && git push --tags
6. Créer la release GitHub avec le .exe et le .sig
7. Uploader latest.json dans la release
→ Les utilisateurs verront la bannière de mise à jour au prochain démarrage
```

---

## 7. Dépannage

### Erreur : `TAURI_SIGNING_PRIVATE_KEY not set`

La variable d'environnement n'est pas définie. La définir avant le build :

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content ~/.tauri/orema-nplus.key -Raw)
```

### Erreur : `error: linker 'link.exe' not found`

Visual Studio Build Tools n'est pas installé ou le workload C++ est manquant. Ouvrir Visual Studio Installer et ajouter "Développement Desktop en C++".

### Erreur : `WebView2 not found`

WebView2 n'est pas installé sur la machine de développement. Télécharger l'installeur depuis [developer.microsoft.com/microsoft-edge/webview2](https://developer.microsoft.com/microsoft-edge/webview2/).

### Erreur : `Could not find 'out' directory`

Le build Next.js a échoué ou n'a pas généré le dossier `out/`. Vérifier que `next.config.ts` contient `output: "export"` et lancer `pnpm build` séparément pour diagnostiquer.

```bash
pnpm build
# Vérifier l'absence d'erreurs, puis
pnpm tauri:build
```

### La mise à jour automatique ne se déclenche pas

Vérifications à effectuer :

1. `latest.json` est bien présent dans la release GitHub et accessible publiquement
2. Le champ `version` dans `latest.json` est **strictement supérieur** à la version installée
3. La `signature` dans `latest.json` correspond exactement au contenu du fichier `.sig`
4. La `pubkey` dans `tauri.conf.json` correspond à la clé utilisée pour signer

### Build très lent (première compilation)

La première compilation Rust télécharge et compile toutes les dépendances. Cela peut prendre 10 à 30 minutes. Les compilations suivantes sont incrémentales et beaucoup plus rapides.

---

## Références

- [Documentation Tauri v2](https://v2.tauri.app/)
- [Plugin Updater Tauri](https://v2.tauri.app/plugin/updater/)
- [Tauri Signer](https://v2.tauri.app/plugin/updater/#signing-updates)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- Repo GitHub : [Danel2025/Orema-n-](https://github.com/Danel2025/Orema-n-)

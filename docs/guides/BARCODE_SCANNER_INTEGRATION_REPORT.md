# Rapport : Intégration des Lecteurs Code-Barres dans Oréma N+

**Date :** 21 mars 2026
**Statut :** Recherche complétée
**Portée :** Intégration d'un système de lecture code-barres (scanner USB et caméra) pour une application POS Next.js/React

---

## Table des matières

1. [État actuel du projet](#état-actuel)
2. [Fonctionnement des lecteurs code-barres avec le web](#fonctionnement)
3. [Recommandations technologiques](#recommandations)
4. [Architecture d'implémentation](#architecture)
5. [Considérations africaines](#afrique)
6. [Roadmap d'implémentation](#roadmap)

---

## État actuel du projet {#état-actuel}

### Infrastructure existante

Le projet **Oréma N+** (`C:\Users\Danel code\Desktop\orema n+\gabon-pos`) possède déjà :

**Base de données (Prisma/Supabase) :**
- Champ `codeBarre` (optionnel, STRING) dans le modèle `Produit` (prisma/schema.prisma:365)
- Index unique sur `(etablissementId, codeBarre)` pour garantir l'unicité par établissement
- Aucune autre infrastructure liée aux codes-barres

**Frontend (React/Next.js) :**
- Formulaire produit (`components/produits/product-form.tsx`) avec champ `codeBarre` visible mais non fonctionnel
- Schéma de validation Zod (`schemas/produit.schema.ts`) qui accepte `codeBarre` en tant que chaîne optionnelle
- Page caisse (`app/(dashboard)/caisse/page.tsx`) qui expose `codeBarre` dans l'interface `Produit` mais ne l'utilise pas

**Stack technologique :**
```
Next.js 16 | React 19 | TypeScript 5
Supabase (PostgreSQL) | Radix UI Themes 3 | Tailwind CSS 4
React Hook Form + Zod | TanStack Query 5 | Zustand 5
```

**Pas de dépendances actuelles :**
Aucune bibliothèque de scan de code-barres n'est actuellement installée dans `package.json`.

---

## Fonctionnement des lecteurs code-barres avec le web {#fonctionnement}

### Les scanners USB comme claviers (HID)

Les lecteurs code-barres USB professionnels fonctionnent en **mode HID (Human Interface Device)** : l'appareil agit comme un clavier mécanique standard.

**Flux normal :**
1. Scanner USB émule le clavier
2. À la lecture du code-barres, envoie rapidement la séquence de caractères (ex: `123456789012` pour un EAN-13)
3. Termine l'envoi par un caractère de terminaison (généralement **Enter/Return**)

**Caractéristiques clés :**
- **Vitesse de saisie :** 50-100 caractères/seconde (ordre de grandeur)
- **Temps entre touches :** 10-100 ms selon le scanner (Honeywell : ~10 ms, Zebra : ~80 ms)
- **Terminal character :** Presque toujours Enter (`\n` ou `\r`)
- **Aucune API JavaScript native** pour accéder directement au scanner (isolation de sécurité du navigateur)

### Problème : Scanner vs Clavier humain

Le navigateur reçoit les mêmes événements `keydown`, `keyup`, `input` qu'un humain tapant. Il est **impossible de les distinguer** avec des APIs standard.

**Solution :** Timing-based detection
- Les humains tapent à ~5-10 caractères/seconde
- Les scanners tapent à ~10-100 caractères/seconde (jusqu'à 20x plus rapide)
- En mesurant le **délai entre chaque touche**, on peut déduire si c'est un scan

---

## Recommandations technologiques {#recommandations}

### 1. Pour les scanners USB (HID mode) ⭐ **RECOMMANDÉ POUR V1**

**Approche :** Timing-based detection via un hook React custom

**Avantages :**
- ✅ Zéro dépendance externe (compatible avec le projet)
- ✅ Fonctionne avec n'importe quel scanner USB standard
- ✅ Simple à intégrer dans n'importe quel input
- ✅ Bas overhead de performance
- ✅ Confiance maximale auprès de l'utilisateur (pas de lib "magique")

**Inconvénients :**
- ⚠️ Dépend du timing (peut avoir des faux positifs/négatifs)
- ⚠️ Paramétrisation requise selon le modèle de scanner utilisé

**Implémentation :**
```typescript
// Pseudo-code
const useBarcodeScan = (options = {}) => {
  const scanTimeout = options.timeout || 100;
  const avgKeyPressTime = options.avgTime || 40;

  // Accumuler les caractères
  // Mesurer le délai entre chaque touche
  // Si délai < avgKeyPressTime : ajouter au buffer scan
  // Si délai > scanTimeout ET buffer non vide : émettre scan()
  // Si touche = Enter : émettre scan immédiatement
};
```

**Bibliothèques légères existantes :**
- [onScan.js](https://a.kabachnik.info/onscan-js.html) - Vanilla JS, ~2KB
- [keyscannerjs](https://github.com/namshi/keyscannerjs) - Détecte événements automatisés
- [use-scan-detection](https://github.com/markjaniczak/use-scan-detection) - Hook React dédié
- [@point-of-sale/keyboard-barcode-scanner](https://www.npmjs.com/package/@point-of-sale/keyboard-barcode-scanner) - Spécifique POS

**Recommandation personnalisée :** Créer un hook custom `useBarcodeScan` inspiré de ces librairies, mais sans dépendance externe.

---

### 2. Pour les caméras (QR codes et codes-barres 1D) 📱 **V2+**

**Approche :** Librairie JavaScript avec accès à la caméra

**Comparaison des meilleures options :**

| Critère | Quagga2 | html5-qrcode | zxing-js |
|---------|---------|---|---|
| **EAN-13** | ✅ Oui | ✅ Oui | ✅ Oui |
| **QR Code** | ❌ Non (1D only) | ✅ Oui | ✅ Oui |
| **Code 128, 39** | ✅ Oui | ✅ Oui | ✅ Oui |
| **Maintenance** | ✅ Active (fork) | ⚠️ Stalled (2023) | ✅ Active |
| **Bundle size** | 350KB | 200KB | 1.2MB |
| **React example** | ✅ Officiel | ❌ Non | ✅ Dispo |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

**Recommandation :** **Quagga2** (`@ericblade/quagga2`)
- Fork actif et maintenu
- Excellent pour les codes-barres 1D (priorité marché africain)
- Assez léger
- Documentation solide

**Alternative si 2D requis :** `zxing-js` (mais 1.2MB)

---

### 3. WebHID API (Advanced) 🔧 **Hors portée pour V1**

**Approche :** Accès bas-niveau au scanner en tant que périphérique HID spécifique

**Cas d'usage :** Scanners propriétaires (Honeywell, Datalogic) en mode particulier

**Limitations :**
- Support navigateur limité (Chrome/Edge seulement)
- Nécessite une permission utilisateur explicite
- Plus complexe à implémenter
- Non nécessaire pour les scanners HID keyboard-emulation standard

**Statut :** À explorer en V3+ si besoins spécifiques

---

## Architecture d'implémentation {#architecture}

### Phase 1 : Scanner USB (v1.0)

#### 1.1 Hook React custom : `useBarcodeScan`

**Fichier :** `lib/hooks/use-barcode-scan.ts`

```typescript
interface BarcodeScanOptions {
  onScan: (barcode: string) => void;
  averageKeyPressTime?: number; // ms, défaut: 40
  scanTimeout?: number; // ms avant de considérer fin de scan, défaut: 100
  prefix?: string; // ex: Ctrl ou autre caractère de préfixe
  suffix?: string; // ex: Enter (défaut) ou Tab
  minLength?: number; // min chars pour valider, défaut: 8
}

export const useBarcodeScan = (options: BarcodeScanOptions) => {
  // État
  const [buffer, setBuffer] = useState('');
  const timingsRef = useRef<number[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listener
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const now = performance.now();
    const timeSinceLast = now - lastKeyTimeRef.current;

    // Suffixe détecté
    if (options.suffix && e.key === options.suffix) {
      if (buffer.length >= (options.minLength ?? 8)) {
        options.onScan(buffer);
        setBuffer('');
        timingsRef.current = [];
      }
      e.preventDefault();
      return;
    }

    // Caractère ordinaire
    if (e.key.length === 1) {
      // Nouvelle séquence ou continuation ?
      if (timeSinceLast < (options.averageKeyPressTime ?? 40) * 2) {
        // Continue le buffer
        timingsRef.current.push(timeSinceLast);
        setBuffer(prev => prev + e.key);
      } else {
        // Réinitialiser
        setBuffer(e.key);
        timingsRef.current = [];
      }

      // Reset timeout
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const avgTiming = timingsRef.current.reduce((a, b) => a + b, 0) / timingsRef.current.length;

        // Est-ce un scan ? (timing rapide)
        if (avgTiming < (options.averageKeyPressTime ?? 40) * 2) {
          if (buffer.length >= (options.minLength ?? 8)) {
            options.onScan(buffer);
          }
        }

        setBuffer('');
        timingsRef.current = [];
      }, options.scanTimeout ?? 100);

      lastKeyTimeRef.current = now;
    }
  }, [buffer, options]);

  // Setup/cleanup
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutRef.current);
    };
  }, [handleKeyDown]);
};
```

#### 1.2 Intégration dans le formulaire produit

**Fichier modifié :** `components/produits/product-form.tsx`

```tsx
export function ProductForm({ ... }) {
  const {
    register,
    watch,
    control,
    setValue, // Nouveau pour setter codeBarre
    formState: { errors },
  } = useForm({ ... });

  // Hook de scan
  useBarcodeScan({
    onScan: (barcode) => {
      // Remplir le champ code-barres
      setValue('codeBarre', barcode, { shouldValidate: true });
      toast.success(`Code-barres détecté : ${barcode}`);
    },
    averageKeyPressTime: 40,
    scanTimeout: 100,
    minLength: 8,
  });

  // Reste du composant...
}
```

#### 1.3 Intégration dans la caisse

**Fichier modifié :** `app/(dashboard)/caisse/page.tsx`

Ajouter un composant dédié pour les scans :

```tsx
function CaisseBarcodeScan() {
  const { addToCart } = useCartStore();
  const [products, setProducts] = useState<Produit[]>([]);

  // Charger les produits (avec code-barres)
  useEffect(() => {
    // Charger tous les produits avec codeBarre non-null
    loadProducts().then(setProducts);
  }, []);

  useBarcodeScan({
    onScan: (barcode) => {
      // Chercher le produit par code-barres
      const product = products.find(p => p.codeBarre === barcode);

      if (product) {
        addToCart(product);
        toast.success(`${product.nom} ajouté au panier`);
      } else {
        toast.error(`Produit non trouvé : ${barcode}`);
      }
    },
  });

  return (
    <div>
      {/* Champ input caché pour capturer le focus */}
      <input
        type="text"
        style={{ position: 'absolute', left: '-9999px' }}
        autoFocus
      />
      {/* UI caisse existante */}
    </div>
  );
}
```

---

### Phase 2 : Caméra (v1.5+)

#### 2.1 Installation Quagga2

```bash
pnpm add @ericblade/quagga2
pnpm add -D @types/quagga # TypeScript
```

#### 2.2 Composant de scanner par caméra

**Fichier :** `components/barcode/barcode-camera-scanner.tsx`

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';

interface CameraBarcodeScannerProps {
  onDetected: (code: string) => void;
  isOpen: boolean;
}

export function CameraBarcodeScanner({ onDetected, isOpen }: CameraBarcodeScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isOpen || initialized) return;

    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: containerRef.current,
          constraints: {
            width: { min: 640 },
            height: { min: 480 },
            facingMode: 'environment', // Caméra arrière
          },
        },
        decoder: {
          readers: [
            'ean_reader', // EAN-13
            'ean_8_reader', // EAN-8
            'code_128_reader',
            'code_39_reader',
            'qr_reader', // QR codes
          ],
          debug: {
            showCanvas: true,
            showPatches: true,
            showFoundPatches: true,
            showSkeleton: true,
            showLabels: true,
            showCenterpoint: true,
            drawBoundingBox: false,
            drawSkeleton: false,
            drawDebug: false,
          },
        },
      },
      (err) => {
        if (err) {
          console.error('Erreur Quagga:', err);
          return;
        }

        Quagga.start();
        setInitialized(true);

        Quagga.onDetected((result) => {
          if (result.codeResult.code) {
            onDetected(result.codeResult.code);
            Quagga.stop(); // Arrêter après détection
          }
        });
      }
    );

    return () => {
      Quagga.stop();
    };
  }, [isOpen, initialized, onDetected]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '500px' }} />
  );
}
```

---

## Considérations africaines {#afrique}

### Normes de codes-barres utilisées en Afrique

**Gabon et région d'Afrique centrale :**
- **EAN-13** : Standard international, dominat dans les magasins de détail
- **EAN-8** : Codes courts pour petits produits
- **Code 128 / Code 39** : Usage industriel (entrepôts)
- **QR codes** : Croissance rapide (vérification, traçabilité)

**Source :** [International Barcodes - Africa](https://internationalbarcodes.com/africa-barcodes/), [Barcodes Ghana](https://barcodesghana.com/ean-13-specifications/)

### Infrastructure matérielle locale

**Hardware standard sur le marché africain :**
1. **Scanner USB 1D** : 50-200$ USD (Honeywell, Zebra, etc.)
2. **Imprimantes thermiques 80mm** : Pour reçus (déjà supportées par le projet)
3. **Tablettes Android** : Croissance importante (alternative caméra)

**Note :** Le projet supporte déjà les imprimantes thermales via `node-thermal-printer`, ce qui est parfait pour synchroniser avec les codes-barres.

### Considérations réglementaires

- **Gabon** : Pas de régulation spécifique sur les scanners web (utilisation standard)
- **Commerce électronique** : Les e-codes-barres (QR) sont acceptés pour la traçabilité
- **Douanes/Importation** : Les scanners USB se conforment aux normes internationales

---

## Roadmap d'implémentation {#roadmap}

### Étape 0 : Préparation (1-2 jours)

- [x] Documenter l'état actuel (✓ ce rapport)
- [ ] Créer un hook `useBarcodeScan` et des tests unitaires
- [ ] Configuration des paramètres de timing (basés sur scanners courants)

### Étape 1 : Scanners USB (v1.0) — **2 semaines**

**Sprint 1 (5 jours) :**
1. Implémenter `useBarcodeScan` hook
2. Intégrer dans le formulaire produit (`product-form.tsx`)
3. Tests unitaires + tests manuels avec un scanner physique
4. Documentation pour les utilisateurs

**Sprint 2 (5 jours) :**
1. Intégration dans la page caisse (`caisse/page.tsx`)
2. Recherche produit par code-barres (optionnel)
3. UI feedback (toast, highlights, son)
4. Tests E2E Playwright

**Outputs :**
- Hook `lib/hooks/use-barcode-scan.ts`
- Component `components/barcode/barcode-input.tsx`
- Tests dans `tests/unit/barcode-scan.test.ts`
- Docs dans `docs/guides/barcode-scanner-setup.md`

### Étape 2 : Caméra (v1.5) — **3 semaines**

**Sprint 3 (7 jours) :**
1. Installer Quagga2, intégrer dans le projet
2. Composant `CameraBarcodeScanner`
3. Modal dans le formulaire produit ("Scanner par caméra")
4. Tests avec différents types de codes

**Sprint 4 (7 jours) :**
1. Intégration caisse (mode rapide scan)
2. Optimisations performance
3. Fallback si pas de caméra disponible
4. Tests E2E multi-navigateur

### Étape 3+ : Avancé

- **v2.0** : WebHID API pour scanners propriétaires Honeywell/Datalogic
- **v2.0** : Gestion stock automatique au scan (si `gererStock=true`)
- **v3.0** : Analytics codes-barres (produits scannés, taux de succès)
- **v3.0** : Support RFID si demandé

---

## Schéma d'intégration global

```
┌─────────────────────────────────────────────────────────┐
│ PAGE PRODUITS                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ProductForm                                      │  │
│  │  ├─ useBarcodeScan (hook)     ← Scan USB        │  │
│  │  ├─ Camera modal (Quagga2)   ← Scan par caméra  │  │
│  │  └─ codeBarre field                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ PAGE CAISSE                                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ CaisseBarcodeScan component                      │  │
│  │  ├─ useBarcodeScan (global)  ← Scan USB         │  │
│  │  ├─ Quick lookup by codeBarre                   │  │
│  │  ├─ Add to cart automatically                   │  │
│  │  └─ Toast feedback                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ BASE DE DONNÉES (Supabase/PostgreSQL)                   │
│  ├─ produits.code_barre (STRING, unique)               │
│  ├─ Index sur (etablissementId, code_barre)            │
│  └─ Support pour futur: mouvements_stock.code_barre    │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist de déploiement

### Avant la v1.0

- [ ] Tester avec au moins 3 modèles de scanners différents (Honeywell, Zebra, DataLogic)
- [ ] Paramétriser `averageKeyPressTime` selon les scanners testés
- [ ] Documentation utilisateur : configuration du scanner, tests
- [ ] Tests manuels E2E : création produit + scan + vente
- [ ] Code review de `useBarcodeScan` hook

### Avant la v1.5 (Caméra)

- [ ] Vérifier compatibilité navigateur (Chrome, Firefox, Safari)
- [ ] Tests sur tablettes Android (marché cible)
- [ ] Gestion permissions caméra (fallback si refusée)
- [ ] Performance sur appareils bas de gamme

### Avant la v2.0

- [ ] Intégration stock automatique
- [ ] Synchronisation offline (idb) pour scans
- [ ] Audit logging des scans
- [ ] Gestion des codes-barres dupliqués/invalides

---

## Fichiers à créer/modifier

### Création

```
lib/hooks/use-barcode-scan.ts          ← Hook custom (clé)
components/barcode/barcode-input.tsx   ← Input avec scan
components/barcode/barcode-camera-scanner.tsx ← Quagga2
tests/unit/barcode-scan.test.ts        ← Tests
docs/guides/barcode-setup.md           ← Doc utilisateur
```

### Modification

```
components/produits/product-form.tsx   ← Intégrer useBarcodeScan
app/(dashboard)/caisse/page.tsx        ← CaisseBarcodeScan component
lib/db/queries/produits.ts             ← Ajouter getProduitByBarcode()
stores/cart-store.ts                   ← Optionnel: addFromBarcode()
```

---

## Résumé des recommandations

| Aspect | Recommandation | Justification |
|--------|---|---|
| **Scanner USB v1** | Hook `useBarcodeScan` custom | Aucune dépendance, fonctionne universellement |
| **Caméra v1.5** | Quagga2 + zxing-js | EAN-13 + QR, maintenu activement |
| **Architecture** | Global listener + focused inputs | Flexibilité (scan partout ou champ spécifique) |
| **Marché africain** | EAN-13 prioritaire, QR secondaire | Aligné sur infrastructure gabon + région |
| **Performance** | Timing-based, 100-500ms | Bas impact CPU/mémoire |
| **Security** | Pas de WebHID v1 | Complexité non justifiée pour HID standard |

---

## Ressources externes

### Timing-based Detection
- [onScan.js](https://a.kabachnik.info/onscan-js.html)
- [keyscannerjs](https://github.com/namshi/keyscannerjs)
- [use-scan-detection](https://github.com/markjaniczak/use-scan-detection)
- [Medium: Seamless Web Integration](https://medium.com/@elie_3904/seamless-web-integration-of-usb-code-scanners-with-react-js-7fef44ea71e4)

### Barcode Camera Scanning
- [Quagga2](https://github.com/ericblade/quagga2) + [npm](https://www.npmjs.com/package/@ericblade/quagga2)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) + [npm](https://www.npmjs.com/package/html5-qrcode)
- [Scanbot Blog: Quagga2 vs html5-qrcode](https://scanbot.io/blog/quagga2-vs-html5-qrcode-scanner/)

### EAN-13 Standards Africa
- [International Barcodes - Africa](https://internationalbarcodes.com/africa-barcodes/)
- [Barcodes Ghana - EAN-13 Specs](https://barcodesghana.com/ean-13-specifications/)
- [Lite Barcodes Nigeria](https://litebarcodes.com.ng/types-of-barcodes/)

---

## Questions/Prochaines étapes

1. **Ordre de priorité :** USB v1 avant caméra v1.5 ?
2. **Hardware de test :** Quels modèles de scanners tester en priorité ?
3. **Intégration stock :** Réduire automatiquement les stocks au scan ?
4. **Offline mode :** Supporter les scans hors-ligne via IndexedDB ?

---

**Rapport rédigé par :** Claude Code
**Dernière mise à jour :** 21/03/2026

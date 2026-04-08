# Résumé technique : Scanners code-barres dans Oréma N+

**Pour :** Développeurs qui vont implémenter
**Durée lecture :** 5-10 minutes

---

## 1. Comment fonctionnent les scanners USB

### Les scanners agissent comme des claviers

```
┌──────────────┐
│ Scanner USB  │
└──────────────┘
        │ (Émule clavier HID)
        │ "1", "2", "3", ..., "Enter"
        ↓
  Navigateur reçoit les mêmes événements
  qu'un humain tapant sur son clavier
```

**Différence key timing :**
- **Scanner :** 10-100 ms entre touches (~ 50-100 chars/sec)
- **Humain :** 100-500 ms entre touches (~ 5-10 chars/sec)

### Exemple : EAN-13

```
Code-barres physique : 5901234123457
                       ↓
Scanner USB emet : "5", "9", "0", "1", "2", "3", "4", "1", "2", "3", "4", "5", "7", [Enter]
                   |                                                                   |
                   └──────────── ~10-100ms entre chaque ──────────────────────────────┘
```

---

## 2. Le défi : Distinguer scanner du clavier

### ❌ On NE PEUT PAS
- Accéder aux périphériques USB directement (isolation sécurité)
- Savoir si l'input vient du scanner ou du clavier
- Utiliser une API JavaScript native

### ✅ On PEUT
- Mesurer le **timing entre touches** (ms)
- Détecter un pattern de timing rapide → probablement un scanner
- Utiliser événement `keydown` standard du DOM

---

## 3. Solution : Hook `useBarcodeScan`

### Logique simplifiée

```typescript
// 1. Accumuler les caractères
buffer = ""

// 2. Mesurer délai entre chaque touche
timings = []

// 3. Si délai < 50ms (rapide) → ajouter au buffer scan
//    Si délai > 50ms (lent) → réinitialiser buffer

// 4. Après 100ms sans touche OU Enter → émettre scan()
```

### En pratique

```javascript
// Simulation : scanner rapide
t=0ms   : '5' reçu     → buffer="5", timings=[]
t=10ms  : '9' reçu     → buffer="59", timings=[10]
t=20ms  : '0' reçu     → buffer="590", timings=[10, 10]
t=30ms  : '1' reçu     → buffer="5901", timings=[10, 10, 10]
...
t=130ms : timeout      → avgTiming=~10ms (< 50ms) → onScan("5901234123457")

// Humain tapant lentement
t=0ms   : 'h' reçu     → buffer="h", timings=[]
t=150ms : 'e' reçu     → buffer="e" (réinitialiser!), timings=[]
        Délai > 50ms → pas un scan
```

---

## 4. Paramètres du hook

### Défauts (recommandés)

```typescript
useBarcodeScan({
  onScan: (barcode) => { /* ... */ },

  averageKeyPressTime: 40,  // ← Délai attendu du scanner (ms)
  scanTimeout: 100,         // ← Timeout avant émission (ms)
  minLength: 8,             // ← Min chars pour valider (EAN-8)
  suffix: 'Enter',          // ← Char de terminaison
})
```

### Ajustements selon le scanner

| Scanner | `averageKeyPressTime` | Raison |
|---------|---|---|
| Honeywell | 15-20 ms | Très rapide (~10ms native) |
| Zebra | 70-90 ms | Plus lent (~80ms native) |
| DataLogic | 50-60 ms | Intermédiaire |
| Générique | 40 ms | Par défaut |

---

## 5. Intégration 2 endroits clés

### A. Formulaire produit

**Où :** `components/produits/product-form.tsx`

```typescript
useBarcodeScan({
  onScan: (barcode) => {
    setValue('codeBarre', barcode);
    toast.success(`Code détecté : ${barcode}`);
  },
});
```

**Résultat :** Scanner → champ `codeBarre` rempli automatiquement

### B. Page caisse

**Où :** `app/(dashboard)/caisse/page.tsx`

```typescript
useBarcodeScan({
  onScan: (barcode) => {
    const product = products.find(p => p.codeBarre === barcode);
    if (product) {
      addToCart(product);
      toast.success(`${product.nom} ajouté`);
    }
  },
});
```

**Résultat :** Scanner → produit ajouté au panier automatiquement

---

## 6. Architecture de la base de données

### Schema existant (Prisma)

```prisma
model Produit {
  id        String   @id
  nom       String
  codeBarre String?  @map("code_barre")    // ← Champ existant
  // ... autres champs

  @@unique([etablissementId, codeBarre])   // Index unique
  @@index([codeBarre])                     // Index de recherche
}
```

**État :** PRÊT. Aucune migration requise.

### Requête pour caisse

```sql
SELECT id, nom, codeBarre, prixVente, tauxTva, stockActuel
FROM produits
WHERE etablissementId = $1
  AND actif = true
  AND codeBarre IS NOT NULL
ORDER BY nom;
```

---

## 7. Tests

### Test unitaire minimum

```typescript
import { renderHook, act } from '@testing-library/react';
import { useBarcodeScan } from '@/lib/hooks/use-barcode-scan';

it('détecte un scan EAN-13', async () => {
  const onScan = vi.fn();

  renderHook(() => useBarcodeScan({ onScan }));

  // Simuler scan rapide (10ms entre touches)
  const ean = '5901234123457';
  for (const char of ean) {
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
    });
    vi.advanceTimersByTime(10);
  }

  // Ou simuler Enter
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  });

  expect(onScan).toHaveBeenCalledWith(ean);
});
```

### Test manuel

1. Créer un produit avec code-barres `5901234123457`
2. Aller en caisse
3. Scanner le code-barres
4. Vérifier que le produit s'ajoute au panier

---

## 8. Codes-barres en Afrique

### Standards du marché (Gabon + région)

| Format | Utilisation | Priorité |
|--------|---|---|
| **EAN-13** | Retail (standard) | ⭐⭐⭐ |
| **EAN-8** | Petits produits | ⭐⭐ |
| **Code 128** | Logistique interne | ⭐⭐ |
| **QR codes** | Traçabilité moderne | ⭐ (futur) |

### Validation EAN-13

```javascript
function isValidEAN13(code) {
  if (!/^\d{13}$/.test(code)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(code[12]);
}

// Exemple
isValidEAN13('5901234123457') // → true
isValidEAN13('1234567890123') // → false (checksum incorrect)
```

---

## 9. Flux utilisateur

### En création de produit

```
1. Utilisateur ouvre formulaire produit
2. Scanner émet code-barres
3. Hook détecte pattern rapide
4. Champ codeBarre rempli automatiquement
5. Toast confirme : "Code détecté : 5901234123457"
6. Utilisateur peut valider/modifier et soumettre
```

### En caisse

```
1. Caissier scanne produit
2. Hook détecte pattern rapide
3. Recherche produit dans liste (index codeBarre)
4. Produit ajouté au panier automatiquement
5. Toast confirme : "Coca 500ml ajouté"
6. Panier mis à jour (quantité, prix)
```

---

## 10. Gestion des erreurs courants

### Cas 1 : Code-barres non trouvé en caisse

```typescript
if (!product) {
  toast.error(`Produit non trouvé : ${barcode}`);
  // Optionnel : permettre à l'utilisateur de chercher manuellement
}
```

### Cas 2 : Code-barres déjà existant

```typescript
// BD : unique(etablissementId, codeBarre)
// Lors de la création, Supabase rejettera les doublons
// Message d'erreur : "Ce code-barres existe déjà"
```

### Cas 3 : Faux positif (humain est détecté comme scanner)

```typescript
// Augmenter minLength à 10 ou 12
// Ou réduire averageKeyPressTime si scanner très rapide
```

---

## 11. Performance & sécurité

### Performance

- **Hook overhead :** ~1ms par touche (marginal)
- **Recherche produit :** O(n) → Utiliser index DB `codeBarre`
- **Memory :** Buffer max ~20-30 chars → Acceptable

### Sécurité

- **Pas de vulnérabilité XSS :** Code vérifié via Zod
- **Pas d'accès périphérique :** Les scanners ne font que simuler du clavier
- **RLS appliquée :** Produits de l'établissement uniquement (via Supabase)

---

## 12. Phase 2 : Caméra (Quagga2)

**Quand :** v1.5+ (après validation v1.0)

```bash
pnpm add @ericblade/quagga2
```

**Cas d'usage :**
- Tablettes sans scanner USB
- Entrée d'urgence si scanner ne fonctionne pas
- Prise de photo pour vérification

**Intégration :** Composant modal dans formulaire produit + caisse

---

## 13. Ressources pour développeurs

### Fichiers à créer/modifier

```
✅ Créer : lib/hooks/use-barcode-scan.ts          (150 lignes)
✅ Créer : tests/unit/barcode-scan.test.ts        (80 lignes)
✅ Modifier : components/produits/product-form.tsx (20 lignes)
✅ Modifier : app/(dashboard)/caisse/page.tsx     (30 lignes)
```

### Documentation complète

- [Rapport complet](./BARCODE_SCANNER_INTEGRATION_REPORT.md)
- [Quick Start](./BARCODE_IMPLEMENTATION_QUICK_START.md)

### Références externes

- [onScan.js](https://a.kabachnik.info/onscan-js.html) - Implémentation vanilla
- [Quagga2 GitHub](https://github.com/ericblade/quagga2) - Caméra
- [React Hook Form](https://react-hook-form.com/) - Intégration formulaires

---

## Checklist de déploiement

- [ ] Hook créé et typé
- [ ] Tests unitaires 100% vert
- [ ] Intégration formulaire produit
- [ ] Intégration caisse
- [ ] Tests manuels avec scanner réel
- [ ] Documentation utilisateur
- [ ] Code review
- [ ] Déploiement en staging

---

## Timeline estimée

| Phase | Durée | Dépendances |
|-------|-------|---|
| **Setup + Hook** | 2-3 jours | Aucune |
| **Intégration** | 2-3 jours | Hook complété |
| **Tests** | 2-3 jours | Intégration complétée |
| **Documentation** | 1 jour | Tests validés |
| **Total v1.0** | **7-10 jours** | |
| **v1.5 (Quagga2)** | **7-10 jours** | v1.0 validée |

---

## Questions fréquentes

**Q : Et si l'utilisateur tape rapidement au clavier ?**
A : Possible faux positif. Mitiger avec `minLength: 12` (EAN-13 minimum) ou `averageKeyPressTime: 20` (plus strict).

**Q : Ça marche sur mobile ?**
A : Oui si scanner USB Bluetooth. Ou utiliser caméra (v1.5 Quagga2).

**Q : Et si le scanner a un préfixe/suffixe custom ?**
A : Hook accepte `prefix` et `suffix` optionnels. Adapter la config.

**Q : Faut-il de dépendances externes ?**
A : Non pour v1.0. Quagga2 (350KB) pour v1.5+ si caméra requise.

---

**Dernière mise à jour :** 21/03/2026

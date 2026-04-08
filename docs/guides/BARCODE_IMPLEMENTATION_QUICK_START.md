# Quick Start : Intégration Code-Barres Oréma N+

**Niveau :** Architecture / Implémentation
**Durée :** Pour démarrer l'implémentation v1.0

---

## TL;DR - Les 3 points clés

1. **Scanner USB** = clavier rapide (50-100 chars/sec) vs humain (5-10 chars/sec)
2. **Solution v1** = Hook custom `useBarcodeScan` (0 dépendance, timing-based)
3. **Solution v2** = Quagga2 pour caméra (EAN-13 + QR, 350KB)

---

## Phase 1 : Hook `useBarcodeScan` (v1.0)

### 1. Créer le hook

**Fichier :** `lib/hooks/use-barcode-scan.ts`

```typescript
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface BarcodeScanOptions {
  /**
   * Callback appelé quand un code-barres est détecté
   */
  onScan: (barcode: string) => void;

  /**
   * Délai moyen entre touches du scanner (ms)
   * Honeywell: ~10ms, Zebra: ~80ms, Défaut: 40ms
   */
  averageKeyPressTime?: number;

  /**
   * Timeout avant de considérer fin de scan (ms)
   * Défaut: 100ms
   */
  scanTimeout?: number;

  /**
   * Longueur minimale pour valider un scan
   * Défaut: 8 (EAN-8 minimum)
   */
  minLength?: number;

  /**
   * Caractère de terminaison (généralement Enter)
   * Si vide, se fier au timeout
   */
  suffix?: string;

  /**
   * Élément DOM spécifique à monitorer (défaut: document)
   */
  target?: HTMLElement;
}

/**
 * Hook pour détecter les scans de code-barres via un scanner USB HID
 * Utilise timing-based detection pour distinguer scanner du clavier humain
 */
export function useBarcodeScan({
  onScan,
  averageKeyPressTime = 40,
  scanTimeout = 100,
  minLength = 8,
  suffix = 'Enter',
  target,
}: BarcodeScanOptions) {
  const bufferRef = useRef<string>('');
  const timingsRef = useRef<number[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const now = performance.now();
      const timeSinceLast = now - lastKeyTimeRef.current;

      // Caractère de terminaison détecté
      if (suffix && e.key === suffix) {
        if (bufferRef.current.length >= minLength) {
          onScan(bufferRef.current);
        }
        bufferRef.current = '';
        timingsRef.current = [];
        lastKeyTimeRef.current = 0;
        e.preventDefault();
        return;
      }

      // Ignorer les touches spéciales
      if (e.key.length !== 1) {
        return;
      }

      // Accumuler le caractère
      if (lastKeyTimeRef.current === 0) {
        // Première touche de la séquence
        bufferRef.current = e.key;
      } else if (timeSinceLast < averageKeyPressTime * 2) {
        // Continue la séquence (timing rapide)
        bufferRef.current += e.key;
        timingsRef.current.push(timeSinceLast);
      } else {
        // Nouvelle séquence (délai trop long)
        bufferRef.current = e.key;
        timingsRef.current = [];
      }

      lastKeyTimeRef.current = now;

      // Reset du timeout
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (bufferRef.current.length < minLength) {
          // Pas assez de caractères
          bufferRef.current = '';
          timingsRef.current = [];
          lastKeyTimeRef.current = 0;
          return;
        }

        // Calculer le timing moyen
        if (timingsRef.current.length > 0) {
          const avgTiming = timingsRef.current.reduce((a, b) => a + b) / timingsRef.current.length;

          // Vérifier si c'est un scan (timing rapide)
          if (avgTiming < averageKeyPressTime * 2) {
            onScan(bufferRef.current);
          }
        } else if (suffix === undefined) {
          // Pas de suffix et timeout atteint = probablement un scan
          onScan(bufferRef.current);
        }

        bufferRef.current = '';
        timingsRef.current = [];
        lastKeyTimeRef.current = 0;
      }, scanTimeout);
    },
    [onScan, averageKeyPressTime, scanTimeout, minLength, suffix]
  );

  useEffect(() => {
    const element = target || document;
    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutRef.current);
    };
  }, [handleKeyDown, target]);
}
```

---

### 2. Intégrer dans le formulaire produit

**Fichier :** `components/produits/product-form.tsx`

```tsx
// Dans ProductForm component

import { useBarcodeScan } from '@/lib/hooks/use-barcode-scan';
import { toast } from 'sonner';

export function ProductForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isLoading,
}: ProductFormProps) {
  const {
    register,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(produitSchema),
    defaultValues: { ... },
  });

  // Détecter les scans
  useBarcodeScan({
    onScan: (barcode) => {
      setValue('codeBarre', barcode, { shouldValidate: true });
      toast.success(`✓ Code-barres détecté : ${barcode}`);
    },
    averageKeyPressTime: 40,
    scanTimeout: 100,
    minLength: 8,
  });

  return (
    <Dialog.Root>
      <Dialog.Trigger>{/* ... */}</Dialog.Trigger>
      <Dialog.Content>
        {/* Input code-barres */}
        <input
          {...register('codeBarre')}
          placeholder="Scanner ou saisir le code-barres"
          type="text"
        />
        {errors.codeBarre && <span>{errors.codeBarre.message}</span>}
        {/* Reste du formulaire */}
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

---

### 3. Intégrer dans la caisse

**Fichier :** `app/(dashboard)/caisse/page.tsx` (ajouter au composant existant)

```tsx
// Ajouter dans le composant principal

import { useBarcodeScan } from '@/lib/hooks/use-barcode-scan';

export default function CaissePage() {
  const { addToCart } = useCartStore();
  const [products, setProducts] = useState<Produit[]>([]);

  // Charger les produits (avec code-barres)
  useEffect(() => {
    const loadAllProducts = async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from('produits')
        .select('id, nom, codeBarre, prixVente, tauxTva, stockActuel')
        .eq('actif', true)
        .not('codeBarre', 'is', null); // Seulement produits avec code-barres

      setProducts(data || []);
    };

    loadAllProducts();
  }, []);

  // Détecter les scans en caisse
  useBarcodeScan({
    onScan: (barcode) => {
      const product = products.find((p) => p.codeBarre === barcode);

      if (product) {
        addToCart({
          id: product.id,
          nom: product.nom,
          prixVente: product.prixVente,
          tauxTva: product.tauxTva,
          quantite: 1,
        });

        toast.success(`${product.nom} ajouté au panier`, {
          icon: '📦',
        });
      } else {
        toast.error(`Code-barres non trouvé : ${barcode}`, {
          icon: '❌',
        });
      }
    },
    averageKeyPressTime: 40,
    scanTimeout: 100,
  });

  return (
    <>
      {/* UI caisse existante */}
    </>
  );
}
```

---

## Tests unitaires

**Fichier :** `tests/unit/barcode-scan.test.ts`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBarcodeScan } from '@/lib/hooks/use-barcode-scan';

describe('useBarcodeScan', () => {
  it('should detect a barcode scan', async () => {
    const onScan = vi.fn();

    renderHook(() =>
      useBarcodeScan({
        onScan,
        averageKeyPressTime: 40,
        scanTimeout: 100,
      })
    );

    // Simuler un scan rapide (10ms entre les caractères)
    const chars = '123456789012';
    let time = 0;

    for (const char of chars) {
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: char,
          code: `Digit${char}`,
        });
        document.dispatchEvent(event);
      });
      time += 10; // 10ms entre touches (scanner)
    }

    // Simuler la touche Enter
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(onScan).toHaveBeenCalledWith('123456789012');
    });
  });

  it('should not detect human typing as barcode', async () => {
    const onScan = vi.fn();

    renderHook(() =>
      useBarcodeScan({
        onScan,
        averageKeyPressTime: 40,
      })
    );

    // Simuler une saisie humaine (100ms+ entre touches)
    const chars = 'hello';

    for (const char of chars) {
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
      });
      // Délai humain (~150ms)
      vi.advanceTimersByTime(150);
    }

    await waitFor(() => {
      expect(onScan).not.toHaveBeenCalled();
    });
  });
});
```

---

## Phase 2 : Caméra avec Quagga2 (v1.5)

### Installation

```bash
pnpm add @ericblade/quagga2
pnpm add -D @types/quagga
```

### Composant caméra

**Fichier :** `components/barcode/barcode-camera-scanner.tsx`

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';
import { Dialog, Button, Text, Flex } from '@radix-ui/themes';
import { X } from '@phosphor-icons/react';

interface BarcodeCameraScannerProps {
  isOpen: boolean;
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeCameraScanner({
  isOpen,
  onScan,
  onClose,
}: BarcodeCameraScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: containerRef.current,
          constraints: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment',
          },
        },
        locator: {
          halfSample: true,
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'qr_reader',
          ],
        },
      },
      (err) => {
        if (err) {
          console.error('Quagga init error:', err);
          return;
        }

        Quagga.start();
        setInitialized(true);

        Quagga.onDetected((result) => {
          if (result.codeResult?.code) {
            onScan(result.codeResult.code);
            Quagga.stop();
            setInitialized(false);
            onClose();
          }
        });
      }
    );

    return () => {
      if (initialized) {
        Quagga.stop();
      }
    };
  }, [isOpen, initialized, onScan, onClose]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content>
        <Flex justify="between" align="center" mb="4">
          <Text size="5" weight="bold">
            Scanner par caméra
          </Text>
          <Dialog.Close asChild>
            <button>
              <X size={24} />
            </button>
          </Dialog.Close>
        </Flex>

        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '400px',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        />

        <Text size="2" color="gray" mt="3">
          Pointez votre caméra vers le code-barres
        </Text>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

---

## Checklist de déploiement v1.0

- [ ] Hook `useBarcodeScan` créé et testé
- [ ] Tests unitaires passent
- [ ] Intégré dans `product-form.tsx`
- [ ] Intégré dans `caisse/page.tsx`
- [ ] Tests manuels avec scanner USB réel
- [ ] Paramétrisation timing validée
- [ ] Documentation utilisateur écrite
- [ ] Code review effectuée

---

## Configuration scanner (exemples)

### Honeywell (par défaut, rapide)

```typescript
useBarcodeScan({
  onScan,
  averageKeyPressTime: 15, // Très rapide
  scanTimeout: 100,
});
```

### Zebra (plus lent)

```typescript
useBarcodeScan({
  onScan,
  averageKeyPressTime: 80, // Plus lent
  scanTimeout: 150,
});
```

### Générique (équilibré)

```typescript
useBarcodeScan({
  onScan,
  averageKeyPressTime: 40, // Par défaut
  scanTimeout: 100,
});
```

---

## Dépannage

### Le hook ne détecte rien

1. Vérifier que le scanner envoie vraiment des caractères (test avec notepad)
2. Augmenter `scanTimeout` à 200ms
3. Réduire `averageKeyPressTime` si scanner très rapide

### Faux positifs (texte humain détecté comme scan)

1. Augmenter `minLength` à 10 ou 12
2. Diminuer `averageKeyPressTime` pour être plus strict

### Performance dégradée

1. Réduire `frequency` du Quagga2 (par défaut: 10)
2. Utiliser `halfSample: true` dans config Quagga2
3. Limiter les lecteurs Quagga2 aux formats réellement utilisés

---

## Prochaines étapes après v1.0

- [ ] Ajouter Quagga2 pour caméra (v1.5)
- [ ] Intégration stock automatique (v2.0)
- [ ] WebHID API pour scanners propriétaires (v2.0)
- [ ] Analytics codes-barres (v3.0)

---

## Ressources

- [Rapport complet](./BARCODE_SCANNER_INTEGRATION_REPORT.md)
- [GitHub: quagga2](https://github.com/ericblade/quagga2)
- [GitHub: use-scan-detection](https://github.com/markjaniczak/use-scan-detection)
- [Scanbot: Quagga2 vs html5-qrcode](https://scanbot.io/blog/quagga2-vs-html5-qrcode-scanner/)

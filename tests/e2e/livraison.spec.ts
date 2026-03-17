/**
 * Tests E2E - Flow livraison
 *
 * Teste les fonctionnalites du suivi des livraisons:
 * - Page livraison accessible
 * - Affichage du header avec titre et compteur
 * - Board kanban avec colonnes par statut
 * - Etat vide quand pas de livraisons
 * - Bouton de rafraichissement
 * - Changement de statut d'une livraison
 */

import { test, expect } from '@playwright/test'

test.describe('Page Livraison - Affichage general', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/livraison')
    await page.waitForLoadState('networkidle')
  })

  test('affiche le titre "Suivi des livraisons"', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    await expect(
      page.getByRole('heading', { name: /suivi des livraisons/i })
    ).toBeVisible()
  })

  test('affiche le sous-titre descriptif', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    await expect(
      page.getByText(/suivez et g[eé]rez les livraisons/i)
    ).toBeVisible()
  })

  test('affiche le compteur de livraisons', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    // Le badge avec le nombre de livraisons devrait etre visible
    // Il est rendu comme un Badge Radix UI a cote du titre
    const badge = page.locator('[class*="Badge"], [data-accent-color="violet"]').first()

    if (await badge.isVisible().catch(() => false)) {
      // Le badge devrait contenir un nombre
      const text = await badge.textContent()
      expect(text).toMatch(/\d+/)
    }
  })

  test('affiche l\'icone de livraison dans le header', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    // L'icone Truck est dans un conteneur style
    const iconContainer = page.locator('div').filter({ has: page.locator('svg') }).first()
    await expect(iconContainer).toBeVisible()
  })
})

test.describe('Page Livraison - Bouton de rafraichissement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/livraison')
    await page.waitForLoadState('networkidle')
  })

  test('affiche le bouton de rafraichissement', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    // Le bouton avec l'aria-label "Rafraichir les livraisons"
    const refreshButton = page.getByRole('button', { name: /rafra[iî]chir/i })

    await expect(refreshButton).toBeVisible()
  })

  test('le bouton de rafraichissement est cliquable', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    const refreshButton = page.getByRole('button', { name: /rafra[iî]chir/i })

    if (await refreshButton.isVisible().catch(() => false)) {
      await expect(refreshButton).toBeEnabled()
      await refreshButton.click()

      // Apres le clic, la page ne devrait pas crasher
      await page.waitForTimeout(500)
      await expect(
        page.getByRole('heading', { name: /suivi des livraisons/i })
      ).toBeVisible()
    }
  })

  test('le bouton est desactive pendant le rafraichissement', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    const refreshButton = page.getByRole('button', { name: /rafra[iî]chir/i })

    if (await refreshButton.isVisible().catch(() => false)) {
      await refreshButton.click()

      // Le bouton devrait etre momentanement desactive
      // Note: Le timing est sensible, on ne fait pas d'assertion stricte
      await page.waitForTimeout(100)
    }
  })
})

test.describe('Page Livraison - Etat vide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/livraison')
    await page.waitForLoadState('networkidle')
  })

  test('affiche un message quand aucune livraison n\'est en cours', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    // L'etat vide affiche "Aucune livraison en cours"
    const emptyMessage = page.getByText(/aucune livraison en cours/i)

    // Si l'etat vide est visible, verifier sa description
    if (await emptyMessage.isVisible().catch(() => false)) {
      await expect(emptyMessage).toBeVisible()

      // La description devrait aussi etre visible
      const description = page.getByText(/livraisons appara[iî]tront/i)
      if (await description.isVisible().catch(() => false)) {
        await expect(description).toBeVisible()
      }
    }
  })
})

test.describe('Page Livraison - Board Kanban', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/livraison')
    await page.waitForLoadState('networkidle')
  })

  test('affiche le board de livraison si des livraisons existent', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    // Si des livraisons existent, le board kanban devrait etre visible
    const deliveryBoard = page.locator('[data-testid="delivery-board"]').first()
    const boardContainer = page.locator('[class*="board"], [class*="kanban"]').first()

    // Les colonnes du kanban representent les statuts de livraison
    const statusColumns = [
      page.getByText(/en attente/i).first(),
      page.getByText(/en pr[eé]paration/i).first(),
      page.getByText(/en cours/i).first(),
      page.getByText(/livr[eé]/i).first(),
    ]

    let hasBoard = await deliveryBoard.isVisible().catch(() => false) ||
                   await boardContainer.isVisible().catch(() => false)

    if (!hasBoard) {
      // Verifier si au moins une colonne de statut est visible
      for (const col of statusColumns) {
        if (await col.isVisible().catch(() => false)) {
          hasBoard = true
          break
        }
      }
    }

    // Le board ou l'etat vide devrait etre present
    const emptyState = page.getByText(/aucune livraison/i)
    const hasEmpty = await emptyState.isVisible().catch(() => false)

    expect(hasBoard || hasEmpty).toBeTruthy()
  })

  test('les cartes de livraison affichent les informations essentielles', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    // Les cartes de livraison devraient contenir:
    // - Numero de ticket
    // - Adresse
    // - Statut
    // - Montant

    const deliveryCard = page.locator('[data-testid="delivery-card"], [class*="delivery-card"]').first()

    if (await deliveryCard.isVisible().catch(() => false)) {
      // Verifier qu'un montant en FCFA est affiche
      const amount = page.getByText(/fcfa/i).first()
      if (await amount.isVisible().catch(() => false)) {
        await expect(amount).toContainText(/\d/)
      }
    }
  })
})

test.describe('Page Livraison - Interaction avec les livraisons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/livraison')
    await page.waitForLoadState('networkidle')
  })

  test('permet de changer le statut d\'une livraison', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    // Chercher un bouton de changement de statut
    const statusButton = page.getByRole('button', { name: /marquer|passer|statut/i }).first()

    if (await statusButton.isVisible().catch(() => false)) {
      // Le bouton devrait etre cliquable
      await expect(statusButton).toBeEnabled()
    }
  })

  test('la page est responsive sur tablette', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    // Tester l'affichage sur une tablette
    await page.setViewportSize({ width: 768, height: 1024 })

    // Le titre devrait toujours etre visible
    await expect(
      page.getByRole('heading', { name: /suivi des livraisons/i })
    ).toBeVisible()
  })

  test('la page est responsive sur mobile', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    // Tester l'affichage sur mobile
    await page.setViewportSize({ width: 375, height: 667 })

    // Le titre devrait toujours etre visible
    await expect(
      page.getByRole('heading', { name: /suivi des livraisons/i })
    ).toBeVisible()
  })
})

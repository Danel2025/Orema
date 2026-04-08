# Audit de compatibilite - Export statique Tauri

## Resume

- **Total fichiers incompatibles** : 82+
  - Server Actions : 44 fichiers (toutes les fonctions avec `"use server"`)
  - API Routes : 24 fichiers route handler
  - Auth/Session : 5 fichiers critiques
  - Server Components (data fetching) : 14 pages
  - Autres (audit, cache, lib) : 5 fichiers
- **Effort estime** : Tres eleve
- **Risque** : Eleve - Le projet est profondement construit autour du modele SSR de Next.js

---

## 1. Server Actions (actions/)

Avec `output: 'export'`, **toutes** les Server Actions (`"use server"`) sont incompatibles. Elles ne peuvent pas s'executer car il n'y a pas de serveur Node.js.

### Pattern commun

Toutes les Server Actions suivent ce pattern :
1. Appel a `getCurrentUser()` (qui utilise `cookies()` de `next/headers`)
2. Creation d'un client Supabase serveur via `createClient()` (utilise `cookies()`) ou `createServiceClient()` (service role key)
3. Operations DB via Supabase
4. Appels a `revalidatePath()` (188 occurrences dans 29 fichiers)

### Tableau complet

| Fichier | Fonctions exportees | Type d'incompatibilite | Effort | Solution recommandee |
|---------|-------------------|----------------------|--------|---------------------|
| `actions/auth.ts` | `login`, `loginWithPin`, `logout`, `createUser`, `updatePassword`, `updatePin`, `getCurrentUser` | cookies(), createClient(), session JWT, redirect | Eleve | Migrer vers auth client-side avec Supabase Browser Client |
| `actions/auth-supabase.ts` | `loginWithSupabase`, `loginWithPinSupabase`, `logoutSupabase`, `getCurrentUserSupabase`, `createSupabaseUser`, `updateSupabasePassword`, `getDefaultRedirectRoute` | cookies(), createClient(), revalidatePath | Eleve | Migrer vers Supabase Auth client-side |
| `actions/ventes.ts` | `createVente`, `createVenteEnAttente`, `payerVenteEnAttente`, `addToVenteEnAttente`, `annulerVenteEnAttente`, `createVenteEnCompte`, `getVentesJour`, `getStatsJour`, `getVentesEnAttente`, `getVenteEnAttenteByTable`, `getVentesEnAttenteCount` | createClient(), createServiceClient(), revalidatePath | Eleve | Convertir en appels Supabase client-side via browser client |
| `actions/produits.ts` | `getProduitsPaginated`, `getProduits`, `getProduitById`, `createProduit`, `updateProduit`, `deleteProduit`, `toggleProduitActif`, `updateStock`, `exportProduitsCSV`, `getCSVTemplate`, `parseCSVImport`, `importProduitsCSV` | createClient(), revalidatePath | Moyen | Services client-side avec Supabase browser client |
| `actions/categories.ts` | `getCategories`, `getCategorieById`, `createCategorie`, `updateCategorie`, `deleteCategorie`, `reorderCategories`, `toggleCategorieActif`, `getImprimantes` | createClient(), revalidatePath | Moyen | Services client-side |
| `actions/clients.ts` | `getClients`, `getClientById`, `createClient`, `updateClient`, `deleteClient`, `rechargerComptePrepaye`, `getHistoriqueComptePrepaye`, `calculerPointsFidelite`, `getHistoriqueFidelite`, `ajouterPointsFidelite`, `getHistoriqueAchats`, `getStatistiquesClient`, `searchClients`, `createClientQuick` | createClient(), revalidatePath | Moyen | Services client-side |
| `actions/employes.ts` | `generateRandomPin`, `getEmployes`, `getEmployeById`, `createEmploye`, `updateEmploye`, `resetEmployePin`, `resetEmployePassword`, `toggleEmployeStatus`, `deleteEmploye`, `syncEmployeToSupabase`, `getEmployeStats`, `getRoleAllowedRoutes`, `saveRoleAllowedRoutes`, `updateEmployeAllowedRoutes` | createClient(), createServiceClient(), revalidatePath | Eleve | Necessite service client pour sync auth |
| `actions/tables.ts` | `getTables`, `getTableById`, `getZones`, `createZone`, `createTable`, `updateTable`, `deleteTable`, `updateTablePosition`, `updateTablesPositions`, `updateTableStatut`, `libererTable`, `getTablesStats`, `transferTable`, `mergeTableOrders`, `getTableVenteDetails`, `getTablesForTransfer`, `updateZone`, `deleteZone`, `reorderZones`, `getZonesWithTableCount`, `updateZonesPositions` | createClient(), revalidatePath | Moyen | Services client-side |
| `actions/sessions.ts` | `getActiveSession`, `hasActiveSession`, `openSession`, `closeSession`, `getSessionStats`, `getSessionsHistory`, `generateRapportZ` | createClient(), createServiceClient(), revalidatePath | Moyen | Services client-side |
| `actions/caisse.ts` | `getCaisseData`, `getCaisseDataCached`, `getCaisseInitialData`, `getCaisseStats`, `getCaisseSession`, `loadCaissePage` | createClient(), createServiceClient(), unstable_cache | Moyen | Remplacer cache serveur par TanStack Query |
| `actions/rapports.ts` | `getKPIs`, `getCAByPeriod`, `getTopProducts`, `getPeakHours`, `getSalesByPaymentMode`, `getSalesByType`, `getSalesByEmployee`, `getClosedSessions`, `getHistoriqueFactures`, `genererRapportZAction`, `getFactureDetail` | createClient(), createServiceClient() | Moyen | Services client-side |
| `actions/stocks.ts` | `getStockStatus`, `createMovement`, `getMovementHistory`, `getStockAlerts`, `getStockValuation`, `getInventoryProducts`, `submitInventory`, `getStockCategories`, `exportStockCSV` | createClient(), revalidatePath | Moyen | Services client-side |
| `actions/parametres.ts` | 27 fonctions (CRUD etablissement, fiscal, imprimantes, zones livraison, caisse, stock, fidelite, securite, plan salle, reset, facturation) | createClient(), createServiceClient(), revalidatePath | Eleve | Gros volume, services client-side |
| `actions/preparation.ts` | `updatePreparationStatus`, `updateBulkPreparationStatus`, `getPendingOrders` | createClient(), createServiceClient(), revalidatePath | Moyen | Services client-side |
| `actions/livraison.ts` | `creerLivraison`, `assignerLivreur`, `updateStatutLivraison`, `getLivraisonsEnCours`, `getLivraisonByVente`, `getHistoriqueLivraison`, `getStatistiquesLivraison`, `estimerTempsLivraison` | createClient(), revalidatePath | Moyen | Services client-side |
| `actions/split-bill.ts` | `splitBillEqual`, `splitBillCustom`, `splitBillByItems`, `payPart`, `createSplitVente` | createClient(), revalidatePath | Moyen | Services client-side |
| `actions/backup.ts` | `createBackup`, `listBackups`, `downloadBackup`, `deleteBackup`, `getBackupStats` | createServiceClient(), revalidatePath, fs operations | Eleve | Necessite backend externe (fs operations incompatibles) |
| `actions/billing.ts` | `initiatePayment`, `getPaymentStatus`, `getInvoices`, `downloadInvoice` | createClient(), createServiceClient() | Eleve | Paiements necessitent backend (cles secretes) |
| `actions/subscriptions.ts` | `getCurrentSubscription`, `upgradePlan`, `downgradePlan`, `cancelSubscription`, `reactivateSubscription`, `getCustomerPortalUrl` | createClient(), createServiceClient() | Eleve | Paiements necessitent backend (cles secretes Stripe) |
| `actions/mobile-money.ts` | `initMobileMoneyPayment`, `checkMobileMoneyStatus`, `cancelMobileMoneyPayment` | createClient(), createServiceClient() | Eleve | API Monetbil necessite backend (cles secretes) |
| `actions/ecrans.ts` | `getEcrans`, `getEcranById`, `createEcran`, `updateEcran`, `deleteEcran`, `regenererToken`, `prolongerToken`, `getEcranByToken` | createClient(), revalidatePath | Moyen | Services client-side |
| `actions/notifications.ts` | `fetchNotifications`, `fetchUnreadCount`, `creerNotification`, `broadcastNotification`, `marquerCommeLue`, `marquerToutesLues`, `supprimerNotification`, `supprimerNotificationsLues` | createClient(), createServiceClient() | Moyen | Services client-side |
| `actions/permissions.ts` | `getRolePermissionConfig`, `getAllRolePermissionConfigs`, `updateRolePermissions`, `togglePermission`, `resetRolePermissionsToDefaults`, `enableAllPermissionsInGroup`, `disableAllPermissionsInGroup` | createClient(), revalidatePath | Moyen | Services client-side |
| `actions/csv.ts` | `importProductsFromCSV`, `exportProducts`, `exportVentes`, `exportClients` | createClient(), revalidatePath | Moyen | Services client-side |
| `actions/tarification.ts` | 10 fonctions (regles, historique, tarifs horaires, config) | createClient(), revalidatePath | Moyen | Services client-side |
| `actions/approbation-remises.ts` | `demanderApprobationRemise`, `traiterApprobation`, `getApprobationsPendantesAction`, `getApprobationsHistoriqueAction` | createClient(), revalidatePath | Moyen | Services client-side |
| `actions/audit.ts` | `createAuditLog`, `logCreate`, `logUpdate`, `logDelete`, `logCaisseOuverture`, `logCaisseCloture`, `logAnnulationVente`, `logRemiseAppliquee`, `getAuditLogs`, `exportAuditLogs`, `getAuditStats` | createClient(), createServiceClient() | Moyen | Services client-side |
| `actions/supplements.ts` | `getSupplements`, `createSupplement`, `updateSupplement`, `deleteSupplement` | createClient(), revalidatePath | Faible | Services client-side |
| `actions/sms.ts` | 11 fonctions d'envoi SMS | createServiceClient() | Eleve | Necessite backend (cles API SMS) |
| `actions/register.ts` | `registerWithEtablissement` | createServiceClient() | Eleve | Necessite backend (creation admin Supabase) |
| `actions/seed-data.ts` | `loadSeedData`, `resetAndLoadSeedData`, `getSeedDataPreview` | createServiceClient(), revalidatePath | Moyen | Services client-side |
| `actions/sync-users.ts` | `syncAuthToUtilisateurs`, `syncUtilisateurToAuth`, `checkSyncStatus` | createServiceClient() | Eleve | Necessite service role key |
| `actions/pin-unlock.ts` | `verifyPinForUnlock` | createClient() | Faible | Service client-side |
| `actions/admin/etablissements.ts` | `getAllEtablissements`, `deleteEtablissement`, `createEtablissement`, `updateEtablissement`, `suspendEtablissement`, `reactivateEtablissement`, `getEtablissementDetail`, `getEtablissementStats`, `getEtablissementUsers`, `searchEtablissements`, `getEtablissementName` | createServiceClient(), revalidatePath | Eleve | Necessite service role key |
| `actions/admin/etablissements-abonnements.ts` | `getAbonnement`, `updateAbonnement`, `checkQuotas`, `getAbonnementHistory`, `getPaymentHistory`, `getAbonnementFull` | createServiceClient(), revalidatePath | Moyen | Service client-side |
| `actions/admin/etablissements-audit.ts` | `getAuditLogs`, `getAuditStats` | createServiceClient() | Faible | Service client-side |
| `actions/admin/etablissements-bulk.ts` | `bulkUpdateSettings`, `bulkSuspend`, `bulkReactivate` | createServiceClient(), revalidatePath | Moyen | Service client-side |
| `actions/admin/etablissements-export.ts` | `exportEtablissementData` | createServiceClient() | Faible | Service client-side |
| `actions/admin/etablissements-facturation.ts` | `createFacture`, `listFactures`, `markFacturePaid`, `getFactureDetail` | createServiceClient(), revalidatePath | Moyen | Service client-side |
| `actions/admin/etablissements-impersonation.ts` | `startImpersonation`, `stopImpersonation`, `getImpersonationStatus` | createServiceClient(), cookies() | Eleve | Necessite cookies + service role |
| `actions/admin/etablissements-notifications.ts` | `getNotifications`, `markAsRead`, `markAllAsRead`, `getUnreadCount`, `createAlert` | createServiceClient(), revalidatePath | Moyen | Service client-side |
| `actions/admin/blog.ts` | 16 fonctions (CRUD posts, categories, auteurs, tags, stats) | createServiceClient(), revalidatePath | Moyen | Service client-side |
| `actions/admin/documentation.ts` | 20 fonctions (CRUD categories, articles, stats) | createServiceClient(), revalidatePath | Moyen | Service client-side |
| `actions/admin/billing-stats.ts` | `getBillingDashboardData` | createServiceClient() | Faible | Service client-side |

---

## 2. API Routes (app/api/)

Avec `output: 'export'`, **toutes** les API Routes sont supprimees. Elles n'existent pas dans un build statique.

| Route | Methodes | Usage | Effort | Solution |
|-------|----------|-------|--------|----------|
| `api/auth/me` | GET | Recupere l'utilisateur courant via `getCurrentUser()` (cookies) | Moyen | Remplacer par appel direct Supabase client-side `supabase.auth.getUser()` |
| `api/categories/cache` | GET | Cache des categories via `createClient()` (cookies) | Faible | Appel direct Supabase browser client |
| `api/clear-session` | POST | Nettoyage sessions JWT + Supabase, manipulation cookies | Moyen | Gerer cote client : `supabase.auth.signOut()` + supprimer cookie manuellement |
| `api/cron/check-subscriptions` | GET | Cron job verification abonnements, `createServiceClient()` | Eleve | **Necessite backend externe** (cron + service role key) |
| `api/display/auth` | GET | Auth ecran d'affichage via token, `createServiceClient()` | Moyen | Migrer vers Edge Function Supabase ou appel client |
| `api/display/orders` | GET | Commandes pour ecran, `createServiceClient()` | Moyen | Supabase realtime client-side |
| `api/display/status` | POST | Update statut ecran, `createServiceClient()` | Moyen | Appel client avec RLS |
| `api/health` | GET | Health check DB via `createClient()` (cookies) | Faible | Peut etre supprime (Tauri n'a pas besoin de health check HTTP) |
| `api/print/route` | POST | Impression ESC/POS, `createServiceClient()` | Eleve | **Migrer vers Tauri commands** (acces direct USB/reseau) |
| `api/print/auto-route` | POST | Routage auto imprimantes, `createClient()` | Eleve | **Migrer vers Tauri commands** |
| `api/print/scan` | POST | Scan reseau imprimantes, utilise `os` et `net` Node.js | Eleve | **Migrer vers Tauri commands** (acces systeme natif) |
| `api/print/send-raw` | POST | Envoi RAW ESC/POS, `createClient()` | Eleve | **Migrer vers Tauri commands** |
| `api/print/test-connection` | POST | Test connexion imprimante, `getCurrentUser()` | Eleve | **Migrer vers Tauri commands** |
| `api/produits/route` | GET, POST | CRUD produits via `createClient()` | Moyen | Services client-side Supabase |
| `api/produits/[id]` | GET, PUT, PATCH, DELETE | CRUD produit par ID via `createClient()` | Moyen | Services client-side Supabase |
| `api/produits/barcode` | GET | Recherche par code-barres via `createClient()` | Faible | Appel client-side Supabase |
| `api/produits/cache` | GET | Cache produits via `createClient()` | Faible | Appel client-side Supabase |
| `api/setup` | GET | Setup initial, `createClient()` | Faible | Page client-side |
| `api/setup-auth` | GET | Setup auth Supabase admin, `createClient` + admin client | Eleve | **Necessite backend externe** (admin key) |
| `api/upload` | POST | Upload fichiers, `fs.writeFile`, `getCurrentUser()` | Eleve | **Migrer vers Supabase Storage** client-side ou Tauri fs |
| `api/ventes/sync` | POST, DELETE | Sync offline ventes, `createClient()` | Moyen | Client-side Supabase |
| `api/ventes/validate` | POST | Validation vente, `createClient()` | Moyen | Client-side Supabase |
| `api/webhooks/monetbil` | POST | Webhook Monetbil (paiements mobile money), `createServiceClient()` | Eleve | **Necessite backend externe** (webhook endpoint public) |
| `api/webhooks/stripe` | POST | Webhook Stripe (paiements), `createServiceClient()` | Eleve | **Necessite backend externe** (webhook endpoint public + secret) |

---

## 3. Authentification

### Flow actuel (incompatible avec export statique)

```
Request HTTP
  --> app/(dashboard)/layout.tsx (Server Component)
    --> getCurrentUser() (lib/auth/supabase.ts)
      --> getSession() (lib/auth/session.ts) : cookies() de next/headers
      --> createServiceClient() (lib/supabase/server.ts) : env SUPABASE_SERVICE_ROLE_KEY
      --> getSupabaseUser() : createClient() avec cookies()
    --> getPermissionsForRole() (lib/permissions-db.ts) : DB query
    --> getAllowedRoutesForRole() : DB query
  --> redirect("/login") si non authentifie
  --> DashboardProviders (Client Component) recoit AuthUser + permissions
```

### Fichiers critiques

| Fichier | Role | Incompatibilite |
|---------|------|-----------------|
| `lib/auth/session.ts` | Sessions JWT custom (PIN auth) | `cookies()` de `next/headers`, `createHmac` de `crypto` (Node.js) |
| `lib/auth/supabase.ts` | Auth Supabase principale | `createClient()` serveur (cookies), `createServiceClient()` (service key), `redirect()` serveur |
| `lib/auth/index.ts` | Re-exports | Pas d'incompatibilite directe (re-export) |
| `lib/auth/context.tsx` | Contexte React client | Compatible (deja client-side) |
| `lib/supabase/server.ts` | Client Supabase serveur | `cookies()` de `next/headers` - **coeur du probleme** |
| `lib/supabase/client.ts` | Client Supabase navigateur | Compatible (deja client-side) |
| `lib/db/client.ts` | Clients DB | Re-export de `server.ts` + `createAuthenticatedClient()` utilise `createServiceClient()` |
| `lib/audit.ts` | Logs d'audit | `headers()` de `next/headers` |

### Ce qui doit changer

1. **Guard d'authentification** : Le layout serveur `app/(dashboard)/layout.tsx` ne peut plus appeler `getCurrentUser()` cote serveur. La protection doit etre faite cote client via `useAuth()` + redirect client.
2. **Session JWT custom** : Le systeme JWT utilise `cookies()` et `crypto` Node.js. Pour Tauri, utiliser Supabase Auth nativement ou stocker le token dans le secure store Tauri.
3. **Service Role Key** : `SUPABASE_SERVICE_ROLE_KEY` ne doit **JAMAIS** etre expose cote client. Les operations admin necessitent une Edge Function Supabase ou un backend.
4. **`export const dynamic = "force-dynamic"`** et **`export const fetchCache = "force-no-store"`** dans le layout dashboard sont incompatibles avec l'export statique.

---

## 4. Server Components (data fetching cote serveur)

Ces pages sont des Server Components (async) qui appellent des Server Actions ou font des requetes DB directement. Elles doivent etre converties en Client Components avec du data fetching cote client.

| Fichier | Imports incompatibles | Data fetching | Solution |
|---------|----------------------|---------------|----------|
| `app/(dashboard)/layout.tsx` | `getCurrentUser()`, `getPermissionsForRole()`, `redirect()` serveur, `dynamic = "force-dynamic"` | Auth check + permissions depuis DB | Convertir en client layout avec `useEffect` + auth guard client |
| `app/(dashboard)/dashboard/page.tsx` | `createClient()`, `getKPIs()`, `getTopProducts()`, `getHistoriqueFactures()`, `db.*` | 7 queries paralleles | Convertir en Client Component avec TanStack Query |
| `app/(dashboard)/cuisine/page.tsx` | `getCurrentUser()`, `getPendingOrders()`, `redirect()` | Auth + commandes cuisine | Client Component avec auth hook |
| `app/(dashboard)/bar/page.tsx` | `getCurrentUser()`, `getPendingOrders()`, `redirect()` | Auth + commandes bar | Client Component avec auth hook |
| `app/(dashboard)/salle/page.tsx` | `getTables()`, `getZonesWithTableCount()`, `getTablesStats()`, `getTableById()` | 4 queries paralleles | Client Component avec TanStack Query |
| `app/(dashboard)/livraison/page.tsx` | `getLivraisonsEnCours()` | Livraisons en cours | Client Component |
| `app/(dashboard)/rapports/page.tsx` | `getKPIs()` (dans KPICardsServer async component) | KPIs | Client Component |
| `app/(dashboard)/parametres/page.tsx` | 14 imports d'actions (toutes les settings) | Multiples queries | Client Component avec TanStack Query |
| `app/(dashboard)/parametres/abonnement/page.tsx` | `getCurrentSubscription()`, `getInvoices()`, `getCurrentUser()`, `createClient()` | Abonnement + factures | Client Component |
| `app/(dashboard)/parametres/tarification/page.tsx` | `getReglesTarificationAction()`, `getConfigTarificationAction()`, etc. | Tarification rules | Client Component |
| `app/(dashboard)/admin/billing/page.tsx` | `getBillingDashboardData()` | Billing stats | Client Component |
| `app/(dashboard)/stocks/inventaire/page.tsx` | Aucun (simple wrapper) | - | Compatible tel quel |
| `app/(dashboard)/page.tsx` | `redirect()` serveur | Redirect vers /dashboard | Convertir en client redirect |
| `app/display/[id]/page.tsx` | `getEcranByToken()`, `generateMetadata()` | Auth ecran + metadata dynamique | Client Component, supprimer generateMetadata |

---

## 5. Routes dynamiques

Les routes avec segments dynamiques (`[param]`) necessitent `generateStaticParams()` en mode export statique, ou doivent etre converties en routes client-side.

| Route | Segment dynamique | `generateStaticParams` present ? | Solution |
|-------|-------------------|----------------------------------|----------|
| `app/(dashboard)/admin/etablissements/[id]/page.tsx` | `[id]` | Non | Convertir en Client Component avec `useParams()` |
| `app/(dashboard)/admin/etablissements/[id]/abonnement/page.tsx` | `[id]` | Non | Convertir en Client Component |
| `app/(dashboard)/admin/etablissements/[id]/facturation/page.tsx` | `[id]` | Non | Convertir en Client Component |
| `app/(dashboard)/admin/contenu/blog/[postId]/page.tsx` | `[postId]` | Non | Deja "use client" - compatible |
| `app/(dashboard)/admin/contenu/documentation/[categoryId]/page.tsx` | `[categoryId]` | Non | Deja "use client" - compatible |
| `app/(dashboard)/admin/contenu/documentation/[categoryId]/articles/[articleId]/page.tsx` | `[categoryId]`, `[articleId]` | Non | Deja "use client" - compatible |
| `app/(dashboard)/admin/contenu/documentation/[categoryId]/articles/nouveau/page.tsx` | `[categoryId]` | Non | Deja "use client" - compatible |
| `app/(public)/blog/[slug]/page.tsx` | `[slug]` | Non | Deja "use client" - compatible |
| `app/(public)/docs/[category]/page.tsx` | `[category]` | Non | Deja "use client" - compatible |
| `app/(public)/docs/[category]/[slug]/page.tsx` | `[category]`, `[slug]` | Non | Deja "use client" - compatible via `useParams()` |
| `app/display/[id]/page.tsx` | `[id]` | Non | Convertir en Client Component avec `useParams()` |

---

## 6. Autres incompatibilites

### next.config.ts

| Element | Incompatibilite | Solution |
|---------|----------------|----------|
| `headers()` async function | Non supporte en export statique | Supprimer (Tauri gere les headers nativement) |
| `experimental.serverActions.bodySizeLimit` | Non applicable | Supprimer |
| `images.remotePatterns` | `next/image` optimisation non supportee | Ajouter `unoptimized: true` ou utiliser `<img>` |

### next/image

11 fichiers utilisent `next/image`. L'optimisation d'image necessite un serveur. Solutions :
- Ajouter `unoptimized: true` dans `next.config.ts` (images servies telles quelles)
- Ou utiliser un loader externe (Cloudinary, Imgix)

Fichiers concernes : `components/layout/header.tsx`, `components/layout/sidebar.tsx`, `components/landing/demo-section.tsx`, `components/landing/hero.tsx`, `components/landing/navbar.tsx`, `components/landing/footer.tsx`, `components/landing/payment-marquee.tsx`, `app/(dashboard)/admin/layout.tsx`, `app/(dashboard)/admin/page.tsx`, `app/(auth)/register/page.tsx`, `app/(auth)/login/page.tsx`

### Metadata dynamique

| Fichier | Probleme |
|---------|----------|
| `app/display/[id]/page.tsx` | `generateMetadata()` dynamique - necessite appel serveur |
| `app/layout.tsx` | `metadata` et `viewport` statiques - **compatible** |

### revalidatePath / revalidateTag

188 appels a `revalidatePath()` repartis dans 29 fichiers d'actions. Ces appels sont purement serveur et n'ont aucun effet en mode export statique. Ils doivent etre supprimes et remplaces par de l'invalidation de cache TanStack Query cote client (`queryClient.invalidateQueries()`).

### unstable_cache

1 utilisation dans `actions/caisse.ts` (`getCaisseDataCached`). Incompatible car c'est un cache serveur Node.js. Remplacer par TanStack Query avec `staleTime`.

### Node.js APIs

| Fichier | API Node.js | Usage |
|---------|-------------|-------|
| `lib/auth/session.ts` | `crypto.createHmac`, `crypto.timingSafeEqual`, `Buffer` | Signature JWT |
| `app/api/upload/route.ts` | `fs/promises.writeFile`, `fs/promises.mkdir`, `path` | Upload fichiers |
| `app/api/print/scan/route.ts` | `os.networkInterfaces`, `net.Socket` | Scan reseau imprimantes |

---

## 7. Recommandations - Strategie de migration par phases

### Phase 1 : Infrastructure (prerequis)

**Effort : Moyen | Priorite : Critique**

1. **next.config.ts** : Ajouter `output: 'export'` conditionnel, `images.unoptimized: true`
2. **Creer `lib/supabase/tauri-client.ts`** : Client Supabase qui fonctionne sans cookies (utilise le token en memoire ou Tauri secure store)
3. **Creer `lib/services/`** : Couche de services client-side qui remplace les Server Actions (memes signatures, mais utilise le browser client)
4. **Configurer TanStack Query** comme remplacement de `revalidatePath` et `unstable_cache`

### Phase 2 : Authentification

**Effort : Eleve | Priorite : Critique**

1. Convertir `app/(dashboard)/layout.tsx` en Client Component avec guard auth
2. Migrer `getCurrentUser()` vers une version client-side utilisant `supabase.auth.getUser()` + query DB client
3. Remplacer le systeme JWT custom (PIN) par un token stocke en memoire ou dans Tauri secure store
4. Supprimer les `redirect()` serveur - utiliser `router.push()` client

### Phase 3 : Server Actions --> Services client-side

**Effort : Tres eleve | Priorite : Haute**

Pour chaque fichier dans `actions/` :
1. Creer un fichier miroir dans `lib/services/` avec les memes fonctions
2. Remplacer `createClient()` serveur par le browser client Supabase
3. Remplacer `createServiceClient()` par le browser client (avec RLS) ou une Edge Function Supabase
4. Supprimer tous les `revalidatePath()` - invalider via TanStack Query
5. Mettre a jour tous les imports dans les composants

**ATTENTION** : Les operations utilisant `createServiceClient()` (qui bypass RLS) necessitent une solution speciale :
- Soit des Edge Functions Supabase (recommande)
- Soit des politiques RLS plus permissives pour les roles admin
- Soit un backend minimal externe

### Phase 4 : API Routes

**Effort : Moyen a Eleve | Priorite : Haute**

| Categorie | Routes | Solution |
|-----------|--------|----------|
| **Supprimer** | `api/health`, `api/setup`, `api/categories/cache`, `api/produits/cache` | Plus necessaires ou remplaces par appels directs |
| **Client-side** | `api/auth/me`, `api/produits/*`, `api/ventes/*`, `api/display/*` | Remplacer par services client-side |
| **Tauri commands** | `api/print/*`, `api/upload` | Migrer vers Tauri invoke() pour acces systeme |
| **Backend externe** | `api/webhooks/*`, `api/cron/*`, `api/setup-auth` | Edge Functions Supabase ou serveur externe |
| **Special** | `api/clear-session` | Client-side : `supabase.auth.signOut()` |

### Phase 5 : Server Components

**Effort : Moyen | Priorite : Haute**

Convertir les 14 pages Server Component en Client Components :
- Remplacer les appels directs aux actions par des hooks TanStack Query
- Remplacer les `redirect()` serveur par `router.push()`
- Gerer les etats de chargement (deja partiellement fait avec Suspense)

### Phase 6 : Operations necessitant un backend

**Effort : Eleve | Priorite : Moyenne**

Certaines operations ne peuvent **jamais** tourner cote client :
1. **Webhooks** (Stripe, Monetbil) : Deployer comme Edge Functions Supabase
2. **Cron jobs** (check-subscriptions) : Utiliser Supabase Scheduled Functions ou un service externe
3. **Operations admin** avec service role key : Edge Functions avec verification du role
4. **SMS** : Edge Function avec cles API
5. **Backup** avec acces filesystem : Tauri commands

---

## 8. Impact sur la securite

### Risques a gerer

1. **`SUPABASE_SERVICE_ROLE_KEY`** : Ne doit **JAMAIS** etre dans le bundle client/Tauri. Toutes les operations l'utilisant doivent etre migrées vers des Edge Functions Supabase.

2. **`AUTH_SECRET`** (JWT signing) : Meme probleme. Si le systeme PIN est conserve, la verification JWT doit se faire via une Edge Function ou le token doit etre verifie par Supabase directement.

3. **RLS** : Actuellement, beaucoup d'actions utilisent `createServiceClient()` qui bypass RLS. En mode client-side, il faut soit :
   - Renforcer les politiques RLS pour couvrir tous les cas d'usage
   - Soit utiliser des Edge Functions pour les operations privilegiees

4. **Upload fichiers** : L'API upload actuelle ecrit sur le filesystem (`fs.writeFile`). Migrer vers **Supabase Storage** (client-side) ou Tauri filesystem API.

---

## 9. Synthese des efforts

| Categorie | Fichiers | Effort individuel | Effort total |
|-----------|----------|-------------------|-------------|
| Auth/Session | 5 | Eleve | Tres eleve |
| Dashboard layout | 1 | Eleve | Eleve |
| Server Actions (simples - CRUD) | ~25 | Moyen | Tres eleve (volume) |
| Server Actions (complexes - paiements, admin) | ~19 | Eleve | Tres eleve |
| API Routes (client-side) | ~14 | Faible-Moyen | Moyen |
| API Routes (backend externe) | ~6 | Eleve | Eleve |
| API Routes (Tauri commands) | ~5 | Eleve | Eleve |
| Server Components | 14 | Moyen | Eleve |
| next.config.ts | 1 | Faible | Faible |
| next/image | 11 | Faible | Faible |
| revalidatePath migration | 29 | Faible | Moyen (volume) |
| **TOTAL** | **~82+** | - | **Tres eleve** |

**Estimation globale** : La migration vers l'export statique est un projet majeur. Le coeur du probleme est que l'application est construite autour du pattern Server Components + Server Actions de Next.js, avec une dependance forte aux cookies et au service role key cote serveur. La migration necessite de repenser entierement la couche d'acces aux donnees pour utiliser exclusivement le client Supabase navigateur, des Edge Functions pour les operations privilegiees, et les Tauri commands pour l'acces systeme (impression, fichiers).

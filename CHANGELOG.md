# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-23

### Added

#### Admin & Billing

- Admin billing dashboard with statistics and revenue tracking (`admin/billing/`)
- Establishment detail pages with audit logs, bulk operations, export, and impersonation (`admin/etablissements/[id]/`)
- Establishment notifications management (`admin/etablissements/notifications/`)
- Subscription management module with plan tiers and Stripe/Monetbil integration (`parametres/abonnement/`)
- Invoice generation and billing stats queries (`billing-stats.ts`, `factures.ts`)
- Billing actions for admin operations (`actions/admin/billing-stats.ts`, `etablissements-abonnements.ts`, `etablissements-facturation.ts`)
- Admin bulk operations and export actions (`etablissements-bulk.ts`, `etablissements-export.ts`)
- Admin impersonation and audit actions (`etablissements-impersonation.ts`, `etablissements-audit.ts`)

#### Tarification & Pricing

- Dynamic pricing rules engine (`lib/tarification/`)
- Time-based pricing (happy hour, peak hours) with tariff badge component
- Pricing history tracking (`historique-prix.ts`)
- Discount approval workflow with pending badge and restricted dialog
- Margin warning component for low-margin sales
- Tarification settings page (`parametres/tarification/`)
- Related Zod schemas and DB queries (`tarification.schema.ts`, `regles-tarification.ts`, `tarifs-horaires.ts`)

#### Kitchen & Bar Display Systems (KDS)

- Dedicated kitchen display page with real-time order tracking (`/cuisine/`)
- Dedicated bar display page (`/bar/`)
- Public-facing display screens for customer-facing monitors (`/display/`)
- Display API routes for real-time data (`api/display/`)
- Fullscreen hook for display screens (`useFullscreen.ts`)
- KDS alerts hook (`useKdsAlerts.ts`)
- Display screen settings (`parametres/ecrans-settings.tsx`)
- Display screen schema and E2E tests (`ecran.schema.ts`, `display.spec.ts`, `parametres-ecrans.spec.ts`)

#### Notifications

- In-app notification center with real-time updates (`notification-center.tsx`)
- Notification bridge provider for cross-component communication
- Real-time notification hooks (`useRealtimeNotifications.ts`, `useNotificationBridge.ts`)
- Notification store with Zustand (`notification-store.ts`)
- Admin notification queries and actions (`notifications.ts`, `notifications-admin.ts`)
- Notification schema validation (`notification.schema.ts`)

#### Public Pages

- Contact page (`/contact/`)
- Support/help center page (`/support/`)
- Changelog public page (`/changelog/`)
- Accessibility statement page (`/accessibility/`)
- System status page (`/status/`)
- API documentation page (`/docs/api/`)

#### Infrastructure & Database

- 14 new SQL migrations: initial schema, RLS functions, ticket number RPC, establishment status, audit logs, subscriptions, invoices, admin notifications, notifications table, report RPC functions, pricing rules, price history, discount approvals, hourly tariffs, tarification settings, plan harmonization, display screens
- Sitemap generation (`app/sitemap.ts`)
- Webhook API routes (`api/webhooks/`)
- Payment integrations: Stripe and Monetbil libraries (`lib/payments/`)
- Configuration module (`lib/config/`)
- Static data module (`lib/data/`)
- Seed data action and panel component (`actions/seed-data.ts`, `SeedDataPanel.tsx`)

#### POS Enhancements

- Caisse floor plan component for table selection from POS
- Preparation tracking actions (`actions/preparation.ts`)
- Rapports tabs component for improved report navigation
- Inventory header component for stock management
- Loading states for all major pages (caisse, clients, employes, produits, rapports, stocks, parametres, dashboard)

#### Testing

- New E2E tests for display screens and settings
- New unit tests for category destinations, display screens, and print router

### Changed

- Migrated to React 19 best practices (useSyncExternalStore patterns in hooks)
- Migrated Zod schemas to Zod 4 API where applicable
- Updated ESLint configuration for stricter rules
- Improved CI workflow (`.github/workflows/ci.yml`)
- Refactored dashboard content into dedicated component (`dashboard/content.tsx`)
- Updated all server actions with improved type safety and error handling
- Enhanced admin layout and admin page with billing integration
- Improved caisse page with floor plan and pricing features
- Updated parametres page with new settings sections
- Refined Radix UI Dialog usage for proper accessibility
- Improved Supabase client typing across the codebase
- Updated Three.js skills documentation (animation, fundamentals, geometry, interaction, lighting, loaders, materials, postprocessing, shaders, textures)
- Enhanced Phosphor Icons type handling for React 19 compatibility
- Updated TODO.md with current project status

### Fixed

- Resolved all TypeScript build errors (0 errors)
- Fixed ESLint violations (0 errors)
- Corrected Phosphor Icons type issues with React 19
- Fixed Radix UI Dialog accessibility warnings
- Fixed Supabase client type mismatches in server actions
- Corrected RLS context session scope in migration
- Fixed set_rls_context function for proper session-level variables

### Removed

- Removed `components/produits/import-produits.tsx` (replaced by improved import flow)
- Removed legacy logo SVG files (`public/images/logos/ic-lg.svg`, `lg-pf-fc.svg`, `lg-pf-fs.svg`, `lg-si-fc.svg`, `lg-si-fs.svg`)

## [1.0.0] - 2026-03-18

### Added

#### POS Core

- ESC/POS thermal printing (receipt, kitchen/bar slips, Z-report) with 80mm/58mm support
- Mobile Money integration (Airtel Money OAuth2 + Moov Money API) with retry and status tracking
- Z-Report generation with complete daily data collection and cash reconciliation
- Advanced reports: margins by product/category, TVA summary by rate, PDF and Excel exports
- Stock inventory workflow (3-step: selection, counting, validation) with discrepancy tracking
- Composite products with supplement selection and automatic price calculation
- Delivery tracking with kanban board UI (6 statuses, timeline, driver assignment)

#### Offline Mode

- IndexedDB-based offline storage (10 object stores) via `idb` library
- Mutation queue with FIFO processing and exponential backoff retry
- Sync engine with conflict detection and last-write-wins resolution
- Cache manager with stale-while-revalidate strategy and request deduplication
- Network status detection with ping verification
- Offline UI: navbar indicator, sync status popover, pending badge, dismissable banner

#### Real-time

- Supabase Realtime subscriptions for tables, orders, and stock alerts
- Live table status updates for floor plan
- Kitchen/bar order notifications with callbacks
- Low stock alert system with dismissable alerts

#### SMS

- Multi-provider SMS (Africa's Talking + Twilio fallback)
- 7 message templates (order confirmation, delivery, low stock, etc.)
- Rate limiting per establishment (100 SMS/hour)
- Gabonese phone number validation

#### Public Pages

- About page with company story, team, and key metrics
- FAQ with 18 Q&A across 7 categories
- Legal mentions (RCCM, NIF, Gabonese format)
- Privacy policy (RGPD-compliant)
- Terms of service (10 sections, Gabonese law)
- Partner program (Silver/Gold/Platinum tiers)
- Careers page (5 open positions, company culture)

#### Testing

- 44 new E2E Playwright tests covering auth, tables, products, and delivery flows
- Tests for responsive design (tablet + mobile)

### Security

- **CRITICAL**: Added JWT authentication to `get-profile` Edge Function
- **CRITICAL**: Added IP-based rate limiting (5 attempts/5min) to `verify-pin` Edge Function
- **HIGH**: Timing-safe HMAC signature verification for Mobile Money webhooks
- **HIGH**: Removed signature bypass in development mode
- **HIGH**: Sanitized LIKE wildcards in report search (SQL injection prevention)
- **HIGH**: Added cross-tenant filter on Mobile Money payment verification
- **MEDIUM**: Restricted CORS from wildcard to app origin on all Edge Functions
- Row Level Security (RLS) audit: 32/32 tables covered with complete policies
- RLS helper functions updated for PIN authentication support
- Fixed mutable `search_path` warnings on all RLS functions

### Changed

- **All Server Actions migrated to `createAuthenticatedClient`** with RLS enforcement (11 files, 100+ functions)
- Removed redundant `.eq("etablissement_id")` filters (RLS handles multi-tenant isolation)
- Delivery backend migrated from JSON storage (`ventes.notes`) to dedicated `livraisons` table
- Edge Functions deployed: get-profile v2, verify-pin v3, webhook-mobile-money v1, send-sms v1
- `useState` side effect replaced with proper `useEffect` in rapport-z-generator
- `innerHTML` replaced with DOM API in export-pdf (XSS prevention)
- Network status hook now uses `AbortController` for proper cleanup
- `formatCurrency()` used consistently for FCFA amounts

### Database

- New table: `livraisons` (delivery tracking with 6 statuses, driver assignment, coordinates)
- New table: `historique_livraison` (delivery status timeline)
- RLS policies on both new tables with establishment-based access control
- Indexes on vente_id, statut, livreur_id, livraison_id
- Trigger `update_updated_at_column` on livraisons

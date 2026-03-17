# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

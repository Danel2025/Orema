-- ============================================================================
-- Migration initiale: Schema complet de la base de donnees Orema N+
-- Date: 2026-01-01
-- Description: Cree tous les types, tables, foreign keys et index
-- Note: IF NOT EXISTS partout pour eviter les conflits avec la DB existante
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CAISSIER', 'SERVEUR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeVente" AS ENUM ('DIRECT', 'TABLE', 'LIVRAISON', 'EMPORTER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutVente" AS ENUM ('EN_COURS', 'PAYEE', 'ANNULEE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutTable" AS ENUM ('LIBRE', 'OCCUPEE', 'EN_PREPARATION', 'ADDITION', 'A_NETTOYER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FormeTable" AS ENUM ('RONDE', 'CARREE', 'RECTANGULAIRE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TauxTva" AS ENUM ('STANDARD', 'REDUIT', 'EXONERE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'CARTE_BANCAIRE', 'AIRTEL_MONEY', 'MOOV_MONEY', 'CHEQUE', 'VIREMENT', 'COMPTE_CLIENT', 'MIXTE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeRemise" AS ENUM ('POURCENTAGE', 'MONTANT_FIXE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutPreparation" AS ENUM ('EN_ATTENTE', 'EN_PREPARATION', 'PRETE', 'SERVIE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeImprimante" AS ENUM ('TICKET', 'CUISINE', 'BAR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeConnexion" AS ENUM ('USB', 'RESEAU', 'SERIE', 'BLUETOOTH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeMouvement" AS ENUM ('ENTREE', 'SORTIE', 'AJUSTEMENT', 'PERTE', 'INVENTAIRE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActionAudit" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CAISSE_OUVERTURE', 'CAISSE_CLOTURE', 'ANNULATION_VENTE', 'REMISE_APPLIQUEE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MethodeValuation" AS ENUM ('FIFO', 'LIFO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AffichageTable" AS ENUM ('NOM', 'NUMERO', 'CAPACITE', 'NOM_NUMERO', 'NUMERO_CAPACITE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutPaiementMobile" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ECHOUE', 'EXPIRE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeSMS" AS ENUM ('COMMANDE_PRETE', 'LIVRAISON', 'RESERVATION', 'PROMO', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLE: etablissements
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.etablissements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  nif TEXT,
  rccm TEXT,
  logo TEXT,
  devise_par TEXT NOT NULL DEFAULT 'FCFA',
  taux_tva_standard DECIMAL(5,2) NOT NULL DEFAULT 18,
  taux_tva_reduit DECIMAL(5,2) NOT NULL DEFAULT 10,
  afficher_tva_sur_ticket BOOLEAN NOT NULL DEFAULT true,
  message_ticket VARCHAR(500),
  dernier_numero_ticket INTEGER NOT NULL DEFAULT 0,
  date_numero_ticket DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Caisse & ventes
  mode_vente_defaut "TypeVente" NOT NULL DEFAULT 'DIRECT',
  confirmation_vente BOOLEAN NOT NULL DEFAULT false,
  montant_minimum_vente INTEGER NOT NULL DEFAULT 0,
  remise_max_autorisee DECIMAL(5,2) NOT NULL DEFAULT 100,
  impression_auto_ticket BOOLEAN NOT NULL DEFAULT true,
  modes_paiement_actifs "ModePaiement"[] NOT NULL DEFAULT ARRAY['ESPECES'::"ModePaiement", 'CARTE_BANCAIRE'::"ModePaiement", 'AIRTEL_MONEY'::"ModePaiement", 'MOOV_MONEY'::"ModePaiement"],

  -- Gestion des stocks
  seuil_alerte_stock_bas INTEGER NOT NULL DEFAULT 10,
  seuil_critique_stock INTEGER NOT NULL DEFAULT 5,
  alerte_stock_email BOOLEAN NOT NULL DEFAULT false,
  email_alerte_stock TEXT,
  methode_valuation_stock "MethodeValuation" NOT NULL DEFAULT 'FIFO',

  -- Programme fidelite
  fidelite_actif BOOLEAN NOT NULL DEFAULT false,
  taux_points_fidelite INTEGER NOT NULL DEFAULT 1,
  valeur_point_fidelite INTEGER NOT NULL DEFAULT 100,
  credit_client_actif BOOLEAN NOT NULL DEFAULT false,
  limite_credit_defaut INTEGER NOT NULL DEFAULT 0,
  duree_validite_solde INTEGER NOT NULL DEFAULT 365,

  -- Securite
  longueur_pin_minimum INTEGER NOT NULL DEFAULT 4,
  tentatives_login_max INTEGER NOT NULL DEFAULT 5,
  duree_blocage INTEGER NOT NULL DEFAULT 15,
  session_timeout INTEGER NOT NULL DEFAULT 30,
  audit_actif BOOLEAN NOT NULL DEFAULT true,
  actions_a_logger "ActionAudit"[] NOT NULL DEFAULT ARRAY['LOGIN'::"ActionAudit", 'LOGOUT'::"ActionAudit", 'CAISSE_OUVERTURE'::"ActionAudit", 'CAISSE_CLOTURE'::"ActionAudit", 'ANNULATION_VENTE'::"ActionAudit", 'REMISE_APPLIQUEE'::"ActionAudit"],

  -- Plan de salle
  couleur_table_libre TEXT NOT NULL DEFAULT '#22c55e',
  couleur_table_occupee TEXT NOT NULL DEFAULT '#eab308',
  couleur_table_prepa TEXT NOT NULL DEFAULT '#3b82f6',
  couleur_table_addition TEXT NOT NULL DEFAULT '#f97316',
  couleur_table_nettoyer TEXT NOT NULL DEFAULT '#ef4444',
  affichage_table "AffichageTable" NOT NULL DEFAULT 'NUMERO',
  grille_activee BOOLEAN NOT NULL DEFAULT true,
  taille_grille INTEGER NOT NULL DEFAULT 20,

  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_etablissements_nom ON public.etablissements(nom);

-- ============================================================================
-- TABLE: utilisateurs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.utilisateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  role "Role" NOT NULL DEFAULT 'CAISSIER',
  pin_code TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  allowed_routes TEXT[] NOT NULL DEFAULT '{}',
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_utilisateurs_email ON public.utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_etablissement ON public.utilisateurs(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_actif ON public.utilisateurs(actif);

-- ============================================================================
-- TABLE: sessions (auth sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ(6) NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_utilisateur ON public.sessions(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);

-- ============================================================================
-- TABLE: imprimantes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.imprimantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type "TypeImprimante" NOT NULL,
  type_connexion "TypeConnexion" NOT NULL,
  adresse_ip TEXT,
  port INTEGER,
  path_usb TEXT,
  largeur_papier INTEGER NOT NULL DEFAULT 80,
  actif BOOLEAN NOT NULL DEFAULT true,
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imprimantes_etablissement ON public.imprimantes(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_imprimantes_type ON public.imprimantes(type);

-- ============================================================================
-- TABLE: categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  couleur TEXT NOT NULL DEFAULT '#f97316',
  icone TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  imprimante_id UUID REFERENCES public.imprimantes(id),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT categories_etablissement_nom_unique UNIQUE (etablissement_id, nom)
);

CREATE INDEX IF NOT EXISTS idx_categories_etablissement ON public.categories(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_categories_ordre ON public.categories(ordre);

-- ============================================================================
-- TABLE: zones
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  couleur TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  frais_livraison INTEGER NOT NULL DEFAULT 0,
  delai_estime INTEGER,
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT zones_etablissement_nom_unique UNIQUE (etablissement_id, nom)
);

CREATE INDEX IF NOT EXISTS idx_zones_etablissement ON public.zones(etablissement_id);

-- ============================================================================
-- TABLE: tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  capacite INTEGER NOT NULL DEFAULT 4,
  forme "FormeTable" NOT NULL DEFAULT 'CARREE',
  statut "StatutTable" NOT NULL DEFAULT 'LIBRE',
  position_x DOUBLE PRECISION,
  position_y DOUBLE PRECISION,
  largeur DOUBLE PRECISION,
  hauteur DOUBLE PRECISION,
  zone_id UUID REFERENCES public.zones(id),
  active BOOLEAN NOT NULL DEFAULT true,
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT tables_etablissement_numero_unique UNIQUE (etablissement_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_tables_etablissement ON public.tables(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_tables_zone ON public.tables(zone_id);
CREATE INDEX IF NOT EXISTS idx_tables_statut ON public.tables(statut);

-- ============================================================================
-- TABLE: produits
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  image TEXT,
  code_barre TEXT,
  prix_vente DECIMAL(10,0) NOT NULL,
  taux_tva "TauxTva" NOT NULL DEFAULT 'STANDARD',
  prix_achat DECIMAL(10,0),
  gerer_stock BOOLEAN NOT NULL DEFAULT false,
  stock_actuel INTEGER DEFAULT 0,
  stock_min INTEGER,
  stock_max INTEGER,
  unite TEXT,
  disponible_direct BOOLEAN NOT NULL DEFAULT true,
  disponible_table BOOLEAN NOT NULL DEFAULT true,
  disponible_livraison BOOLEAN NOT NULL DEFAULT true,
  disponible_emporter BOOLEAN NOT NULL DEFAULT true,
  actif BOOLEAN NOT NULL DEFAULT true,
  categorie_id UUID NOT NULL REFERENCES public.categories(id),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT produits_etablissement_code_barre_unique UNIQUE (etablissement_id, code_barre)
);

CREATE INDEX IF NOT EXISTS idx_produits_etablissement ON public.produits(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON public.produits(categorie_id);
CREATE INDEX IF NOT EXISTS idx_produits_code_barre ON public.produits(code_barre);
CREATE INDEX IF NOT EXISTS idx_produits_actif ON public.produits(actif);

-- ============================================================================
-- TABLE: supplements_produits
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supplements_produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prix DECIMAL(10,0) NOT NULL,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplements_produit ON public.supplements_produits(produit_id);

-- ============================================================================
-- TABLE: clients
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  points_fidelite INTEGER NOT NULL DEFAULT 0,
  solde_prepaye DECIMAL(10,0) NOT NULL DEFAULT 0,
  credit_autorise BOOLEAN NOT NULL DEFAULT false,
  limit_credit DECIMAL(10,0),
  solde_credit DECIMAL(10,0) NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_etablissement ON public.clients(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_clients_telephone ON public.clients(telephone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_actif ON public.clients(actif);

-- ============================================================================
-- TABLE: sessions_caisse
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sessions_caisse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fond_caisse DECIMAL(10,0) NOT NULL,
  total_ventes DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_especes DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_cartes DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_mobile_money DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_autres DECIMAL(10,0) NOT NULL DEFAULT 0,
  nombre_ventes INTEGER NOT NULL DEFAULT 0,
  nombre_annulations INTEGER NOT NULL DEFAULT 0,
  especes_comptees DECIMAL(10,0),
  ecart DECIMAL(10,0),
  notes_cloture TEXT,
  date_ouverture TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  date_cloture TIMESTAMPTZ(6),
  utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_caisse_etablissement ON public.sessions_caisse(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_utilisateur ON public.sessions_caisse(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_date_ouverture ON public.sessions_caisse(date_ouverture);
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_date_cloture ON public.sessions_caisse(date_cloture);

-- ============================================================================
-- TABLE: ventes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ventes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ticket TEXT NOT NULL UNIQUE,
  type "TypeVente" NOT NULL DEFAULT 'DIRECT',
  statut "StatutVente" NOT NULL DEFAULT 'EN_COURS',
  sous_total DECIMAL(10,0) NOT NULL,
  total_tva DECIMAL(10,0) NOT NULL,
  total_remise DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_final DECIMAL(10,0) NOT NULL,
  type_remise "TypeRemise",
  valeur_remise DECIMAL(10,0),
  table_id UUID REFERENCES public.tables(id),
  client_id UUID REFERENCES public.clients(id),
  utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id),
  session_caisse_id UUID REFERENCES public.sessions_caisse(id),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  adresse_livraison TEXT,
  frais_livraison DECIMAL(10,0),
  notes TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ventes_etablissement ON public.ventes(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_ventes_utilisateur ON public.ventes(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_ventes_table ON public.ventes(table_id);
CREATE INDEX IF NOT EXISTS idx_ventes_client ON public.ventes(client_id);
CREATE INDEX IF NOT EXISTS idx_ventes_session_caisse ON public.ventes(session_caisse_id);
CREATE INDEX IF NOT EXISTS idx_ventes_numero_ticket ON public.ventes(numero_ticket);
CREATE INDEX IF NOT EXISTS idx_ventes_type ON public.ventes(type);
CREATE INDEX IF NOT EXISTS idx_ventes_statut ON public.ventes(statut);
CREATE INDEX IF NOT EXISTS idx_ventes_created_at ON public.ventes(created_at);

-- ============================================================================
-- TABLE: lignes_vente
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lignes_vente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(10,0) NOT NULL,
  sous_total DECIMAL(10,0) NOT NULL,
  taux_tva DECIMAL(5,2) NOT NULL,
  montant_tva DECIMAL(10,0) NOT NULL,
  total DECIMAL(10,0) NOT NULL,
  statut_preparation "StatutPreparation" NOT NULL DEFAULT 'EN_ATTENTE',
  notes TEXT,
  vente_id UUID NOT NULL REFERENCES public.ventes(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lignes_vente_vente ON public.lignes_vente(vente_id);
CREATE INDEX IF NOT EXISTS idx_lignes_vente_produit ON public.lignes_vente(produit_id);
CREATE INDEX IF NOT EXISTS idx_lignes_vente_statut ON public.lignes_vente(statut_preparation);

-- ============================================================================
-- TABLE: lignes_vente_supplements
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lignes_vente_supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prix DECIMAL(10,0) NOT NULL,
  ligne_vente_id UUID NOT NULL REFERENCES public.lignes_vente(id) ON DELETE CASCADE,
  supplement_produit_id UUID REFERENCES public.supplements_produits(id),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lignes_vente_supplements_ligne ON public.lignes_vente_supplements(ligne_vente_id);
CREATE INDEX IF NOT EXISTS idx_lignes_vente_supplements_supplement ON public.lignes_vente_supplements(supplement_produit_id);

-- ============================================================================
-- TABLE: paiements
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  montant DECIMAL(10,0) NOT NULL,
  mode_paiement "ModePaiement" NOT NULL,
  reference TEXT,
  montant_recu DECIMAL(10,0),
  monnaie_rendue DECIMAL(10,0),
  vente_id UUID NOT NULL REFERENCES public.ventes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paiements_vente ON public.paiements(vente_id);
CREATE INDEX IF NOT EXISTS idx_paiements_mode ON public.paiements(mode_paiement);

-- ============================================================================
-- TABLE: mouvements_stock
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mouvements_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type "TypeMouvement" NOT NULL,
  quantite INTEGER NOT NULL,
  quantite_avant INTEGER NOT NULL,
  quantite_apres INTEGER NOT NULL,
  prix_unitaire DECIMAL(10,0),
  motif TEXT,
  reference TEXT,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mouvements_stock_produit ON public.mouvements_stock(produit_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_type ON public.mouvements_stock(type);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_created_at ON public.mouvements_stock(created_at);

-- ============================================================================
-- TABLE: audit_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action "ActionAudit" NOT NULL,
  entite TEXT NOT NULL,
  entite_id TEXT,
  description TEXT,
  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,
  adresse_ip TEXT,
  utilisateur_id UUID REFERENCES public.utilisateurs(id),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_etablissement ON public.audit_logs(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_utilisateur ON public.audit_logs(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entite ON public.audit_logs(entite);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================================================
-- TABLE: role_permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role "Role" NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  allowed_routes TEXT[],
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT role_permissions_role_etablissement_unique UNIQUE (role, etablissement_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_etablissement ON public.role_permissions(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);

-- ============================================================================
-- TABLE: sync_keys (idempotence pour synchronisation hors-ligne)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sync_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  vente_id UUID NOT NULL,
  numero_ticket TEXT NOT NULL,
  etablissement_id UUID NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_keys_idempotency ON public.sync_keys(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_sync_keys_etablissement ON public.sync_keys(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_sync_keys_expires ON public.sync_keys(expires_at);

-- ============================================================================
-- TABLE: rapports_z (rapport Z journalier)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rapports_z (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  nombre_ventes INTEGER NOT NULL DEFAULT 0,
  nombre_articles INTEGER NOT NULL DEFAULT 0,
  total_ht DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_tva DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_ttc DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_especes DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_cartes DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_airtel_money DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_moov_money DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_cheques DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_virements DECIMAL(10,0) NOT NULL DEFAULT 0,
  total_compte_client DECIMAL(10,0) NOT NULL DEFAULT 0,
  panier_moyen DECIMAL(10,0) NOT NULL DEFAULT 0,
  premier_ticket TEXT,
  dernier_ticket TEXT,
  data JSONB,
  genere_auto BOOLEAN NOT NULL DEFAULT false,
  etablissement_id UUID NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT rapports_z_etablissement_date_unique UNIQUE (etablissement_id, date)
);

CREATE INDEX IF NOT EXISTS idx_rapports_z_etablissement ON public.rapports_z(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_rapports_z_date ON public.rapports_z(date);

-- ============================================================================
-- TABLE: logs_sms
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logs_sms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telephone TEXT NOT NULL,
  message TEXT NOT NULL,
  type "TypeSMS" NOT NULL,
  provider TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  message_id TEXT,
  error TEXT,
  metadata JSONB,
  etablissement_id UUID NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_sms_etablissement ON public.logs_sms(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_logs_sms_telephone ON public.logs_sms(telephone);
CREATE INDEX IF NOT EXISTS idx_logs_sms_created_at ON public.logs_sms(created_at);

-- ============================================================================
-- TABLE: paiements_mobile
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.paiements_mobile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_interne TEXT NOT NULL UNIQUE,
  reference_externe TEXT,
  montant DECIMAL(10,0) NOT NULL,
  telephone TEXT NOT NULL,
  provider TEXT NOT NULL,
  statut "StatutPaiementMobile" NOT NULL DEFAULT 'EN_ATTENTE',
  confirme_at TIMESTAMPTZ(6),
  expire_at TIMESTAMPTZ(6) NOT NULL,
  metadonnees JSONB,
  paiement_id UUID,
  vente_id UUID NOT NULL,
  etablissement_id UUID NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paiements_mobile_reference ON public.paiements_mobile(reference_interne);
CREATE INDEX IF NOT EXISTS idx_paiements_mobile_statut ON public.paiements_mobile(statut);
CREATE INDEX IF NOT EXISTS idx_paiements_mobile_etablissement ON public.paiements_mobile(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_paiements_mobile_expire ON public.paiements_mobile(expire_at);

-- ============================================================================
-- TABLE: livraisons
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.livraisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vente_id UUID NOT NULL REFERENCES public.ventes(id) ON DELETE CASCADE,
  statut TEXT NOT NULL DEFAULT 'EN_ATTENTE',
  adresse TEXT NOT NULL,
  telephone TEXT NOT NULL,
  livreur_id UUID REFERENCES public.utilisateurs(id),
  livreur_nom TEXT,
  estimation_minutes INTEGER,
  notes TEXT,
  coordonnees JSONB,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_livraisons_vente ON public.livraisons(vente_id);
CREATE INDEX IF NOT EXISTS idx_livraisons_statut ON public.livraisons(statut);
CREATE INDEX IF NOT EXISTS idx_livraisons_livreur ON public.livraisons(livreur_id);

-- ============================================================================
-- TABLE: historique_livraison
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.historique_livraison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livraison_id UUID NOT NULL REFERENCES public.livraisons(id) ON DELETE CASCADE,
  statut TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historique_livraison_livraison ON public.historique_livraison(livraison_id);
CREATE INDEX IF NOT EXISTS idx_historique_livraison_created_at ON public.historique_livraison(created_at);

-- ============================================================================
-- FIN DE LA MIGRATION INITIALE
-- ============================================================================

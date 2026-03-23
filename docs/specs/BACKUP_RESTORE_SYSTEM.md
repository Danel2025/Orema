# Specification: Systeme de Sauvegarde et Restauration

**Version:** 1.0.0
**Date:** 2026-01-30
**Statut:** A implementer

## Vue d'ensemble

Ce document specifie l'implementation d'un systeme complet de sauvegarde (backup) et restauration des donnees pour l'application Orema N+ POS. Cette fonctionnalite s'integre dans l'onglet "Donnees" des parametres.

## Objectifs

1. Permettre aux administrateurs de creer des sauvegardes completes ou partielles
2. Offrir plusieurs formats d'export (JSON, CSV, SQL)
3. Permettre la restauration a partir d'une sauvegarde
4. Automatiser les sauvegardes planifiees
5. Stocker les sauvegardes de maniere securisee

## Architecture technique

### 1. Methodes de sauvegarde disponibles

#### A. Export via API Supabase (Client-side)

Pour les petites/moyennes quantites de donnees :

```typescript
// Recuperer toutes les donnees d'une table
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("etablissement_id", etablissementId);
```

**Avantages:**

- Simple a implementer
- Fonctionne dans le navigateur
- Respecte les politiques RLS

**Inconvenients:**

- Limite par la taille des reponses
- Lent pour grandes quantites de donnees

#### B. pg_dump via Edge Function (Server-side)

Pour les sauvegardes completes et volumineuses :

```bash
# Via Supabase CLI (recommande pour backup complet)
supabase db dump --db-url [CONNECTION_STRING] -f roles.sql --role-only
supabase db dump --db-url [CONNECTION_STRING] -f schema.sql
supabase db dump --db-url [CONNECTION_STRING] -f data.sql --use-copy --data-only
```

**Avantages:**

- Backup complet et coherent
- Performance optimale
- Include schema et contraintes

**Inconvenients:**

- Necessite acces serveur
- Plus complexe a implementer

#### C. Export incremental (Recommande pour usage quotidien)

```sql
-- Exporter uniquement les modifications depuis la derniere sauvegarde
SELECT * FROM ventes
WHERE etablissement_id = $1
AND updated_at > $2;
```

### 2. Structure des fichiers de sauvegarde

#### Format JSON (recommande pour application)

```json
{
  "version": "1.0.0",
  "date": "2026-01-30T12:00:00Z",
  "etablissement_id": "uuid",
  "etablissement_nom": "Mon Restaurant",
  "type": "full|partial",
  "categories_selectionnees": ["ventes", "clients", "produits"],
  "data": {
    "ventes": [...],
    "lignes_vente": [...],
    "paiements": [...],
    "clients": [...],
    "produits": [...],
    "categories": [...]
  },
  "metadata": {
    "total_records": 12345,
    "tables_count": 6,
    "size_bytes": 1024000
  },
  "checksum": "sha256:..."
}
```

#### Format CSV (pour export tableur)

Un fichier ZIP contenant :

- `ventes.csv`
- `produits.csv`
- `clients.csv`
- etc.
- `manifest.json` (metadata)

### 3. Implementation Backend

#### A. Migration Supabase

Creer `supabase/migrations/YYYYMMDDHHMMSS_add_backup_tables.sql`:

```sql
-- Table pour stocker les metadonnees des sauvegardes
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('full', 'partial', 'incremental')),
  format TEXT NOT NULL CHECK (format IN ('json', 'csv', 'sql')),
  categories JSONB NOT NULL DEFAULT '[]',
  storage_path TEXT, -- Chemin dans Supabase Storage
  file_size BIGINT,
  record_count INTEGER,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  created_by UUID REFERENCES utilisateurs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index pour recherche rapide
CREATE INDEX idx_backups_etablissement ON backups(etablissement_id);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);

-- Table pour les sauvegardes planifiees
CREATE TABLE IF NOT EXISTS backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  frequence TEXT NOT NULL CHECK (frequence IN ('daily', 'weekly', 'monthly')),
  heure_execution TIME NOT NULL DEFAULT '02:00',
  jour_semaine INTEGER, -- 0-6 pour weekly
  jour_mois INTEGER, -- 1-31 pour monthly
  type TEXT NOT NULL DEFAULT 'full',
  categories JSONB NOT NULL DEFAULT '[]',
  retention_jours INTEGER NOT NULL DEFAULT 30,
  derniere_execution TIMESTAMPTZ,
  prochaine_execution TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fonction pour generer une sauvegarde
CREATE OR REPLACE FUNCTION create_backup(
  p_etablissement_id UUID,
  p_user_id UUID,
  p_nom TEXT,
  p_type TEXT,
  p_categories JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_backup_id UUID;
BEGIN
  INSERT INTO backups (
    etablissement_id,
    nom,
    type,
    format,
    categories,
    status,
    created_by
  ) VALUES (
    p_etablissement_id,
    p_nom,
    p_type,
    'json',
    p_categories,
    'pending',
    p_user_id
  ) RETURNING id INTO v_backup_id;

  RETURN v_backup_id;
END;
$$;

-- RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own establishment backups" ON backups
  FOR SELECT USING (
    etablissement_id IN (
      SELECT etablissement_id FROM utilisateurs WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage backups" ON backups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid()
      AND etablissement_id = backups.etablissement_id
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );
```

#### B. Server Actions (`actions/backup.ts`)

```typescript
"use server";

import { createClient } from "@/lib/db";
import { getEtablissementId } from "@/lib/etablissement";
import { getCurrentUser } from "@/actions/auth";

// Types
interface BackupOptions {
  nom: string;
  type: "full" | "partial";
  categories: string[];
  format: "json" | "csv";
}

interface BackupResult {
  success: boolean;
  backupId?: string;
  downloadUrl?: string;
  error?: string;
}

// Categories exportables
const BACKUP_TABLES = {
  ventes: ["ventes", "lignes_vente", "paiements", "sessions_caisse"],
  clients: ["clients"],
  produits: ["produits", "categories", "supplements"],
  stocks: ["mouvements_stock"],
  tables: ["tables", "zones"],
  imprimantes: ["imprimantes"],
  utilisateurs: ["utilisateurs"],
} as const;

/**
 * Cree une nouvelle sauvegarde
 */
export async function createBackup(options: BackupOptions): Promise<BackupResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const etablissementId = await getEtablissementId();
    const supabase = await createClient();

    // 1. Creer l'enregistrement de backup
    const { data: backup, error: createError } = await supabase
      .from("backups")
      .insert({
        etablissement_id: etablissementId,
        nom: options.nom,
        type: options.type,
        format: options.format,
        categories: options.categories,
        status: "in_progress",
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (createError) throw createError;

    // 2. Collecter les donnees
    const data: Record<string, unknown[]> = {};
    let totalRecords = 0;

    for (const category of options.categories) {
      const tables = BACKUP_TABLES[category as keyof typeof BACKUP_TABLES] || [];

      for (const table of tables) {
        const { data: tableData, error } = await supabase
          .from(table)
          .select("*")
          .eq("etablissement_id", etablissementId);

        if (!error && tableData) {
          data[table] = tableData;
          totalRecords += tableData.length;
        }
      }
    }

    // 3. Generer le fichier
    const backupContent = {
      version: "1.0.0",
      date: new Date().toISOString(),
      etablissement_id: etablissementId,
      type: options.type,
      categories: options.categories,
      data,
      metadata: {
        total_records: totalRecords,
        tables_count: Object.keys(data).length,
      },
    };

    const jsonContent = JSON.stringify(backupContent, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const fileName = `backup_${etablissementId}_${Date.now()}.json`;

    // 4. Uploader vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("backups")
      .upload(fileName, blob, {
        contentType: "application/json",
      });

    if (uploadError) throw uploadError;

    // 5. Obtenir l'URL signee
    const { data: urlData } = await supabase.storage
      .from("backups")
      .createSignedUrl(fileName, 3600); // 1 heure

    // 6. Mettre a jour le statut
    await supabase
      .from("backups")
      .update({
        status: "completed",
        storage_path: uploadData.path,
        file_size: blob.size,
        record_count: totalRecords,
        completed_at: new Date().toISOString(),
      })
      .eq("id", backup.id);

    return {
      success: true,
      backupId: backup.id,
      downloadUrl: urlData?.signedUrl,
    };
  } catch (error) {
    console.error("Erreur creation backup:", error);
    return { success: false, error: "Erreur lors de la creation de la sauvegarde" };
  }
}

/**
 * Liste les sauvegardes existantes
 */
export async function listBackups() {
  try {
    const etablissementId = await getEtablissementId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("backups")
      .select("*, created_by(nom, prenom)")
      .eq("etablissement_id", etablissementId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Erreur liste backups:", error);
    return { success: false, error: "Erreur lors de la recuperation des sauvegardes" };
  }
}

/**
 * Telecharge une sauvegarde existante
 */
export async function downloadBackup(backupId: string) {
  try {
    const etablissementId = await getEtablissementId();
    const supabase = await createClient();

    const { data: backup, error } = await supabase
      .from("backups")
      .select("storage_path")
      .eq("id", backupId)
      .eq("etablissement_id", etablissementId)
      .single();

    if (error || !backup?.storage_path) {
      return { success: false, error: "Sauvegarde non trouvee" };
    }

    const { data: urlData } = await supabase.storage
      .from("backups")
      .createSignedUrl(backup.storage_path, 3600);

    return { success: true, downloadUrl: urlData?.signedUrl };
  } catch (error) {
    console.error("Erreur telechargement backup:", error);
    return { success: false, error: "Erreur lors du telechargement" };
  }
}

/**
 * Restaure une sauvegarde
 */
export async function restoreBackup(backupId: string): Promise<BackupResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    // TODO: Implementer la restauration
    // 1. Telecharger le fichier de backup
    // 2. Valider le format et la compatibilite
    // 3. Supprimer les donnees existantes (avec confirmation)
    // 4. Inserer les nouvelles donnees dans l'ordre correct (FK)
    // 5. Valider l'integrite

    return { success: false, error: "Fonctionnalite en cours de developpement" };
  } catch (error) {
    console.error("Erreur restauration backup:", error);
    return { success: false, error: "Erreur lors de la restauration" };
  }
}

/**
 * Supprime une sauvegarde
 */
export async function deleteBackup(backupId: string): Promise<BackupResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const etablissementId = await getEtablissementId();
    const supabase = await createClient();

    // Recuperer le chemin du fichier
    const { data: backup } = await supabase
      .from("backups")
      .select("storage_path")
      .eq("id", backupId)
      .eq("etablissement_id", etablissementId)
      .single();

    // Supprimer du storage
    if (backup?.storage_path) {
      await supabase.storage.from("backups").remove([backup.storage_path]);
    }

    // Supprimer l'enregistrement
    const { error } = await supabase.from("backups").delete().eq("id", backupId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Erreur suppression backup:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }
}
```

### 4. Schema Zod (`schemas/backup.schema.ts`)

```typescript
import { z } from "zod";

export const backupCategories = [
  { key: "ventes", label: "Ventes et paiements" },
  { key: "clients", label: "Clients" },
  { key: "produits", label: "Produits et categories" },
  { key: "stocks", label: "Mouvements de stock" },
  { key: "tables", label: "Tables et zones" },
  { key: "imprimantes", label: "Imprimantes" },
  { key: "utilisateurs", label: "Utilisateurs" },
] as const;

export const createBackupSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caracteres").max(100),
  type: z.enum(["full", "partial"]),
  categories: z.array(z.string()).min(1, "Selectionnez au moins une categorie"),
  format: z.enum(["json", "csv"]).default("json"),
});

export type CreateBackupInput = z.infer<typeof createBackupSchema>;

export const backupScheduleSchema = z.object({
  nom: z.string().min(2).max(100),
  actif: z.boolean().default(true),
  frequence: z.enum(["daily", "weekly", "monthly"]),
  heureExecution: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  jourSemaine: z.number().int().min(0).max(6).optional(),
  jourMois: z.number().int().min(1).max(31).optional(),
  type: z.enum(["full", "partial"]).default("full"),
  categories: z.array(z.string()),
  retentionJours: z.number().int().min(1).max(365).default(30),
});

export type BackupScheduleInput = z.infer<typeof backupScheduleSchema>;
```

### 5. Composant UI (`components/parametres/backup-settings.tsx`)

Le composant doit inclure :

1. **Section "Creer une sauvegarde"**
   - Champ nom de la sauvegarde
   - Selection du type (complet/partiel)
   - Cases a cocher pour les categories
   - Selection du format (JSON/CSV)
   - Bouton "Creer la sauvegarde"
   - Barre de progression

2. **Section "Sauvegardes existantes"**
   - Liste des sauvegardes avec :
     - Nom, date, taille, nombre d'enregistrements
     - Boutons: Telecharger, Restaurer, Supprimer
   - Pagination si necessaire

3. **Section "Sauvegardes automatiques"**
   - Activer/desactiver la planification
   - Frequence (quotidien, hebdomadaire, mensuel)
   - Heure d'execution
   - Duree de retention
   - Categories a sauvegarder

### 6. Stockage Supabase

Creer un bucket "backups" dans Supabase Storage :

```sql
-- Dans le dashboard Supabase ou via migration
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false);

-- RLS pour le bucket
CREATE POLICY "Authenticated users can manage their backups"
ON storage.objects FOR ALL
USING (
  bucket_id = 'backups' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM etablissements WHERE id IN (
      SELECT etablissement_id FROM utilisateurs WHERE id = auth.uid()
    )
  )
);
```

## Securite

1. **Authentification**: Seuls les admins peuvent creer/restaurer des sauvegardes
2. **Autorisation**: RLS sur les tables et le storage
3. **Chiffrement**: Les fichiers sont chiffres at-rest dans Supabase Storage
4. **Validation**: Checksum pour verifier l'integrite des fichiers
5. **Audit**: Toutes les operations sont loguees dans audit_logs

## Limitations

- Taille maximale de sauvegarde: 50MB pour l'export client-side
- Frequence minimale de sauvegarde automatique: 1 fois par jour
- Retention maximale: 365 jours
- Pas de backup incremental dans la V1

## Integration avec la fonctionnalite existante

L'onglet "Donnees" des parametres contiendra :

1. **Import/Export CSV** (existant)
2. **Remise a zero** (implemente)
3. **Sauvegardes** (a implementer)
   - Creer une sauvegarde
   - Historique des sauvegardes
   - Planification automatique
   - Restauration

## Ressources Context7

Documentation consultee :

- Supabase: backup database, pg_dump, restore
- Supabase JS: select all rows, download files, storage API

## Prochaines etapes

1. Creer la migration pour les tables `backups` et `backup_schedules`
2. Creer le bucket Storage "backups"
3. Implementer les Server Actions dans `actions/backup.ts`
4. Creer le schema Zod dans `schemas/backup.schema.ts`
5. Creer le composant `BackupSettings`
6. Integrer dans l'onglet "Donnees" existant
7. Implementer les sauvegardes automatiques via Edge Function/CRON
8. Ajouter les tests unitaires et d'integration

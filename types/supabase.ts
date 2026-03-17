export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["ActionAudit"]
          adresse_ip: string | null
          ancienne_valeur: string | null
          created_at: string
          description: string | null
          entite: string
          entite_id: string | null
          etablissement_id: string
          id: string
          nouvelle_valeur: string | null
          utilisateur_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["ActionAudit"]
          adresse_ip?: string | null
          ancienne_valeur?: string | null
          created_at?: string
          description?: string | null
          entite: string
          entite_id?: string | null
          etablissement_id: string
          id?: string
          nouvelle_valeur?: string | null
          utilisateur_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["ActionAudit"]
          adresse_ip?: string | null
          ancienne_valeur?: string | null
          created_at?: string
          description?: string | null
          entite?: string
          entite_id?: string | null
          etablissement_id?: string
          id?: string
          nouvelle_valeur?: string | null
          utilisateur_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_schedules: {
        Row: {
          actif: boolean
          categories: Json
          created_at: string
          derniere_execution: string | null
          etablissement_id: string
          frequence: string
          heure_execution: string
          id: string
          jour_mois: number | null
          jour_semaine: number | null
          nom: string
          prochaine_execution: string | null
          retention_jours: number
          type: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          categories?: Json
          created_at?: string
          derniere_execution?: string | null
          etablissement_id: string
          frequence: string
          heure_execution?: string
          id?: string
          jour_mois?: number | null
          jour_semaine?: number | null
          nom: string
          prochaine_execution?: string | null
          retention_jours?: number
          type?: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          categories?: Json
          created_at?: string
          derniere_execution?: string | null
          etablissement_id?: string
          frequence?: string
          heure_execution?: string
          id?: string
          jour_mois?: number | null
          jour_semaine?: number | null
          nom?: string
          prochaine_execution?: string | null
          retention_jours?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_schedules_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      backups: {
        Row: {
          categories: Json
          checksum: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          error_message: string | null
          etablissement_id: string
          file_size: number | null
          format: string
          id: string
          nom: string
          record_count: number | null
          status: string
          storage_path: string | null
          type: string
        }
        Insert: {
          categories?: Json
          checksum?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_message?: string | null
          etablissement_id: string
          file_size?: number | null
          format?: string
          id?: string
          nom: string
          record_count?: number | null
          status?: string
          storage_path?: string | null
          type: string
        }
        Update: {
          categories?: Json
          checksum?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_message?: string | null
          etablissement_id?: string
          file_size?: number | null
          format?: string
          id?: string
          nom?: string
          record_count?: number | null
          status?: string
          storage_path?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "backups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backups_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          category_id: string
          color: string | null
          content: string
          created_at: string
          created_by: string | null
          excerpt: string | null
          featured: boolean
          featured_image: string | null
          icon: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_id: string
          category_id: string
          color?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured?: boolean
          featured_image?: string | null
          icon?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_id?: string
          category_id?: string
          color?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured?: boolean
          featured_image?: string | null
          icon?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          actif: boolean
          couleur: string
          created_at: string
          etablissement_id: string
          icone: string | null
          id: string
          imprimante_id: string | null
          nom: string
          ordre: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          couleur?: string
          created_at?: string
          etablissement_id: string
          icone?: string | null
          id?: string
          imprimante_id?: string | null
          nom: string
          ordre?: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          couleur?: string
          created_at?: string
          etablissement_id?: string
          icone?: string | null
          id?: string
          imprimante_id?: string | null
          nom?: string
          ordre?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_imprimante_id_fkey"
            columns: ["imprimante_id"]
            isOneToOne: false
            referencedRelation: "imprimantes"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          actif: boolean
          adresse: string | null
          created_at: string
          credit_autorise: boolean
          email: string | null
          etablissement_id: string
          id: string
          limit_credit: number | null
          nom: string
          points_fidelite: number
          prenom: string | null
          solde_credit: number
          solde_prepaye: number
          telephone: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          created_at?: string
          credit_autorise?: boolean
          email?: string | null
          etablissement_id: string
          id?: string
          limit_credit?: number | null
          nom: string
          points_fidelite?: number
          prenom?: string | null
          solde_credit?: number
          solde_prepaye?: number
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          created_at?: string
          credit_autorise?: boolean
          email?: string | null
          etablissement_id?: string
          id?: string
          limit_credit?: number | null
          nom?: string
          points_fidelite?: number
          prenom?: string | null
          solde_credit?: number
          solde_prepaye?: number
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_articles: {
        Row: {
          category_id: string
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          ordre: number
          published_at: string | null
          read_time: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          ordre?: number
          published_at?: string | null
          read_time?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          ordre?: number
          published_at?: string | null
          read_time?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doc_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "doc_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_articles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_categories: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string
          id: string
          ordre: number
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          ordre?: number
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          ordre?: number
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doc_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      etablissements: {
        Row: {
          actions_a_logger: string[] | null
          actionsALogger: Database["public"]["Enums"]["ActionAudit"][] | null
          adresse: string | null
          affichage_table: Database["public"]["Enums"]["AffichageTable"]
          afficher_tva_sur_ticket: boolean
          alerte_stock_email: boolean
          audit_actif: boolean
          confirmation_vente: boolean
          couleur_table_addition: string
          couleur_table_libre: string
          couleur_table_nettoyer: string
          couleur_table_occupee: string
          couleur_table_prepa: string
          created_at: string
          credit_client_actif: boolean
          date_numero_ticket: string
          dernier_numero_ticket: number
          devise_par: string
          duree_blocage: number
          duree_validite_solde: number
          email: string | null
          email_alerte_stock: string | null
          fidelite_actif: boolean
          grille_activee: boolean
          id: string
          impression_auto_ticket: boolean
          limite_credit_defaut: number
          logo: string | null
          longueur_pin_minimum: number
          message_ticket: string | null
          methode_valuation_stock: Database["public"]["Enums"]["MethodeValuation"]
          mode_vente_defaut: Database["public"]["Enums"]["TypeVente"]
          modes_paiement_actifs: string[] | null
          modesPaiementActifs:
            | Database["public"]["Enums"]["ModePaiement"][]
            | null
          montant_minimum_vente: number
          nif: string | null
          nom: string
          rccm: string | null
          remise_max_autorisee: number
          session_timeout: number
          seuil_alerte_stock_bas: number
          seuil_critique_stock: number
          taille_grille: number
          taux_points_fidelite: number
          taux_tva_reduit: number
          taux_tva_standard: number
          telephone: string | null
          tentatives_login_max: number
          updated_at: string
          valeur_point_fidelite: number
        }
        Insert: {
          actions_a_logger?: string[] | null
          actionsALogger?: Database["public"]["Enums"]["ActionAudit"][] | null
          adresse?: string | null
          affichage_table?: Database["public"]["Enums"]["AffichageTable"]
          afficher_tva_sur_ticket?: boolean
          alerte_stock_email?: boolean
          audit_actif?: boolean
          confirmation_vente?: boolean
          couleur_table_addition?: string
          couleur_table_libre?: string
          couleur_table_nettoyer?: string
          couleur_table_occupee?: string
          couleur_table_prepa?: string
          created_at?: string
          credit_client_actif?: boolean
          date_numero_ticket?: string
          dernier_numero_ticket?: number
          devise_par?: string
          duree_blocage?: number
          duree_validite_solde?: number
          email?: string | null
          email_alerte_stock?: string | null
          fidelite_actif?: boolean
          grille_activee?: boolean
          id?: string
          impression_auto_ticket?: boolean
          limite_credit_defaut?: number
          logo?: string | null
          longueur_pin_minimum?: number
          message_ticket?: string | null
          methode_valuation_stock?: Database["public"]["Enums"]["MethodeValuation"]
          mode_vente_defaut?: Database["public"]["Enums"]["TypeVente"]
          modes_paiement_actifs?: string[] | null
          modesPaiementActifs?:
            | Database["public"]["Enums"]["ModePaiement"][]
            | null
          montant_minimum_vente?: number
          nif?: string | null
          nom: string
          rccm?: string | null
          remise_max_autorisee?: number
          session_timeout?: number
          seuil_alerte_stock_bas?: number
          seuil_critique_stock?: number
          taille_grille?: number
          taux_points_fidelite?: number
          taux_tva_reduit?: number
          taux_tva_standard?: number
          telephone?: string | null
          tentatives_login_max?: number
          updated_at?: string
          valeur_point_fidelite?: number
        }
        Update: {
          actions_a_logger?: string[] | null
          actionsALogger?: Database["public"]["Enums"]["ActionAudit"][] | null
          adresse?: string | null
          affichage_table?: Database["public"]["Enums"]["AffichageTable"]
          afficher_tva_sur_ticket?: boolean
          alerte_stock_email?: boolean
          audit_actif?: boolean
          confirmation_vente?: boolean
          couleur_table_addition?: string
          couleur_table_libre?: string
          couleur_table_nettoyer?: string
          couleur_table_occupee?: string
          couleur_table_prepa?: string
          created_at?: string
          credit_client_actif?: boolean
          date_numero_ticket?: string
          dernier_numero_ticket?: number
          devise_par?: string
          duree_blocage?: number
          duree_validite_solde?: number
          email?: string | null
          email_alerte_stock?: string | null
          fidelite_actif?: boolean
          grille_activee?: boolean
          id?: string
          impression_auto_ticket?: boolean
          limite_credit_defaut?: number
          logo?: string | null
          longueur_pin_minimum?: number
          message_ticket?: string | null
          methode_valuation_stock?: Database["public"]["Enums"]["MethodeValuation"]
          mode_vente_defaut?: Database["public"]["Enums"]["TypeVente"]
          modes_paiement_actifs?: string[] | null
          modesPaiementActifs?:
            | Database["public"]["Enums"]["ModePaiement"][]
            | null
          montant_minimum_vente?: number
          nif?: string | null
          nom?: string
          rccm?: string | null
          remise_max_autorisee?: number
          session_timeout?: number
          seuil_alerte_stock_bas?: number
          seuil_critique_stock?: number
          taille_grille?: number
          taux_points_fidelite?: number
          taux_tva_reduit?: number
          taux_tva_standard?: number
          telephone?: string | null
          tentatives_login_max?: number
          updated_at?: string
          valeur_point_fidelite?: number
        }
        Relationships: []
      }
      imprimantes: {
        Row: {
          actif: boolean
          adresse_ip: string | null
          created_at: string
          etablissement_id: string
          id: string
          largeur_papier: number
          nom: string
          path_usb: string | null
          port: number | null
          type: Database["public"]["Enums"]["TypeImprimante"]
          type_connexion: Database["public"]["Enums"]["TypeConnexion"]
          updated_at: string
        }
        Insert: {
          actif?: boolean
          adresse_ip?: string | null
          created_at?: string
          etablissement_id: string
          id?: string
          largeur_papier?: number
          nom: string
          path_usb?: string | null
          port?: number | null
          type: Database["public"]["Enums"]["TypeImprimante"]
          type_connexion: Database["public"]["Enums"]["TypeConnexion"]
          updated_at?: string
        }
        Update: {
          actif?: boolean
          adresse_ip?: string | null
          created_at?: string
          etablissement_id?: string
          id?: string
          largeur_papier?: number
          nom?: string
          path_usb?: string | null
          port?: number | null
          type?: Database["public"]["Enums"]["TypeImprimante"]
          type_connexion?: Database["public"]["Enums"]["TypeConnexion"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imprimantes_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_vente: {
        Row: {
          created_at: string
          id: string
          montant_tva: number
          notes: string | null
          prix_unitaire: number
          produit_id: string
          quantite: number
          sous_total: number
          statut_preparation: Database["public"]["Enums"]["StatutPreparation"]
          taux_tva: number
          total: number
          updated_at: string
          vente_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          montant_tva: number
          notes?: string | null
          prix_unitaire: number
          produit_id: string
          quantite?: number
          sous_total: number
          statut_preparation?: Database["public"]["Enums"]["StatutPreparation"]
          taux_tva: number
          total: number
          updated_at?: string
          vente_id: string
        }
        Update: {
          created_at?: string
          id?: string
          montant_tva?: number
          notes?: string | null
          prix_unitaire?: number
          produit_id?: string
          quantite?: number
          sous_total?: number
          statut_preparation?: Database["public"]["Enums"]["StatutPreparation"]
          taux_tva?: number
          total?: number
          updated_at?: string
          vente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_vente_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_vente_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_vente_supplements: {
        Row: {
          created_at: string
          id: string
          ligne_vente_id: string
          nom: string
          prix: number
          supplement_produit_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ligne_vente_id: string
          nom: string
          prix: number
          supplement_produit_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ligne_vente_id?: string
          nom?: string
          prix?: number
          supplement_produit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lignes_vente_supplements_ligne_vente_id_fkey"
            columns: ["ligne_vente_id"]
            isOneToOne: false
            referencedRelation: "lignes_vente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_vente_supplements_supplement_produit_id_fkey"
            columns: ["supplement_produit_id"]
            isOneToOne: false
            referencedRelation: "supplements_produits"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_sms: {
        Row: {
          created_at: string
          error: string | null
          etablissement_id: string
          id: string
          message: string
          message_id: string | null
          metadata: Json | null
          provider: string
          success: boolean
          telephone: string
          type: Database["public"]["Enums"]["TypeSMS"]
        }
        Insert: {
          created_at?: string
          error?: string | null
          etablissement_id: string
          id?: string
          message: string
          message_id?: string | null
          metadata?: Json | null
          provider: string
          success?: boolean
          telephone: string
          type: Database["public"]["Enums"]["TypeSMS"]
        }
        Update: {
          created_at?: string
          error?: string | null
          etablissement_id?: string
          id?: string
          message?: string
          message_id?: string | null
          metadata?: Json | null
          provider?: string
          success?: boolean
          telephone?: string
          type?: Database["public"]["Enums"]["TypeSMS"]
        }
        Relationships: []
      }
      mouvements_stock: {
        Row: {
          created_at: string
          id: string
          motif: string | null
          prix_unitaire: number | null
          produit_id: string
          quantite: number
          quantite_apres: number
          quantite_avant: number
          reference: string | null
          type: Database["public"]["Enums"]["TypeMouvement"]
        }
        Insert: {
          created_at?: string
          id?: string
          motif?: string | null
          prix_unitaire?: number | null
          produit_id: string
          quantite: number
          quantite_apres: number
          quantite_avant: number
          reference?: string | null
          type: Database["public"]["Enums"]["TypeMouvement"]
        }
        Update: {
          created_at?: string
          id?: string
          motif?: string | null
          prix_unitaire?: number | null
          produit_id?: string
          quantite?: number
          quantite_apres?: number
          quantite_avant?: number
          reference?: string | null
          type?: Database["public"]["Enums"]["TypeMouvement"]
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_stock_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          created_at: string
          id: string
          mode_paiement: Database["public"]["Enums"]["ModePaiement"]
          monnaie_rendue: number | null
          montant: number
          montant_recu: number | null
          reference: string | null
          vente_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode_paiement: Database["public"]["Enums"]["ModePaiement"]
          monnaie_rendue?: number | null
          montant: number
          montant_recu?: number | null
          reference?: string | null
          vente_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["ModePaiement"]
          monnaie_rendue?: number | null
          montant?: number
          montant_recu?: number | null
          reference?: string | null
          vente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_mobile: {
        Row: {
          confirme_at: string | null
          created_at: string
          etablissement_id: string
          expire_at: string
          id: string
          metadonnees: Json | null
          montant: number
          paiement_id: string | null
          provider: string
          reference_externe: string | null
          reference_interne: string
          statut: Database["public"]["Enums"]["StatutPaiementMobile"]
          telephone: string
          updated_at: string
          vente_id: string
        }
        Insert: {
          confirme_at?: string | null
          created_at?: string
          etablissement_id: string
          expire_at: string
          id?: string
          metadonnees?: Json | null
          montant: number
          paiement_id?: string | null
          provider: string
          reference_externe?: string | null
          reference_interne: string
          statut?: Database["public"]["Enums"]["StatutPaiementMobile"]
          telephone: string
          updated_at?: string
          vente_id: string
        }
        Update: {
          confirme_at?: string | null
          created_at?: string
          etablissement_id?: string
          expire_at?: string
          id?: string
          metadonnees?: Json | null
          montant?: number
          paiement_id?: string | null
          provider?: string
          reference_externe?: string | null
          reference_interne?: string
          statut?: Database["public"]["Enums"]["StatutPaiementMobile"]
          telephone?: string
          updated_at?: string
          vente_id?: string
        }
        Relationships: []
      }
      parametres_facture: {
        Row: {
          afficher_detail_tva: boolean
          afficher_infos_etablissement: boolean
          afficher_logo: boolean
          afficher_nif_rccm: boolean
          afficher_qr_code: boolean
          copies_facture_detaillee: number
          copies_note_addition: number
          copies_pro_forma: number
          copies_ticket_simple: number
          created_at: string
          entete_facture_detaillee: string | null
          entete_note_addition: string | null
          entete_pro_forma: string | null
          entete_ticket_simple: string | null
          etablissement_id: string
          id: string
          options_facture_detaillee: Json | null
          options_note_addition: Json | null
          options_pro_forma: Json | null
          options_ticket_simple: Json | null
          pied_page_facture_detaillee: string | null
          pied_page_note_addition: string | null
          pied_page_pro_forma: string | null
          pied_page_ticket_simple: string | null
          style_separateur: Database["public"]["Enums"]["style_separateur"]
          type_facture_defaut: Database["public"]["Enums"]["type_facture"]
          updated_at: string
        }
        Insert: {
          afficher_detail_tva?: boolean
          afficher_infos_etablissement?: boolean
          afficher_logo?: boolean
          afficher_nif_rccm?: boolean
          afficher_qr_code?: boolean
          copies_facture_detaillee?: number
          copies_note_addition?: number
          copies_pro_forma?: number
          copies_ticket_simple?: number
          created_at?: string
          entete_facture_detaillee?: string | null
          entete_note_addition?: string | null
          entete_pro_forma?: string | null
          entete_ticket_simple?: string | null
          etablissement_id: string
          id?: string
          options_facture_detaillee?: Json | null
          options_note_addition?: Json | null
          options_pro_forma?: Json | null
          options_ticket_simple?: Json | null
          pied_page_facture_detaillee?: string | null
          pied_page_note_addition?: string | null
          pied_page_pro_forma?: string | null
          pied_page_ticket_simple?: string | null
          style_separateur?: Database["public"]["Enums"]["style_separateur"]
          type_facture_defaut?: Database["public"]["Enums"]["type_facture"]
          updated_at?: string
        }
        Update: {
          afficher_detail_tva?: boolean
          afficher_infos_etablissement?: boolean
          afficher_logo?: boolean
          afficher_nif_rccm?: boolean
          afficher_qr_code?: boolean
          copies_facture_detaillee?: number
          copies_note_addition?: number
          copies_pro_forma?: number
          copies_ticket_simple?: number
          created_at?: string
          entete_facture_detaillee?: string | null
          entete_note_addition?: string | null
          entete_pro_forma?: string | null
          entete_ticket_simple?: string | null
          etablissement_id?: string
          id?: string
          options_facture_detaillee?: Json | null
          options_note_addition?: Json | null
          options_pro_forma?: Json | null
          options_ticket_simple?: Json | null
          pied_page_facture_detaillee?: string | null
          pied_page_note_addition?: string | null
          pied_page_pro_forma?: string | null
          pied_page_ticket_simple?: string | null
          style_separateur?: Database["public"]["Enums"]["style_separateur"]
          type_facture_defaut?: Database["public"]["Enums"]["type_facture"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parametres_facture_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: true
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      produits: {
        Row: {
          actif: boolean
          categorie_id: string
          code_barre: string | null
          created_at: string
          description: string | null
          disponible_direct: boolean
          disponible_emporter: boolean
          disponible_livraison: boolean
          disponible_table: boolean
          etablissement_id: string
          gerer_stock: boolean
          id: string
          image: string | null
          nom: string
          prix_achat: number | null
          prix_vente: number
          stock_actuel: number | null
          stock_max: number | null
          stock_min: number | null
          taux_tva: Database["public"]["Enums"]["TauxTva"]
          unite: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          categorie_id: string
          code_barre?: string | null
          created_at?: string
          description?: string | null
          disponible_direct?: boolean
          disponible_emporter?: boolean
          disponible_livraison?: boolean
          disponible_table?: boolean
          etablissement_id: string
          gerer_stock?: boolean
          id?: string
          image?: string | null
          nom: string
          prix_achat?: number | null
          prix_vente: number
          stock_actuel?: number | null
          stock_max?: number | null
          stock_min?: number | null
          taux_tva?: Database["public"]["Enums"]["TauxTva"]
          unite?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          categorie_id?: string
          code_barre?: string | null
          created_at?: string
          description?: string | null
          disponible_direct?: boolean
          disponible_emporter?: boolean
          disponible_livraison?: boolean
          disponible_table?: boolean
          etablissement_id?: string
          gerer_stock?: boolean
          id?: string
          image?: string | null
          nom?: string
          prix_achat?: number | null
          prix_vente?: number
          stock_actuel?: number | null
          stock_max?: number | null
          stock_min?: number | null
          taux_tva?: Database["public"]["Enums"]["TauxTva"]
          unite?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produits_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      rapports_z: {
        Row: {
          created_at: string
          data: Json | null
          date: string
          dernier_ticket: string | null
          etablissement_id: string
          genere_auto: boolean
          id: string
          nombre_articles: number
          nombre_ventes: number
          panier_moyen: number
          premier_ticket: string | null
          total_airtel_money: number
          total_cartes: number
          total_cheques: number
          total_compte_client: number
          total_especes: number
          total_ht: number
          total_moov_money: number
          total_ttc: number
          total_tva: number
          total_virements: number
        }
        Insert: {
          created_at?: string
          data?: Json | null
          date: string
          dernier_ticket?: string | null
          etablissement_id: string
          genere_auto?: boolean
          id?: string
          nombre_articles?: number
          nombre_ventes?: number
          panier_moyen?: number
          premier_ticket?: string | null
          total_airtel_money?: number
          total_cartes?: number
          total_cheques?: number
          total_compte_client?: number
          total_especes?: number
          total_ht?: number
          total_moov_money?: number
          total_ttc?: number
          total_tva?: number
          total_virements?: number
        }
        Update: {
          created_at?: string
          data?: Json | null
          date?: string
          dernier_ticket?: string | null
          etablissement_id?: string
          genere_auto?: boolean
          id?: string
          nombre_articles?: number
          nombre_ventes?: number
          panier_moyen?: number
          premier_ticket?: string | null
          total_airtel_money?: number
          total_cartes?: number
          total_cheques?: number
          total_compte_client?: number
          total_especes?: number
          total_ht?: number
          total_moov_money?: number
          total_ttc?: number
          total_tva?: number
          total_virements?: number
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          allowed_routes: string[] | null
          created_at: string
          etablissement_id: string
          id: string
          permissions: Json
          role: Database["public"]["Enums"]["Role"]
          updated_at: string
        }
        Insert: {
          allowed_routes?: string[] | null
          created_at?: string
          etablissement_id: string
          id?: string
          permissions?: Json
          role: Database["public"]["Enums"]["Role"]
          updated_at: string
        }
        Update: {
          allowed_routes?: string[] | null
          created_at?: string
          etablissement_id?: string
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["Role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          utilisateur_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          utilisateur_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions_caisse: {
        Row: {
          created_at: string
          date_cloture: string | null
          date_ouverture: string
          ecart: number | null
          especes_comptees: number | null
          etablissement_id: string
          fond_caisse: number
          id: string
          nombre_annulations: number
          nombre_ventes: number
          notes_cloture: string | null
          total_autres: number
          total_cartes: number
          total_especes: number
          total_mobile_money: number
          total_ventes: number
          updated_at: string
          utilisateur_id: string
        }
        Insert: {
          created_at?: string
          date_cloture?: string | null
          date_ouverture?: string
          ecart?: number | null
          especes_comptees?: number | null
          etablissement_id: string
          fond_caisse: number
          id?: string
          nombre_annulations?: number
          nombre_ventes?: number
          notes_cloture?: string | null
          total_autres?: number
          total_cartes?: number
          total_especes?: number
          total_mobile_money?: number
          total_ventes?: number
          updated_at?: string
          utilisateur_id: string
        }
        Update: {
          created_at?: string
          date_cloture?: string | null
          date_ouverture?: string
          ecart?: number | null
          especes_comptees?: number | null
          etablissement_id?: string
          fond_caisse?: number
          id?: string
          nombre_annulations?: number
          nombre_ventes?: number
          notes_cloture?: string | null
          total_autres?: number
          total_cartes?: number
          total_especes?: number
          total_mobile_money?: number
          total_ventes?: number
          updated_at?: string
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_caisse_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_caisse_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements_produits: {
        Row: {
          created_at: string
          id: string
          nom: string
          prix: number
          produit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom: string
          prix: number
          produit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
          prix?: number
          produit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplements_produits_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_keys: {
        Row: {
          created_at: string
          etablissement_id: string
          expires_at: string
          id: string
          idempotency_key: string
          numero_ticket: string
          vente_id: string
        }
        Insert: {
          created_at?: string
          etablissement_id: string
          expires_at: string
          id?: string
          idempotency_key: string
          numero_ticket: string
          vente_id: string
        }
        Update: {
          created_at?: string
          etablissement_id?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          numero_ticket?: string
          vente_id?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          active: boolean
          capacite: number
          created_at: string
          etablissement_id: string
          forme: Database["public"]["Enums"]["FormeTable"]
          hauteur: number | null
          id: string
          largeur: number | null
          numero: string
          position_x: number | null
          position_y: number | null
          statut: Database["public"]["Enums"]["StatutTable"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          active?: boolean
          capacite?: number
          created_at?: string
          etablissement_id: string
          forme?: Database["public"]["Enums"]["FormeTable"]
          hauteur?: number | null
          id?: string
          largeur?: number | null
          numero: string
          position_x?: number | null
          position_y?: number | null
          statut?: Database["public"]["Enums"]["StatutTable"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          active?: boolean
          capacite?: number
          created_at?: string
          etablissement_id?: string
          forme?: Database["public"]["Enums"]["FormeTable"]
          hauteur?: number | null
          id?: string
          largeur?: number | null
          numero?: string
          position_x?: number | null
          position_y?: number | null
          statut?: Database["public"]["Enums"]["StatutTable"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      utilisateurs: {
        Row: {
          actif: boolean
          allowed_routes: string[] | null
          created_at: string
          email: string
          etablissement_id: string
          id: string
          nom: string
          password: string | null
          pin_code: string | null
          prenom: string
          role: Database["public"]["Enums"]["Role"]
          updated_at: string
        }
        Insert: {
          actif?: boolean
          allowed_routes?: string[] | null
          created_at?: string
          email: string
          etablissement_id: string
          id?: string
          nom: string
          password?: string | null
          pin_code?: string | null
          prenom: string
          role?: Database["public"]["Enums"]["Role"]
          updated_at?: string
        }
        Update: {
          actif?: boolean
          allowed_routes?: string[] | null
          created_at?: string
          email?: string
          etablissement_id?: string
          id?: string
          nom?: string
          password?: string | null
          pin_code?: string | null
          prenom?: string
          role?: Database["public"]["Enums"]["Role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilisateurs_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      ventes: {
        Row: {
          adresse_livraison: string | null
          client_id: string | null
          created_at: string
          etablissement_id: string
          frais_livraison: number | null
          id: string
          notes: string | null
          numero_ticket: string
          session_caisse_id: string | null
          sous_total: number
          statut: Database["public"]["Enums"]["StatutVente"]
          table_id: string | null
          total_final: number
          total_remise: number
          total_tva: number
          type: Database["public"]["Enums"]["TypeVente"]
          type_remise: Database["public"]["Enums"]["TypeRemise"] | null
          updated_at: string
          utilisateur_id: string
          valeur_remise: number | null
        }
        Insert: {
          adresse_livraison?: string | null
          client_id?: string | null
          created_at?: string
          etablissement_id: string
          frais_livraison?: number | null
          id?: string
          notes?: string | null
          numero_ticket: string
          session_caisse_id?: string | null
          sous_total: number
          statut?: Database["public"]["Enums"]["StatutVente"]
          table_id?: string | null
          total_final: number
          total_remise?: number
          total_tva: number
          type?: Database["public"]["Enums"]["TypeVente"]
          type_remise?: Database["public"]["Enums"]["TypeRemise"] | null
          updated_at?: string
          utilisateur_id: string
          valeur_remise?: number | null
        }
        Update: {
          adresse_livraison?: string | null
          client_id?: string | null
          created_at?: string
          etablissement_id?: string
          frais_livraison?: number | null
          id?: string
          notes?: string | null
          numero_ticket?: string
          session_caisse_id?: string | null
          sous_total?: number
          statut?: Database["public"]["Enums"]["StatutVente"]
          table_id?: string | null
          total_final?: number
          total_remise?: number
          total_tva?: number
          type?: Database["public"]["Enums"]["TypeVente"]
          type_remise?: Database["public"]["Enums"]["TypeRemise"] | null
          updated_at?: string
          utilisateur_id?: string
          valeur_remise?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ventes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "sessions_caisse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          active: boolean
          couleur: string | null
          created_at: string
          delai_estime: number | null
          description: string | null
          etablissement_id: string
          frais_livraison: number
          hauteur: number | null
          id: string
          largeur: number | null
          nom: string
          ordre: number
          position_x: number | null
          position_y: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          couleur?: string | null
          created_at?: string
          delai_estime?: number | null
          description?: string | null
          etablissement_id: string
          frais_livraison?: number
          hauteur?: number | null
          id?: string
          largeur?: number | null
          nom: string
          ordre?: number
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          couleur?: string | null
          created_at?: string
          delai_estime?: number | null
          description?: string | null
          etablissement_id?: string
          frais_livraison?: number
          hauteur?: number | null
          id?: string
          largeur?: number | null
          nom?: string
          ordre?: number
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      livraisons: {
        Row: {
          id: string
          vente_id: string
          statut: string
          adresse: string
          telephone: string
          livreur_id: string | null
          livreur_nom: string | null
          estimation_minutes: number | null
          notes: string | null
          coordonnees: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vente_id: string
          statut?: string
          adresse: string
          telephone: string
          livreur_id?: string | null
          livreur_nom?: string | null
          estimation_minutes?: number | null
          notes?: string | null
          coordonnees?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vente_id?: string
          statut?: string
          adresse?: string
          telephone?: string
          livreur_id?: string | null
          livreur_nom?: string | null
          estimation_minutes?: number | null
          notes?: string | null
          coordonnees?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "livraisons_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livraisons_livreur_id_fkey"
            columns: ["livreur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      historique_livraison: {
        Row: {
          id: string
          livraison_id: string
          statut: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          livraison_id: string
          statut: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          livraison_id?: string
          statut?: string
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "historique_livraison_livraison_id_fkey"
            columns: ["livraison_id"]
            isOneToOne: false
            referencedRelation: "livraisons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_etablissement_id: { Args: never; Returns: string }
      get_user_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_manager: { Args: never; Returns: boolean }
      is_manager_or_above: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      set_rls_context:
        | {
            Args: { p_etablissement_id: string; p_user_id: string }
            Returns: undefined
          }
        | {
            Args: {
              p_etablissement_id: string
              p_role: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_etablissement_id: string
              p_role: string
              p_user_id: string
            }
            Returns: undefined
          }
    }
    Enums: {
      ActionAudit:
        | "CREATE"
        | "UPDATE"
        | "DELETE"
        | "LOGIN"
        | "LOGOUT"
        | "CAISSE_OUVERTURE"
        | "CAISSE_CLOTURE"
        | "ANNULATION_VENTE"
        | "REMISE_APPLIQUEE"
      AffichageTable:
        | "NOM"
        | "NUMERO"
        | "CAPACITE"
        | "NOM_NUMERO"
        | "NUMERO_CAPACITE"
      content_status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
      ContentStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
      FormeTable: "RONDE" | "CARREE" | "RECTANGULAIRE"
      MethodeValuation: "FIFO" | "LIFO"
      ModePaiement:
        | "ESPECES"
        | "CARTE_BANCAIRE"
        | "AIRTEL_MONEY"
        | "MOOV_MONEY"
        | "CHEQUE"
        | "VIREMENT"
        | "COMPTE_CLIENT"
        | "MIXTE"
      Role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "CAISSIER" | "SERVEUR"
      StatutPaiementMobile: "EN_ATTENTE" | "CONFIRME" | "ECHOUE" | "EXPIRE"
      StatutPreparation: "EN_ATTENTE" | "EN_PREPARATION" | "PRETE" | "SERVIE"
      StatutTable:
        | "LIBRE"
        | "OCCUPEE"
        | "EN_PREPARATION"
        | "ADDITION"
        | "A_NETTOYER"
      StatutVente: "EN_COURS" | "PAYEE" | "ANNULEE"
      style_separateur: "LIGNE_PLEINE" | "TIRETS" | "ETOILES" | "EGAL" | "AUCUN"
      TauxTva: "STANDARD" | "REDUIT" | "EXONERE"
      type_facture:
        | "TICKET_SIMPLE"
        | "FACTURE_DETAILLEE"
        | "PRO_FORMA"
        | "NOTE_ADDITION"
      TypeConnexion: "USB" | "RESEAU" | "SERIE" | "BLUETOOTH"
      TypeImprimante: "TICKET" | "CUISINE" | "BAR"
      TypeMouvement: "ENTREE" | "SORTIE" | "AJUSTEMENT" | "PERTE" | "INVENTAIRE"
      TypeRemise: "POURCENTAGE" | "MONTANT_FIXE"
      TypeSMS:
        | "COMMANDE_PRETE"
        | "LIVRAISON"
        | "RESERVATION"
        | "PROMO"
        | "CUSTOM"
      TypeVente: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ActionAudit: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "CAISSE_OUVERTURE",
        "CAISSE_CLOTURE",
        "ANNULATION_VENTE",
        "REMISE_APPLIQUEE",
      ],
      AffichageTable: [
        "NOM",
        "NUMERO",
        "CAPACITE",
        "NOM_NUMERO",
        "NUMERO_CAPACITE",
      ],
      content_status: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      ContentStatus: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      FormeTable: ["RONDE", "CARREE", "RECTANGULAIRE"],
      MethodeValuation: ["FIFO", "LIFO"],
      ModePaiement: [
        "ESPECES",
        "CARTE_BANCAIRE",
        "AIRTEL_MONEY",
        "MOOV_MONEY",
        "CHEQUE",
        "VIREMENT",
        "COMPTE_CLIENT",
        "MIXTE",
      ],
      Role: ["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"],
      StatutPaiementMobile: ["EN_ATTENTE", "CONFIRME", "ECHOUE", "EXPIRE"],
      StatutPreparation: ["EN_ATTENTE", "EN_PREPARATION", "PRETE", "SERVIE"],
      StatutTable: [
        "LIBRE",
        "OCCUPEE",
        "EN_PREPARATION",
        "ADDITION",
        "A_NETTOYER",
      ],
      StatutVente: ["EN_COURS", "PAYEE", "ANNULEE"],
      style_separateur: ["LIGNE_PLEINE", "TIRETS", "ETOILES", "EGAL", "AUCUN"],
      TauxTva: ["STANDARD", "REDUIT", "EXONERE"],
      type_facture: [
        "TICKET_SIMPLE",
        "FACTURE_DETAILLEE",
        "PRO_FORMA",
        "NOTE_ADDITION",
      ],
      TypeConnexion: ["USB", "RESEAU", "SERIE", "BLUETOOTH"],
      TypeImprimante: ["TICKET", "CUISINE", "BAR"],
      TypeMouvement: ["ENTREE", "SORTIE", "AJUSTEMENT", "PERTE", "INVENTAIRE"],
      TypeRemise: ["POURCENTAGE", "MONTANT_FIXE"],
      TypeSMS: [
        "COMMANDE_PRETE",
        "LIVRAISON",
        "RESERVATION",
        "PROMO",
        "CUSTOM",
      ],
      TypeVente: ["DIRECT", "TABLE", "LIVRAISON", "EMPORTER"],
    },
  },
} as const

"use client";

/**
 * ModePanel - Panneau contextuel selon le mode de vente
 * - TABLE: Sélection de table
 * - LIVRAISON: Infos client + adresse de livraison
 * - EMPORTER: Infos client optionnelles
 */

import { useState, useEffect } from "react";
import {
  X,
  Search,
  User,
  MapPin,
  Phone,
  Plus,
  Check,
  Users,
  UtensilsCrossed,
  Truck,
  ShoppingBag,
  FileText,
  LayoutGrid,
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { getTables } from "@/actions/tables";
import { searchClients, createClientQuick } from "@/actions/clients";
import { toast } from "sonner";
import type { CartClient, CartTable } from "@/types";
import { FloorPlanSelector } from "./floor-plan-selector";

// Couleurs de statut des tables
const statutColors: Record<string, { bg: string; text: string; border: string }> = {
  LIBRE: { bg: "var(--green-a3)", text: "var(--green-11)", border: "var(--green-8)" },
  OCCUPEE: { bg: "var(--purple-a3)", text: "var(--purple-11)", border: "var(--amber-8)" },
  EN_PREPARATION: { bg: "var(--blue-a3)", text: "var(--blue-11)", border: "var(--blue-8)" },
  ADDITION: { bg: "var(--accent-a3)", text: "var(--accent-11)", border: "var(--accent-8)" },
  A_NETTOYER: { bg: "var(--red-a3)", text: "var(--red-11)", border: "var(--red-8)" },
};

interface ZoneInfo {
  id: string;
  nom: string;
}

interface TableData {
  id: string;
  numero: string;
  capacite: number;
  forme: string;
  statut: string;
  positionX: number | null;
  positionY: number | null;
  largeur: number | null;
  hauteur: number | null;
  zoneId: string | null;
  zone: ZoneInfo | null;
  ventes?: Array<{
    id: string;
    numeroTicket: string;
    totalFinal: number | unknown;
    createdAt: Date | string;
    _count: { lignes: number };
  }>;
}

interface ClientData {
  id: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  adresse: string | null;
}

export function ModePanel() {
  const { typeVente, table, client, tableId, clientId, adresseLivraison, telephoneLivraison, notesLivraison } =
    useCartStore();

  // Ne pas afficher pour la vente directe
  if (typeVente === "DIRECT") {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "var(--gray-a2)",
        borderBottom: "1px solid var(--gray-a6)",
        padding: "12px 16px",
      }}
    >
      {typeVente === "TABLE" && <TableSelector />}
      {typeVente === "LIVRAISON" && <DeliveryPanel />}
      {typeVente === "EMPORTER" && <EmporterPanel />}
    </div>
  );
}

/**
 * Sélecteur de table pour le mode TABLE
 */
function TableSelector() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const { tableId, table, setTable } = useCartStore();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      const data = await getTables({ includeInactive: false });
      setTables(data as TableData[]);
    } catch {
      toast.error("Erreur lors du chargement des tables");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTable = (t: TableData, couverts?: number) => {
    setTable(
      t.id,
      {
        id: t.id,
        numero: t.numero,
        capacite: t.capacite,
        zone: t.zone,
      },
      couverts
    );
    setShowFloorPlan(false);
    toast.success(
      couverts
        ? `Table ${t.numero} sélectionnée (${couverts} couvert${couverts > 1 ? "s" : ""})`
        : `Table ${t.numero} sélectionnée`
    );
  };

  const handleClearTable = () => {
    setTable(undefined, undefined);
  };

  const freeTables = tables.filter((t) => t.statut === "LIBRE");

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--gray-11)",
            fontSize: 13,
          }}
        >
          <UtensilsCrossed size={16} />
          <span>Table:</span>
        </div>

        {table ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              backgroundColor: "var(--accent-a3)",
              borderRadius: 6,
              border: "1px solid var(--accent-8)",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-11)" }}>
              Table {table.numero}
            </span>
            {table.couverts ? <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "var(--accent-11)",
                  backgroundColor: "var(--accent-a4)",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                <Users size={12} />
                {table.couverts}
              </span> : null}
            {table.zone ? <span style={{ fontSize: 12, color: "var(--accent-10)" }}>({table.zone.nom})</span> : null}
            <button
              onClick={() => setShowFloorPlan(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                color: "var(--accent-11)",
                fontSize: 12,
              }}
              title="Changer de table"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={handleClearTable}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                color: "var(--accent-11)",
              }}
              title="Retirer la table"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowFloorPlan(true)}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              fontSize: 13,
              color: "var(--gray-12)",
              backgroundColor: "var(--color-panel-solid)",
              border: "1px dashed var(--gray-a8)",
              borderRadius: 6,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            <LayoutGrid size={14} />
            {isLoading ? "Chargement..." : "Voir le plan de salle"}
          </button>
        )}

        <span style={{ fontSize: 12, color: "var(--gray-10)", marginLeft: "auto" }}>
          {freeTables.length} table{freeTables.length > 1 ? "s" : ""} libre{freeTables.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Modal Plan de salle */}
      {showFloorPlan ? <FloorPlanSelector
          tables={tables}
          selectedTableId={tableId}
          onSelect={handleSelectTable}
          onClose={() => setShowFloorPlan(false)}
          onlyFreeTables={true}
        /> : null}
    </>
  );
}

/**
 * Panneau pour le mode LIVRAISON
 */
function DeliveryPanel() {
  const {
    client,
    adresseLivraison,
    telephoneLivraison,
    notesLivraison,
    setClient,
    setDeliveryInfo,
  } = useCartStore();

  const [showClientModal, setShowClientModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const handleClientSelect = (c: ClientData) => {
    setClient(c.id, {
      id: c.id,
      nom: c.nom,
      prenom: c.prenom,
      telephone: c.telephone,
      adresse: c.adresse,
    });
    // Pré-remplir l'adresse et le téléphone du client
    if (c.adresse || c.telephone) {
      setDeliveryInfo({
        adresseLivraison: c.adresse || adresseLivraison,
        telephoneLivraison: c.telephone || telephoneLivraison,
        notesLivraison,
      });
    }
    setShowClientModal(false);
  };

  const handleClearClient = () => {
    setClient(undefined, undefined);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Ligne 1: Client */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--gray-11)",
              fontSize: 13,
              minWidth: 80,
            }}
          >
            <Truck size={16} />
            <span>Client:</span>
          </div>

          {client ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                backgroundColor: "var(--blue-a3)",
                borderRadius: 6,
                border: "1px solid var(--blue-8)",
              }}
            >
              <User size={14} style={{ color: "var(--blue-11)" }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--blue-11)" }}>
                {client.nom} {client.prenom || ""}
              </span>
              {client.telephone ? <span style={{ fontSize: 12, color: "var(--blue-10)" }}>
                  ({client.telephone})
                </span> : null}
              <button
                onClick={handleClearClient}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  color: "var(--blue-11)",
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClientModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontSize: 13,
                color: "var(--gray-12)",
                backgroundColor: "var(--color-panel-solid)",
                border: "1px dashed var(--gray-a8)",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <Plus size={14} />
              Ajouter un client
            </button>
          )}
        </div>

        {/* Ligne 2: Adresse et téléphone */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--gray-11)",
              fontSize: 13,
              minWidth: 80,
            }}
          >
            <MapPin size={16} />
            <span>Livraison:</span>
          </div>

          {adresseLivraison ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                backgroundColor: "var(--green-a3)",
                borderRadius: 6,
                border: "1px solid var(--green-8)",
                flex: 1,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "var(--green-11)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {adresseLivraison}
              </span>
              {telephoneLivraison ? <span style={{ fontSize: 12, color: "var(--green-10)" }}>
                  <Phone size={12} style={{ display: "inline", marginRight: 4 }} />
                  {telephoneLivraison}
                </span> : null}
              <button
                onClick={() => setShowAddressModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  color: "var(--green-11)",
                  fontSize: 12,
                }}
              >
                Modifier
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddressModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontSize: 13,
                color: "var(--red-11)",
                backgroundColor: "var(--red-a2)",
                border: "1px dashed var(--red-8)",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <MapPin size={14} />
              Adresse requise
            </button>
          )}
        </div>
      </div>

      {/* Modal client */}
      {showClientModal ? <ClientModal onSelect={handleClientSelect} onClose={() => setShowClientModal(false)} /> : null}

      {/* Modal adresse */}
      {showAddressModal ? <AddressModal onClose={() => setShowAddressModal(false)} /> : null}
    </>
  );
}

/**
 * Panneau pour le mode À EMPORTER
 */
function EmporterPanel() {
  const { client, setClient } = useCartStore();
  const [showClientModal, setShowClientModal] = useState(false);

  const handleClientSelect = (c: ClientData) => {
    setClient(c.id, {
      id: c.id,
      nom: c.nom,
      prenom: c.prenom,
      telephone: c.telephone,
      adresse: c.adresse,
    });
    setShowClientModal(false);
  };

  const handleClearClient = () => {
    setClient(undefined, undefined);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--gray-11)",
            fontSize: 13,
          }}
        >
          <ShoppingBag size={16} />
          <span>Client (optionnel):</span>
        </div>

        {client ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              backgroundColor: "var(--blue-a3)",
              borderRadius: 6,
              border: "1px solid var(--blue-8)",
            }}
          >
            <User size={14} style={{ color: "var(--blue-11)" }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--blue-11)" }}>
              {client.nom} {client.prenom || ""}
            </span>
            {client.telephone ? <span style={{ fontSize: 12, color: "var(--blue-10)" }}>({client.telephone})</span> : null}
            <button
              onClick={handleClearClient}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                color: "var(--blue-11)",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowClientModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              fontSize: 13,
              color: "var(--gray-12)",
              backgroundColor: "var(--color-panel-solid)",
              border: "1px dashed var(--gray-a8)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            <Plus size={14} />
            Ajouter un client
          </button>
        )}
      </div>

      {showClientModal ? <ClientModal onSelect={handleClientSelect} onClose={() => setShowClientModal(false)} /> : null}
    </>
  );
}

/**
 * Modal de recherche/création de client
 */
function ClientModal({
  onSelect,
  onClose,
}: {
  onSelect: (client: ClientData) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ClientData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Recherche de clients
  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchClients(searchQuery);
        setResults(data as ClientData[]);
      } catch {
        toast.error("Erreur de recherche");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          borderRadius: 12,
          width: "90%",
          maxWidth: 450,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--gray-a6)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--gray-12)" }}>
            {showCreateForm ? "Nouveau client" : "Rechercher un client"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--gray-11)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {showCreateForm ? (
          <CreateClientForm
            onSuccess={onSelect}
            onCancel={() => setShowCreateForm(false)}
            initialPhone={searchQuery.match(/^\d+$/) ? searchQuery : undefined}
          />
        ) : (
          <>
            {/* Recherche */}
            <div style={{ padding: "16px 20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  backgroundColor: "var(--gray-a2)",
                  borderRadius: 8,
                  border: "1px solid var(--gray-a6)",
                }}
              >
                <Search size={18} style={{ color: "var(--gray-10)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nom, téléphone..."
                  autoFocus
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    fontSize: 14,
                    color: "var(--gray-12)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Résultats */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px" }}>
              {isSearching ? (
                <div style={{ textAlign: "center", color: "var(--gray-10)", padding: 20 }}>
                  Recherche...
                </div>
              ) : results.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelect(c)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        backgroundColor: "var(--gray-a2)",
                        border: "1px solid var(--gray-a6)",
                        borderRadius: 8,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          backgroundColor: "var(--blue-a3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--blue-11)",
                        }}
                      >
                        <User size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: "var(--gray-12)" }}>
                          {c.nom} {c.prenom || ""}
                        </div>
                        {c.telephone ? <div style={{ fontSize: 12, color: "var(--gray-10)" }}>
                            {c.telephone}
                          </div> : null}
                      </div>
                      {c.adresse ? <MapPin size={14} style={{ color: "var(--gray-9)" }} /> : null}
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div style={{ textAlign: "center", color: "var(--gray-10)", padding: 20 }}>
                  Aucun client trouvé
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "var(--gray-10)", padding: 20 }}>
                  Tapez au moins 2 caractères
                </div>
              )}
            </div>

            {/* Bouton créer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--gray-a6)" }}>
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--accent-11)",
                  backgroundColor: "var(--accent-a3)",
                  border: "1px solid var(--accent-8)",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <Plus size={18} />
                Créer un nouveau client
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Formulaire de création rapide de client
 */
function CreateClientForm({
  onSuccess,
  onCancel,
  initialPhone,
}: {
  onSuccess: (client: ClientData) => void;
  onCancel: () => void;
  initialPhone?: string;
}) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState(initialPhone || "");
  const [adresse, setAdresse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createClientQuick({
        nom: nom.trim(),
        prenom: prenom.trim() || undefined,
        telephone: telephone.trim() || undefined,
        adresse: adresse.trim() || undefined,
      });

      if (result.success && result.data) {
        toast.success("Client créé");
        onSuccess(result.data as ClientData);
      } else if (result.existingClient) {
        toast.info("Un client avec ce téléphone existe déjà");
        onSuccess(result.existingClient as ClientData);
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    borderRadius: 8,
    border: "1px solid var(--gray-a6)",
    backgroundColor: "var(--gray-a2)",
    color: "var(--gray-12)",
    outline: "none",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--gray-11)", marginBottom: 6 }}>
            Nom *
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du client"
            style={inputStyle}
            autoFocus
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--gray-11)", marginBottom: 6 }}>
            Prénom
          </label>
          <input
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Prénom"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--gray-11)", marginBottom: 6 }}>
            Téléphone
          </label>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="Ex: 077123456"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--gray-11)", marginBottom: 6 }}>
            Adresse
          </label>
          <textarea
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            placeholder="Adresse de livraison"
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "12px 20px",
          borderTop: "1px solid var(--gray-a6)",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--gray-12)",
            backgroundColor: "transparent",
            border: "1px solid var(--gray-a6)",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            flex: 1,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 600,
            color: "white",
            backgroundColor: "var(--accent-9)",
            border: "none",
            borderRadius: 8,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Création..." : "Créer"}
        </button>
      </div>
    </form>
  );
}

/**
 * Modal de saisie d'adresse de livraison
 */
function AddressModal({ onClose }: { onClose: () => void }) {
  const { adresseLivraison, telephoneLivraison, notesLivraison, setDeliveryInfo } = useCartStore();

  const [adresse, setAdresse] = useState(adresseLivraison || "");
  const [telephone, setTelephone] = useState(telephoneLivraison || "");
  const [notes, setNotes] = useState(notesLivraison || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adresse.trim()) {
      toast.error("L'adresse est requise");
      return;
    }
    setDeliveryInfo({
      adresseLivraison: adresse.trim(),
      telephoneLivraison: telephone.trim() || undefined,
      notesLivraison: notes.trim() || undefined,
    });
    toast.success("Adresse enregistrée");
    onClose();
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    borderRadius: 8,
    border: "1px solid var(--gray-a6)",
    backgroundColor: "var(--gray-a2)",
    color: "var(--gray-12)",
    outline: "none",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          borderRadius: 12,
          width: "90%",
          maxWidth: 400,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--gray-a6)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--gray-12)" }}>
            Adresse de livraison
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--gray-11)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--gray-11)", marginBottom: 6 }}>
                <MapPin size={14} style={{ display: "inline", marginRight: 6 }} />
                Adresse *
              </label>
              <textarea
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Quartier, rue, repères..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--gray-11)", marginBottom: 6 }}>
                <Phone size={14} style={{ display: "inline", marginRight: 6 }} />
                Téléphone de contact
              </label>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: 077123456"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--gray-11)", marginBottom: 6 }}>
                <FileText size={14} style={{ display: "inline", marginRight: 6 }} />
                Notes (instructions livreur)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Sonner 2 fois, 3ème étage..."
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 20px",
              borderTop: "1px solid var(--gray-a6)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--gray-12)",
                backgroundColor: "transparent",
                border: "1px solid var(--gray-a6)",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                color: "white",
                backgroundColor: "var(--accent-9)",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

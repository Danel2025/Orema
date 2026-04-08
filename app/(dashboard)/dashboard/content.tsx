"use client";

import {
  ChartBar,
  Package,
  ShoppingCart,
  Users,
  TrendUp,
  Clock,
  Plus,
  Receipt,
  UserPlus,
  Warning,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import Link from "next/link";
import { StatCard } from "@/components/composed";
import { CAChart, PeakHoursChart, PaymentModesChart, SalesByType } from "@/components/rapports";
import { formatCurrency } from "@/lib/design-system/currency";

interface DashboardContentProps {
  kpis: {
    caJour: number;
    caSemaine: number;
    caMois: number;
    nombreVentes: number;
    panierMoyen: number;
    comparaisonJour: number | null;
    comparaisonSemaine: number | null;
    comparaisonMois: number | null;
    margeBrute: number | null;
  };
  topProducts: Array<{
    id: string;
    nom: string;
    categorieNom: string;
    quantite: number;
    ca: number;
  }>;
  ventesRecentes: {
    factures: Array<{
      id: string;
      numeroTicket: string;
      totalFinal: number;
      createdAt: string | Date;
      client: { nom: string } | null;
    }>;
  };
  nombreProduits: number;
  nombreClients: number;
  sessionCaisse: { date_ouverture: string } | null;
  produitsRupture: Array<{
    id: string;
    nom: string;
    stock_actuel: number | null;
    stock_min: number | null;
  }>;
}

export function DashboardContent({
  kpis,
  topProducts,
  ventesRecentes,
  nombreProduits,
  nombreClients,
  sessionCaisse,
  produitsRupture,
}: DashboardContentProps) {
  const trendJour =
    kpis.comparaisonJour !== null
      ? {
          value: `${kpis.comparaisonJour > 0 ? "+" : ""}${kpis.comparaisonJour}%`,
          isPositive: kpis.comparaisonJour >= 0,
        }
      : undefined;

  const isCaisseOuverte = sessionCaisse !== null;

  return (
    <div>
      {/* En-tete avec etat de la caisse */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "var(--gray-12)",
              margin: 0,
            }}
          >
            Tableau de bord
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--gray-11)",
              marginTop: 8,
            }}
          >
            Bienvenue sur Orema N+ - Votre systeme de caisse moderne
          </p>
        </div>

        {/* Etat de la caisse */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px",
            borderRadius: 12,
            backgroundColor: isCaisseOuverte ? "var(--green-a3)" : "var(--gray-a3)",
            border: `1px solid ${isCaisseOuverte ? "var(--green-a6)" : "var(--gray-a6)"}`,
          }}
        >
          {isCaisseOuverte ? (
            <CheckCircle size={20} style={{ color: "var(--green-9)" }} />
          ) : (
            <XCircle size={20} style={{ color: "var(--gray-9)" }} />
          )}
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: isCaisseOuverte ? "var(--green-11)" : "var(--gray-11)",
              }}
            >
              {isCaisseOuverte ? "Caisse ouverte" : "Caisse fermee"}
            </div>
            {isCaisseOuverte && sessionCaisse ? (
              <div style={{ fontSize: 12, color: "var(--green-10)" }}>
                Depuis{" "}
                {new Date(sessionCaisse.date_ouverture).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            ) : null}
          </div>
          <Link
            href="/caisse"
            style={{
              marginLeft: 8,
              padding: "6px 12px",
              borderRadius: 6,
              backgroundColor: isCaisseOuverte ? "var(--green-9)" : "var(--accent-9)",
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            {isCaisseOuverte ? "Accéder" : "Ouvrir"}
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/caisse"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: 10,
            backgroundColor: "var(--accent-9)",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            transition: "transform 0.1s, box-shadow 0.1s",
          }}
        >
          <ShoppingCart size={18} />
          Nouvelle vente
        </Link>
        <Link
          href="/produits/nouveau"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: 10,
            backgroundColor: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a6)",
            color: "var(--gray-12)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <Plus size={18} />
          Ajouter produit
        </Link>
        <Link
          href="/clients/nouveau"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: 10,
            backgroundColor: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a6)",
            color: "var(--gray-12)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <UserPlus size={18} />
          Nouveau client
        </Link>
        <Link
          href="/rapports"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: 10,
            backgroundColor: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a6)",
            color: "var(--gray-12)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <Receipt size={18} />
          Rapports
        </Link>
      </div>

      {/* Alerte stock bas */}
      {produitsRupture.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--red-a3)",
            border: "1px solid var(--red-a6)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: "var(--red-a5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Package size={20} style={{ color: "var(--red-9)" }} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--red-11)",
                    margin: 0,
                  }}
                >
                  {produitsRupture.length} produit
                  {produitsRupture.length > 1 ? "s" : ""} en stock bas
                </h3>
                <p style={{ fontSize: 13, color: "var(--red-10)", margin: 0, marginTop: 2 }}>
                  Ces produits necessitent un reapprovisionnement
                </p>
              </div>
            </div>
            <Link
              href="/stocks"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor: "var(--red-9)",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Gerer les stocks
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Liste des produits en rupture (max 5) */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {produitsRupture.slice(0, 5).map((produit) => (
              <div
                key={produit.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor: "var(--color-panel-solid)",
                  border: "1px solid var(--red-a6)",
                }}
              >
                <Warning size={14} style={{ color: "var(--red-9)" }} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--gray-12)",
                  }}
                >
                  {produit.nom}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--red-11)",
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  ({produit.stock_actuel ?? 0}/{produit.stock_min ?? 0})
                </span>
              </div>
            ))}
            {produitsRupture.length > 5 && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor: "var(--red-a4)",
                  fontSize: 13,
                  color: "var(--red-11)",
                  fontWeight: 500,
                }}
              >
                +{produitsRupture.length - 5} autres
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistiques principales - Grille 4 colonnes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <StatCard
          title="Ventes du jour"
          value={formatCurrency(kpis.caJour)}
          icon={ShoppingCart}
          trend={trendJour}
        />
        <StatCard
          title="Produits en stock"
          value={nombreProduits.toString()}
          icon={Package}
          color="blue"
        />
        <StatCard title="Clients" value={nombreClients.toString()} icon={Users} color="green" />
        <StatCard
          title="Commandes"
          value={kpis.nombreVentes.toString()}
          icon={ChartBar}
          color="purple"
        />
      </div>

      {/* KPIs secondaires */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-panel-solid)",
            borderRadius: 12,
            padding: 16,
            border: "1px solid var(--gray-a6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <TrendUp size={18} style={{ color: "var(--green-9)" }} />
            <span style={{ fontSize: 13, color: "var(--gray-11)" }}>Panier moyen</span>
          </div>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--gray-12)",
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            }}
          >
            {formatCurrency(kpis.panierMoyen)}
          </span>
        </div>

        <div
          style={{
            backgroundColor: "var(--color-panel-solid)",
            borderRadius: 12,
            padding: 16,
            border: "1px solid var(--gray-a6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Clock size={18} style={{ color: "var(--blue-9)" }} />
            <span style={{ fontSize: 13, color: "var(--gray-11)" }}>CA semaine</span>
          </div>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--gray-12)",
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            }}
          >
            {formatCurrency(kpis.caSemaine)}
          </span>
          {kpis.comparaisonSemaine !== null && (
            <span
              style={{
                fontSize: 12,
                marginLeft: 8,
                color: kpis.comparaisonSemaine >= 0 ? "var(--green-9)" : "var(--red-9)",
              }}
            >
              {kpis.comparaisonSemaine > 0 ? "+" : ""}
              {kpis.comparaisonSemaine}%
            </span>
          )}
        </div>

        <div
          style={{
            backgroundColor: "var(--color-panel-solid)",
            borderRadius: 12,
            padding: 16,
            border: "1px solid var(--gray-a6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <ChartBar size={18} style={{ color: "var(--purple-9)" }} />
            <span style={{ fontSize: 13, color: "var(--gray-11)" }}>CA mois</span>
          </div>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--gray-12)",
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            }}
          >
            {formatCurrency(kpis.caMois)}
          </span>
          {kpis.comparaisonMois !== null && (
            <span
              style={{
                fontSize: 12,
                marginLeft: 8,
                color: kpis.comparaisonMois >= 0 ? "var(--green-9)" : "var(--red-9)",
              }}
            >
              {kpis.comparaisonMois > 0 ? "+" : ""}
              {kpis.comparaisonMois}%
            </span>
          )}
        </div>

        {kpis.margeBrute !== null && (
          <div
            style={{
              backgroundColor: "var(--color-panel-solid)",
              borderRadius: 12,
              padding: 16,
              border: "1px solid var(--gray-a6)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <TrendUp size={18} style={{ color: "var(--purple-9)" }} />
              <span style={{ fontSize: 13, color: "var(--gray-11)" }}>Marge brute</span>
            </div>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--gray-12)",
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
              }}
            >
              {kpis.margeBrute}%
            </span>
          </div>
        )}
      </div>

      {/* Graphique du CA - Pleine largeur */}
      <div style={{ marginBottom: 24 }}>
        <CAChart />
      </div>

      {/* Graphiques cote a cote : Heures de pointe + Modes de paiement */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: 24,
          marginBottom: 24,
        }}
      >
        <PeakHoursChart />
        <PaymentModesChart />
      </div>

      {/* Ventes par type */}
      <div style={{ marginBottom: 32 }}>
        <SalesByType />
      </div>

      {/* Section ventes recentes et produits populaires */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 24,
          marginBottom: 32,
        }}
      >
        {/* Ventes recentes */}
        <div
          style={{
            backgroundColor: "var(--color-panel-solid)",
            borderRadius: 12,
            border: "1px solid var(--gray-a6)",
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--gray-12)",
              marginBottom: 8,
            }}
          >
            Ventes recentes
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--gray-11)",
              marginBottom: 24,
            }}
          >
            Dernieres transactions
          </p>

          {ventesRecentes.factures.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ventesRecentes.factures.map((vente) => (
                <div
                  key={vente.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--gray-a4)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--gray-12)",
                      }}
                    >
                      #{vente.numeroTicket}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gray-10)" }}>
                      {new Date(vente.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {vente.client ? ` - ${vente.client.nom}` : null}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--gray-12)",
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(vente.totalFinal)}
                  </div>
                </div>
              ))}
              <Link
                href="/rapports/historique"
                style={{
                  textAlign: "center",
                  padding: "12px",
                  color: "var(--accent-9)",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Voir tout l'historique
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: "var(--gray-a3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <ShoppingCart size={28} style={{ color: "var(--gray-9)" }} />
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--gray-12)",
                  marginBottom: 8,
                }}
              >
                Aucune vente
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--gray-11)",
                  marginBottom: 20,
                  maxWidth: 300,
                }}
              >
                Vous n'avez pas encore enregistre de vente aujourd'hui.
              </p>
              <Link
                href="/caisse"
                style={{
                  backgroundColor: "var(--accent-9)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Ouvrir la caisse
              </Link>
            </div>
          )}
        </div>

        {/* Produits populaires */}
        <div
          style={{
            backgroundColor: "var(--color-panel-solid)",
            borderRadius: 12,
            border: "1px solid var(--gray-a6)",
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--gray-12)",
              marginBottom: 8,
            }}
          >
            Produits populaires
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--gray-11)",
              marginBottom: 24,
            }}
          >
            Articles les plus vendus aujourd'hui
          </p>

          {topProducts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topProducts.map((produit, index) => (
                <div
                  key={produit.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid var(--gray-a4)",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor:
                        index === 0
                          ? "var(--purple-a3)"
                          : index === 1
                            ? "var(--gray-a3)"
                            : index === 2
                              ? "var(--violet-a3)"
                              : "var(--gray-a2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      color:
                        index === 0
                          ? "var(--purple-11)"
                          : index === 1
                            ? "var(--gray-11)"
                            : index === 2
                              ? "var(--violet-11)"
                              : "var(--gray-10)",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--gray-12)",
                      }}
                    >
                      {produit.nom}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gray-10)" }}>
                      {produit.categorieNom}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--gray-12)",
                      }}
                    >
                      {produit.quantite} vendus
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--gray-10)",
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      }}
                    >
                      {formatCurrency(produit.ca)}
                    </div>
                  </div>
                </div>
              ))}
              <Link
                href="/rapports"
                style={{
                  textAlign: "center",
                  padding: "12px",
                  color: "var(--accent-9)",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Voir les rapports
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: "var(--gray-a3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Package size={28} style={{ color: "var(--gray-9)" }} />
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--gray-12)",
                  marginBottom: 8,
                }}
              >
                Aucun produit vendu
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--gray-11)",
                  marginBottom: 20,
                  maxWidth: 300,
                }}
              >
                Les produits les plus vendus apparaitront ici.
              </p>
              <Link
                href="/produits"
                style={{
                  backgroundColor: "var(--accent-9)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Gerer les produits
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Alerte configuration (conditionnelle) */}
      {(nombreProduits === 0 || nombreClients === 0) && (
        <div
          style={{
            backgroundColor: "var(--purple-a3)",
            border: "1px solid var(--purple-a6)",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: "var(--amber-a5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Warning size={20} style={{ color: "var(--amber-9)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--purple-11)",
                marginBottom: 4,
              }}
            >
              Configuration incomplete
            </h3>
            <p style={{ fontSize: 14, color: "var(--purple-11)", margin: 0 }}>
              {nombreProduits === 0 && nombreClients === 0
                ? "Ajoutez des produits et des clients pour commencer a vendre."
                : nombreProduits === 0
                  ? "Ajoutez des produits pour commencer a vendre."
                  : "Ajoutez des clients pour profiter de toutes les fonctionnalites."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {nombreProduits === 0 && (
              <Link
                href="/produits"
                style={{
                  backgroundColor: "var(--purple-9)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Ajouter des produits
              </Link>
            )}
            {nombreClients === 0 && (
              <Link
                href="/clients"
                style={{
                  backgroundColor: "transparent",
                  color: "var(--purple-11)",
                  border: "1px solid var(--purple-a6)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Ajouter des clients
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

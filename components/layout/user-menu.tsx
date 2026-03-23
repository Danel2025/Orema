"use client";

/**
 * UserMenu - Menu utilisateur avec dropdown
 * Affiche les informations de l'utilisateur connecté et les actions disponibles
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "@radix-ui/themes";
import { User, Settings, LogOut, UserCircle, Building2, Shield, ChevronDown } from "lucide-react";
import { logoutSupabase } from "@/actions/auth-supabase";
import { useAuth } from "@/lib/auth/context";
import { useMounted } from "@/hooks/use-mounted";
import type { Role } from "@/lib/db/types";

// Labels des rôles en français
const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  CAISSIER: "Caissier",
  SERVEUR: "Serveur",
};

// Couleurs des badges de rôle
const roleColors: Record<Role, string> = {
  SUPER_ADMIN: "var(--red-9)",
  ADMIN: "var(--accent-9)",
  MANAGER: "var(--blue-9)",
  CAISSIER: "var(--green-9)",
  SERVEUR: "var(--purple-9)",
};

export function UserMenu() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const mounted = useMounted();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutSupabase();
    });
  };

  const handleNavigate = (path: string) => {
    router.push(path as "/login" | "/parametres" | "/parametres/profil");
  };

  // Obtenir les initiales de l'utilisateur
  const getInitials = (prenom: string, nom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  // Skeleton loader pour éviter les erreurs d'hydratation et l'état de chargement
  if (!mounted || isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "6px 12px 6px 6px",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "var(--gray-a4)",
          }}
        />
        <div>
          <div
            style={{
              width: 80,
              height: 12,
              borderRadius: 4,
              backgroundColor: "var(--gray-a4)",
              marginBottom: 4,
            }}
          />
          <div
            style={{
              width: 100,
              height: 10,
              borderRadius: 4,
              backgroundColor: "var(--gray-a3)",
            }}
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => handleNavigate("/login")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          backgroundColor: "var(--accent-9)",
          color: "white",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        <User size={18} />
        Se connecter
      </button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "6px 12px 6px 6px",
            borderRadius: 8,
            cursor: "pointer",
            backgroundColor: "transparent",
            border: "none",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--gray-a3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "var(--accent-9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 13,
              color: "white",
            }}
          >
            {getInitials(user.prenom, user.nom)}
          </div>

          {/* Infos */}
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--gray-12)",
                lineHeight: 1.3,
              }}
            >
              {roleLabels[user.role]}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--gray-10)",
                lineHeight: 1.3,
              }}
            >
              {user.email}
            </div>
          </div>

          {/* Chevron */}
          <ChevronDown size={14} style={{ color: "var(--gray-9)", marginLeft: 4 }} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" sideOffset={8}>
        {/* En-tête du menu avec infos utilisateur */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--gray-a6)",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "var(--accent-9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 16,
                color: "white",
              }}
            >
              {getInitials(user.prenom, user.nom)}
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--gray-12)",
                }}
              >
                {user.prenom} {user.nom}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--gray-10)",
                  marginTop: 2,
                }}
              >
                {user.email}
              </div>
            </div>
          </div>

          {/* Badge de rôle */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
              padding: "4px 10px",
              borderRadius: 20,
              backgroundColor: roleColors[user.role] + "15",
              color: roleColors[user.role],
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Shield size={12} />
            {roleLabels[user.role]}
          </div>

          {/* Établissement */}
          {user.etablissementNom ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
                fontSize: 12,
                color: "var(--gray-10)",
              }}
            >
              <Building2 size={12} />
              {user.etablissementNom}
            </div>
          ) : null}
        </div>

        {/* Options du menu */}
        <DropdownMenu.Item
          onSelect={() => handleNavigate("/parametres/profil")}
          style={{ cursor: "pointer" }}
        >
          <UserCircle size={16} style={{ marginRight: 8 }} />
          Mon profil
        </DropdownMenu.Item>

        <DropdownMenu.Item
          onSelect={() => handleNavigate("/parametres")}
          style={{ cursor: "pointer" }}
        >
          <Settings size={16} style={{ marginRight: 8 }} />
          Paramètres
        </DropdownMenu.Item>

        <DropdownMenu.Separator />

        <DropdownMenu.Item
          color="red"
          onSelect={handleLogout}
          disabled={isPending}
          style={{ cursor: isPending ? "not-allowed" : "pointer" }}
        >
          <LogOut size={16} style={{ marginRight: 8 }} />
          {isPending ? "Déconnexion..." : "Se déconnecter"}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

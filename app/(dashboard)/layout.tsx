import { redirect } from "next/navigation";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { getPermissionsForRole, getAllowedRoutesForRole } from "@/lib/permissions-db";
import { DashboardProviders } from "@/components/layout/dashboard-providers";
import { UpdateNotifier } from "@/components/layout/update-notifier";

// Forcer le rendu dynamique pour vérifier l'auth à chaque requête
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Récupérer l'utilisateur complet (Supabase + Prisma)
  const user = await getCurrentUser();

  // Si pas d'utilisateur, rediriger vers login
  if (!user) {
    redirect("/login");
  }

  // Si pas d'établissement, rediriger vers login
  if (!user.etablissementId) {
    redirect("/login");
  }

  // Charger les permissions depuis la BD (ou defaults)
  const permissions = await getPermissionsForRole(user.role, user.etablissementId);

  // Charger les routes autorisées par rôle (si configuré)
  const roleAllowedRoutes = await getAllowedRoutesForRole(user.role, user.etablissementId);

  // Determiner les routes autorisees:
  // 1. Routes individuelles (si definies ET non vides) ont priorite
  // 2. Sinon, routes par role (si definies)
  // 3. Sinon, undefined = pas de restriction
  //
  // Note: un tableau VIDE [] pour les routes individuelles = "pas de config", on passe aux routes par role
  // Un tableau VIDE [] pour les routes par role = "aucun acces" (restriction totale)
  let finalAllowedRoutes: string[] | undefined;

  // Verifier routes individuelles (tableau non vide = configuration explicite)
  if (Array.isArray(user.allowedRoutes) && user.allowedRoutes.length > 0) {
    finalAllowedRoutes = user.allowedRoutes;
  }
  // Sinon verifier routes par role (tableau existe = configuration, meme vide = aucun acces)
  else if (Array.isArray(roleAllowedRoutes)) {
    finalAllowedRoutes = roleAllowedRoutes;
  }
  // Sinon pas de restriction
  else {
    finalAllowedRoutes = undefined;
  }

  // Transformer en AuthUser pour le contexte
  const authUser: AuthUser = {
    userId: user.userId,
    authId: user.authId,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    etablissementId: user.etablissementId,
    etablissementNom: user.etablissementNom,
    plan: user.plan ?? "essentiel",
    planStatut: user.planStatut,
    planDateFin: user.planDateFin,
    allowedRoutes: finalAllowedRoutes,
  };

  return (
    <DashboardProviders user={authUser} permissions={permissions}>
      <a href="#main-content" className="skip-to-content">
        Aller au contenu principal
      </a>
      {children}
      <UpdateNotifier />
    </DashboardProviders>
  );
}

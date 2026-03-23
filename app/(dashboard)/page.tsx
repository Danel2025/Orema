import { redirect } from "next/navigation";

/**
 * Page racine du dashboard - redirige vers /dashboard
 * Cette page existe pour gérer le cas où un utilisateur accède au groupe (dashboard)
 * sans spécifier de route spécifique
 */
export default function DashboardRootPage() {
  redirect("/dashboard");
}

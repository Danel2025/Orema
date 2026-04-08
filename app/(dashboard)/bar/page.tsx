import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPendingOrders } from "@/actions/preparation";
import { BarDisplay } from "@/components/bar/bar-display";

export const metadata = {
  title: "Bar | Orema N+",
  description: "Écran de préparation des commandes bar",
};

export default async function BarPage() {
  const user = await getCurrentUser();

  if (!user || !user.etablissementId) {
    redirect("/login");
  }

  const result = await getPendingOrders("bar", user.etablissementId);
  const initialOrders = result.success && result.data ? result.data : [];

  return <BarDisplay initialOrders={initialOrders} />;
}

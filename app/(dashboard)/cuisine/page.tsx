import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPendingOrders } from "@/actions/preparation";
import { KitchenDisplay } from "@/components/cuisine/kitchen-display";

export const metadata = {
  title: "Cuisine | Orema N+",
  description: "Écran de préparation des commandes cuisine (KDS)",
};

export default async function CuisinePage() {
  const user = await getCurrentUser();

  if (!user || !user.etablissementId) {
    redirect("/login");
  }

  const result = await getPendingOrders("cuisine", user.etablissementId);
  const initialOrders = result.success && result.data ? result.data : [];

  return <KitchenDisplay initialOrders={initialOrders} />;
}

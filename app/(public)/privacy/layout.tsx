import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | Oréma N+",
  description:
    "Découvrez comment Oréma N+ protège vos données personnelles, conformément à la législation gabonaise.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales | Oréma N+",
  description:
    "Mentions légales, informations sur l'éditeur et l'hébergeur du site Oréma N+.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

/**
 * Composant d'indicateur de chargement
 */

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Loading({ size = "md", text, className }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("text-accent animate-spin", sizeClasses[size])} />
      {text ? <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p> : null}
    </div>
  );
}

/**
 * Skeleton loader pour les cartes
 */
export function SkeletonCard() {
  return <div className="skeleton h-32 w-full rounded-lg" aria-label="Chargement..." />;
}

/**
 * Skeleton loader pour les lignes de tableau
 */
export function SkeletonRow() {
  return (
    <div className="flex gap-4">
      <div className="skeleton h-4 flex-1 rounded" />
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-4 w-16 rounded" />
    </div>
  );
}

"use client";

import { Moon, Sun, Monitor } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

import { useMounted } from "@/hooks/use-mounted";

export function ThemeToggle() {
  const mounted = useMounted();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  if (!mounted) {
    return (
      <button
        aria-label="Chargement du thème"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 8,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--gray-11)",
        }}
      >
        <Sun size={18} />
      </button>
    );
  }

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor size={18} weight="duotone" />;
    }
    return resolvedTheme === "light" ? (
      <Moon size={18} weight="duotone" />
    ) : (
      <Sun size={18} weight="duotone" />
    );
  };

  const getLabel = () => {
    if (theme === "system") {
      return "Thème automatique (système)";
    }
    return `Basculer en mode ${resolvedTheme === "light" ? "sombre" : "clair"}`;
  };

  return (
    <button
      onClick={toggleTheme}
      onDoubleClick={cycleTheme}
      aria-label={getLabel()}
      title={`${getLabel()} (double-clic pour le mode automatique)`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 8,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: "var(--gray-11)",
        transition: "color 0.2s ease, background-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--gray-a3)";
        e.currentTarget.style.color = "var(--gray-12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "var(--gray-11)";
      }}
    >
      {getIcon()}
    </button>
  );
}

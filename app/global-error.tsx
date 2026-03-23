"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log uniquement le digest (jamais la stack trace ou les details internes)
    console.error("Global error:", error.digest || "unknown");
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#111",
          color: "#fff",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Erreur critique</h1>
          <p style={{ color: "#999", marginBottom: "2rem" }}>Une erreur inattendue est survenue.</p>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#f97316",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Recharger
          </button>
        </div>
      </body>
    </html>
  );
}

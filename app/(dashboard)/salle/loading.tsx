/**
 * Loading UI pour la page Salle
 * S'affiche automatiquement pendant le chargement de la page Server Component
 */
export default function SalleLoading() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header skeleton */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              height: 28,
              width: 180,
              backgroundColor: "var(--gray-a4)",
              borderRadius: 6,
            }}
            className="animate-pulse"
          />
          <div
            style={{
              height: 16,
              width: 220,
              backgroundColor: "var(--gray-a3)",
              borderRadius: 4,
              marginTop: 8,
            }}
            className="animate-pulse"
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              height: 36,
              width: 100,
              backgroundColor: "var(--gray-a3)",
              borderRadius: 8,
            }}
            className="animate-pulse"
          />
          <div
            style={{
              height: 36,
              width: 140,
              backgroundColor: "var(--accent-a4)",
              borderRadius: 8,
            }}
            className="animate-pulse"
          />
        </div>
      </div>

      {/* Stats skeleton */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 72,
              backgroundColor: "var(--gray-a3)",
              borderRadius: 10,
              border: "1px solid var(--gray-a4)",
            }}
            className="animate-pulse"
          />
        ))}
      </div>

      {/* Filters & Legend skeleton */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              height: 36,
              width: 160,
              backgroundColor: "var(--gray-a3)",
              borderRadius: 8,
            }}
            className="animate-pulse"
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: 24,
                width: 80,
                backgroundColor: "var(--gray-a3)",
                borderRadius: 6,
              }}
              className="animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Floor plan skeleton */}
      <div
        style={{
          flex: 1,
          minHeight: 500,
          backgroundColor: "var(--gray-a2)",
          borderRadius: 12,
          border: "1px solid var(--gray-a5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Toolbar skeleton */}
        <div
          style={{
            height: 56,
            borderBottom: "1px solid var(--gray-a5)",
            backgroundColor: "var(--gray-a2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          <div
            style={{
              height: 24,
              width: 120,
              backgroundColor: "var(--gray-a4)",
              borderRadius: 6,
            }}
            className="animate-pulse"
          />
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                height: 32,
                width: 100,
                backgroundColor: "var(--gray-a3)",
                borderRadius: 8,
              }}
              className="animate-pulse"
            />
            <div
              style={{
                height: 32,
                width: 120,
                backgroundColor: "var(--gray-a3)",
                borderRadius: 8,
              }}
              className="animate-pulse"
            />
          </div>
        </div>

        {/* Canvas skeleton with fake tables */}
        <div
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: "var(--gray-2)",
            backgroundImage:
              "linear-gradient(to right, var(--gray-a3) 1px, transparent 1px), linear-gradient(to bottom, var(--gray-a3) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            opacity: 0.5,
          }}
        >
          {/* Fake tables */}
          {[
            { x: 60, y: 50, size: 70 },
            { x: 180, y: 80, size: 80 },
            { x: 320, y: 60, size: 70 },
            { x: 100, y: 200, size: 90 },
            { x: 260, y: 220, size: 70 },
            { x: 420, y: 180, size: 80 },
          ].map((table, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: table.x,
                top: table.y,
                width: table.size,
                height: table.size,
                backgroundColor: "var(--gray-a4)",
                borderRadius: i % 2 === 0 ? "50%" : 8,
                border: "2px solid var(--gray-a5)",
              }}
              className="animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

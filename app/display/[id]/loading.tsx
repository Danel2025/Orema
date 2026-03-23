export default function DisplayLoading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        height: "100vh",
        width: "100vw",
        backgroundColor: "#111",
        color: "#888",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid #333",
          borderTopColor: "#e5771e",
          borderRadius: "50%",
          animation: "display-spinner 0.8s linear infinite",
        }}
      />
      <p style={{ fontSize: 16, margin: 0 }}>Chargement de l'ecran...</p>
      <style>{`
        @keyframes display-spinner {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

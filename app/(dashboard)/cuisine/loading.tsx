export default function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "4px solid var(--gray-a4)",
            borderTopColor: "var(--accent-9)",
            borderRadius: "50%",
            animation: "kds-spin 0.8s linear infinite",
            margin: "0 auto",
          }}
        />
        <p style={{ color: "var(--gray-11)", marginTop: 16, fontSize: 14 }}>Chargement...</p>
        <style>{`
          @keyframes kds-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

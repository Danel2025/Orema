export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <style>{`
        :root {
          --auth-panel-bg: #ffffff;
        }
        .dark {
          --auth-panel-bg: #0a0a0a;
        }
      `}</style>
      {children}
    </div>
  );
}

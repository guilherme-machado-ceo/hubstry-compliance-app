export function DevBanner() {
  if (!import.meta.env.DEV || import.meta.env.VITE_BYPASS_AUTH !== "true") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-yellow-900 text-xs font-mono text-center py-1 px-4">
      ⚠️ MODO DEV — Auth bypassed · dev@hubstry.local · Plano Pro ·{" "}
      <span className="opacity-70">BYPASS_AUTH=true</span>
    </div>
  );
}

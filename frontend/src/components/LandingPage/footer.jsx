function Footer() {
  return <>
      <style>{`
        .vx-footer { padding: 38px 60px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        @media (max-width: 1023px) { .vx-footer { padding: 32px 40px; } }
        @media (max-width: 639px)  {
          .vx-footer { flex-direction: column; align-items: center; text-align: center; padding: 32px 20px; gap: 20px; }
          .vx-footer-links { justify-content: center; flex-wrap: wrap; gap: 16px !important; }
        }
      `}</style>
      <footer className="vx-footer" style={{ background: "#0a0a14", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <a href="/" style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fff", textDecoration: "none", letterSpacing: "-.02em", fontFamily: "Sora,sans-serif" }}>Mitchells</a>
        <ul className="vx-footer-links" style={{ display: "flex", gap: "24px", listStyle: "none", margin: 0, padding: 0 }}>
          {[
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "support@Mitchells.ai", href: "mailto:support@Mitchells.ai" }
  ].map((l) => <li key={l.label}>
              <a
    href={l.href}
    style={{ color: "rgba(255,255,255,.28)", textDecoration: "none", fontSize: "1.01rem", transition: "color .2s", fontFamily: "Sora,sans-serif" }}
    onMouseOver={(e) => e.currentTarget.style.color = "rgba(255,255,255,.65)"}
    onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,.28)"}
  >
                {l.label}
              </a>
            </li>)}
        </ul>
        <div style={{ fontSize: ".82rem", color: "rgba(255,255,255,.2)", fontFamily: "Sora,sans-serif" }}>© 2026 Mitchells AI Inc.</div>
      </footer>
    </>;
}
export {
  Footer as default
};

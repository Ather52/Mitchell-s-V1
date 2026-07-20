function CTASection() {
  return <>
      <style>{`
        @media (max-width: 1023px) { .cta-section { padding: 80px 40px !important; } }
        @media (max-width: 639px)  {
          .cta-section { padding: 60px 20px !important; }
          .cta-bullets { flex-direction: column; align-items: flex-start; gap: 10px !important; padding: 0 4px; }
          .cta-btns { flex-direction: column; align-items: stretch; }
          .cta-btns a, .cta-btns button { width: 100%; justify-content: center; }
        }
      `}</style>
      <section id="demo" className="cta-section" style={{ background: "linear-gradient(135deg,#0F0F1A 0%,#1a1a3a 100%)", padding: "100px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        
        <div style={{ position: "absolute", width: "700px", height: "700px", background: "radial-gradient(circle,rgba(42,91,168,.15) 0%,transparent 65%)", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(42,91,168,.15) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", opacity: 0.5 }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(29,184,122,.1)", border: "1px solid rgba(29,184,122,.2)", color: "#1DB87A", fontSize: ".82rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "6px 16px", borderRadius: "100px", marginBottom: "26px", fontFamily: "Sora,sans-serif" }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            Zero Risk — Try It Free
          </div>

          <h2 style={{ fontFamily: "Sora,sans-serif", fontSize: "clamp(2rem,5.6vw,4.4rem)", fontWeight: 800, color: "#fff", lineHeight: 1.08, letterSpacing: "-.03em", marginBottom: "18px" }}>
            Try Mitchells free.<br />Pay only <em style={{ fontFamily: "Lora,serif", fontStyle: "italic", fontWeight: 600, color: "#2A5BA8" }}>if you love it.</em>
          </h2>

          <p style={{ fontFamily: "Sora,sans-serif", fontSize: "1.11rem", color: "rgba(255,255,255,.48)", lineHeight: 1.75, marginBottom: "40px", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
            See exactly how many calls and orders Mitchells captures for your business. No credit card. No commitment. If it does not make you money — you owe us nothing.
          </p>

          <div className="cta-bullets" style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "40px" }}>
            {["Free trial \u2014 no card needed", "Live in under 10 minutes", "Cancel anytime, instantly", "Zero missed orders from day one"].map((f, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "1.05rem", color: "rgba(255,255,255,.65)", fontWeight: 500, fontFamily: "Sora,sans-serif" }}>
                <svg width="15" height="15" fill="none" stroke="#1DB87A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                {f}
              </div>)}
          </div>

          <div className="cta-btns" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="mailto:hello@Mitchells.ai" style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#1DB87A", color: "#fff", padding: "16px 36px", borderRadius: "10px", fontWeight: 700, fontSize: "1.11rem", textDecoration: "none", boxShadow: "0 8px 30px rgba(29,184,122,.3)", transition: "all .25s", fontFamily: "Sora,sans-serif" }}>
              Request Your Free Demo
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
            <button
    onClick={() => document.getElementById("why-Mitchells")?.scrollIntoView({ behavior: "smooth" })}
    style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "transparent", color: "rgba(255,255,255,.48)", padding: "16px 30px", borderRadius: "10px", fontWeight: 600, fontSize: "1.05rem", border: "1.5px solid rgba(255,255,255,.1)", cursor: "pointer", transition: "all .25s", fontFamily: "Sora,sans-serif" }}
    onMouseOver={(e) => {
      e.currentTarget.style.borderColor = "rgba(255,255,255,.3)";
      e.currentTarget.style.color = "#fff";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.borderColor = "rgba(255,255,255,.1)";
      e.currentTarget.style.color = "rgba(255,255,255,.48)";
    }}
  >
              See How It Works
            </button>
          </div>

          <p style={{ fontFamily: "Sora,sans-serif", fontSize: ".84rem", color: "rgba(255,255,255,.22)", marginTop: "22px" }}>
            Only subscribe if you see the value. Most businesses do on day one.
          </p>
        </div>
      </section>
    </>;
}
export {
  CTASection as default
};

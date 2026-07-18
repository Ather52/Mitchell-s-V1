import { useEffect, useRef } from "react";
const STATS = [
  { num: "$0", title: "Missed orders cost you nothing now", body: "Every call answered, every order captured. Mitchells recovers the revenue you never knew you were losing \u2014 especially during Friday night rush when every missed call is a lost ticket." },
  { num: "99%", title: "Order accuracy. Feels completely human.", body: "Your customers have no idea they're talking to AI. Natural voice, instant responses, real interruption handling \u2014 every order confirmed clearly before it hits the kitchen." },
  { num: "\u221E", title: "Calls at once. Zero wait time.", body: "Five people call at the same time during lunch rush? Mitchells answers all five instantly. No hold music. No frustrated customers. No lost orders." }
];
function InfinityIcon() {
  return <svg viewBox="0 0 120 60" style={{ width: "88px", height: "44px", display: "block" }} aria-hidden="true">
      <defs>
        <linearGradient id="inf-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2A5BA8" />
          <stop offset="100%" stopColor="#1B3F7A" />
        </linearGradient>
      </defs>
      <path
    d="M60,30 C56,14 44,7 30,7 C14,7 7,17 7,30 C7,43 14,53 30,53 C44,53 56,46 60,30 C64,14 76,7 90,7 C106,7 113,17 113,30 C113,43 106,53 90,53 C76,53 64,46 60,30Z"
    fill="none"
    stroke="url(#inf-g)"
    strokeWidth="9"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
    </svg>;
}
function PhoneMockup() {
  const chipStyle = (_dot, delay, dur) => ({
    display: "flex",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #EAEAF2",
    borderRadius: "10px",
    padding: "9px 14px",
    boxShadow: "0 4px 20px rgba(15,15,26,.08)",
    fontSize: ".82rem",
    fontWeight: 600,
    color: "#0F0F1A",
    whiteSpace: "nowrap",
    fontFamily: "Sora,sans-serif",
    animation: `chipfloat ${dur} ease-in-out infinite`,
    animationDelay: delay
  });
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>

      
      <div className="wv-phone-shell" style={{ width: "380px", background: "#0F0F1A", borderRadius: "44px", padding: "30px", boxShadow: "0 60px 120px rgba(15,15,26,.25),0 0 0 1px rgba(255,255,255,.04)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "200px", height: "200px", background: "radial-gradient(circle,rgba(42,91,168,.2) 0%,transparent 70%)", top: "-60px", right: "-60px", pointerEvents: "none" }} />
        <div style={{ width: "80px", height: "6px", background: "rgba(255,255,255,.12)", borderRadius: "3px", margin: "0 auto 20px" }} />
        <div style={{ fontSize: ".82rem", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", fontFamily: "Sora,sans-serif" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1DB87A", animation: "ldot2 1.5s ease-in-out infinite" }} />
          Mitchells Agent — Live Call
        </div>

        
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", padding: "11px 13px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "14px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#2A5BA8,#1B3F7A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".88rem", fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "Sora,sans-serif" }}>JW</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "rgba(255,255,255,.92)", fontFamily: "Sora,sans-serif" }}>James W.</div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
              <svg width="9" height="9" fill="#C8973A" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              <span style={{ fontSize: ".84rem", color: "rgba(255,255,255,.35)", fontFamily: "Sora,sans-serif" }}>VIP · Returning customer</span>
            </div>
          </div>
          <div style={{ fontSize: ".87rem", color: "#1DB87A", fontFamily: "Sora,sans-serif", fontWeight: 700, letterSpacing: ".04em", flexShrink: 0 }}>0:24</div>
        </div>

        
        <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "50px", marginBottom: "18px" }}>
          {[30, 16, 42, 22, 38, 10, 46, 26, 38, 14, 42, 18, 34, 12, 44, 24].map((h, i) => <div key={i} style={{ width: "4px", height: `${h}px`, borderRadius: "3px", background: i % 3 === 0 ? "#2A5BA8" : i % 3 === 1 ? "#9490E0" : "rgba(42,91,168,.38)", animation: `phwave ${[1.1, 1.3, 0.9, 1.2, 1.4, 1, 1.15, 1.35, 0.95, 1.25, 1.05, 1.3, 0.85, 1.2, 1.4, 1.1][i]}s ease-in-out infinite`, animationDelay: `${[0, 0.12, 0.24, 0.06, 0.36, 0.18, 0.08, 0.3, 0.22, 0.14, 0.04, 0.28, 0.16, 0.34, 0.1, 0.26][i]}s`, transformOrigin: "center" }} />)}
        </div>

        
        {[
    { cls: "a", text: "Welcome back, James! The usual tonight?" },
    { cls: "c", text: "Yes \u2014 number eight, hot, for pickup." },
    { cls: "a", text: "Got it \u2014 #8, hot spice, pickup. Ready in 15 min!" },
    { cls: "c", text: "Perfect, thanks!" }
  ].map((b, i) => <div key={i} style={{ padding: "12px 16px", borderRadius: b.cls === "a" ? "18px 18px 18px 4px" : "18px 18px 4px 18px", fontFamily: "Sora,sans-serif", fontSize: ".99rem", lineHeight: 1.6, marginBottom: "9px", animation: "bub .4s ease both", animationDelay: `${[1, 1.8, 2.6, 3.4][i]}s`, animationFillMode: "both", opacity: 0, ...b.cls === "a" ? { background: "rgba(42,91,168,.18)", border: "1px solid rgba(42,91,168,.25)", color: "rgba(255,255,255,.9)", maxWidth: "90%" } : { background: "linear-gradient(135deg,#2A5BA8,#1B3F7A)", color: "#fff", maxWidth: "80%", marginLeft: "auto" } }}>
            {b.text}
          </div>)}

        
        <div style={{ marginTop: "14px", padding: "13px 15px", background: "rgba(29,184,122,.12)", border: "1px solid rgba(29,184,122,.25)", borderRadius: "14px", fontFamily: "Sora,sans-serif", fontSize: "1.05rem", color: "rgba(255,255,255,.7)", lineHeight: 1.6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
            <svg width="11" height="11" fill="#1DB87A" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            <strong style={{ color: "#1DB87A", fontSize: ".88rem", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 700 }}>SMS Confirmation Sent</strong>
          </div>
          "Your order is confirmed at Hot Chickz! Ready for pickup in ~15 min. See you soon!"
        </div>
      </div>

      
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <div style={chipStyle("#1DB87A", "0s", "3.5s")}>
          <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#1DB87A", marginRight: "6px", flexShrink: 0 }} />
          Order sent to kitchen
        </div>
        <div style={chipStyle("#2A5BA8", "-1.5s", "4s")}>
          <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#2A5BA8", marginRight: "6px", flexShrink: 0 }} />
          Caller recognized — James W.
        </div>
        <div style={chipStyle("#C8973A", "-2.5s", "3.8s")}>
          <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#C8973A", marginRight: "6px", flexShrink: 0 }} />
          SMS confirmation sent
        </div>
      </div>
    </div>;
}
function WhyMitchellsSection() {
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("sr-up");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    ref.current?.querySelectorAll(".sr-el").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return <>
      <style>{`
        @keyframes chipfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes ldot2{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(29,184,122,.4)}50%{opacity:.7;box-shadow:0 0 0 5px rgba(29,184,122,0)}}
        @keyframes phwave{0%,100%{transform:scaleY(.1);opacity:.25}50%{transform:scaleY(1);opacity:1}}
        @keyframes bub{from{opacity:0;transform:scale(.9) translateY(4px)}to{opacity:1;transform:none}}
        .sr-el{opacity:0;transform:translateY(40px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}
        .sr-el.sr-up{opacity:1;transform:none}
        .ws-item{padding:28px 0;border-bottom:1px solid #EAEAF2;display:flex;align-items:flex-start;gap:22px;}
        .ws-item:first-child{padding-top:0;}.ws-item:last-child{border-bottom:none;}
        .ws-num{font-size:4.8rem;font-weight:900;letter-spacing:-.05em;line-height:1;width:160px;flex-shrink:0;color:#1B3F7A;}

        @media (max-width: 1023px) {
          .why-section { padding: 80px 40px !important; }
          .ws-num { font-size: 3.8rem; width: 120px; }
          .wv-phone-shell { width: 100% !important; max-width: 420px; margin: 0 auto; }
        }
        @media (max-width: 639px) {
          .why-section { padding: 60px 20px !important; }
          .ws-num { font-size: 2.6rem; width: 80px; }
          .ws-item { gap: 12px; padding: 18px 0; }
          .wv-phone-shell { border-radius: 28px !important; padding: 20px !important; }
          /* Stack caller card name + time so they don't overflow */
          .wv-caller-row { flex-wrap: wrap; }
        }
      `}</style>

      <div style={{ width: "1px", height: "60px", background: "linear-gradient(to bottom,transparent,#EAEAF2,transparent)", margin: "0 auto" }} />

      <section id="why-Mitchells" className="why-section" style={{ padding: "120px 60px", background: "#fff" }} ref={ref}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <div className="why-grid">
            <div>
              <div className="sr-el" style={{ fontSize: ".79rem", fontWeight: 700, letterSpacing: ".13em", textTransform: "uppercase", color: "#2A5BA8", marginBottom: "14px", fontFamily: "Sora,sans-serif" }}>Why Mitchells</div>
              <h2 className="sr-el" style={{ fontFamily: "Sora,sans-serif", fontSize: "clamp(2.5rem,4.4vw,4rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-.03em", color: "#0F0F1A", marginBottom: "40px" }}>
                Your phone is costing<br />you <em style={{ fontFamily: "Lora,serif", fontStyle: "italic", fontWeight: 600 }}>real money.</em>
              </h2>
              <div>
                {STATS.map((s, i) => <div key={i} className="sr-el ws-item">
                    <div className="ws-num">{s.num === "\u221E" ? <InfinityIcon /> : s.num}</div>
                    <div>
                      <h4 style={{ fontFamily: "Sora,sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#0F0F1A", marginBottom: "5px", marginTop: "7px" }}>{s.title}</h4>
                      <p style={{ fontFamily: "Sora,sans-serif", fontSize: "1.11rem", color: "#525270", lineHeight: 1.65, margin: 0 }}>{s.body}</p>
                    </div>
                  </div>)}
              </div>
            </div>
            <div className="sr-el">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>
    </>;
}
export {
  WhyMitchellsSection as default
};

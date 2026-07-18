import { useEffect, useState } from "react";
const ROWS = [
  { name: "James W.", vip: true, note: "Fully Loaded Bowl \xB7 Hot Spice \xB7 Fountain Drink", badge: "Pickup", badgeCls: "pk", amt: "$14.98", delay: 1500 },
  { name: "Maria L.", vip: false, note: "10 Tender Pack \xB7 Mild \xB7 Cheesy Fries", badge: "Delivery", badgeCls: "dl", amt: "$31.98", delay: 2100 },
  { name: "Table for 4 \u2014 Amir K.", vip: false, note: "Reservation \xB7 Friday 7:30pm \xB7 SMS Confirmed", badge: "Reservation", badgeCls: "ri", amt: "Booked", delay: 2700 }
];
function DashboardCard() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    ROWS.forEach((r, i) => setTimeout(() => setRows((p) => [...p, i]), r.delay));
  }, []);
  return <div className="h-dash-card">
      
      <div className="h-dash-header">
        <div className="h-dash-title">Hot Chickz — Live Dashboard</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: ".79rem", fontWeight: 600, color: "#1DB87A", background: "rgba(29,184,122,.08)", padding: "4px 10px", borderRadius: "100px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1DB87A", display: "inline-block", animation: "ldot 1.5s ease-in-out infinite" }} />
          Agent Active
        </div>
      </div>

      
      <div className="h-dash-metrics">
        {[
    { v: "$0", cls: "ap", label: "Missed Revenue" },
    { v: "47", cls: "ag", label: "Orders Today" },
    { v: "0", cls: "", label: "Missed Calls" },
    { v: "24/7", cls: "", label: "Always On" }
  ].map((m, i) => <div key={i} style={{ background: "#F8F8FC", borderRadius: "14px", padding: "22px 18px", border: "1px solid #EAEAF2" }}>
            <div style={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1, letterSpacing: "-.03em", color: m.cls === "ap" ? "#2A5BA8" : m.cls === "ag" ? "#1DB87A" : "#0F0F1A" }}>{m.v}</div>
            <div style={{ fontFamily: "Sora,sans-serif", fontSize: ".77rem", color: "#8888A8", marginTop: "6px", fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase" }}>{m.label}</div>
          </div>)}
      </div>

      
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {ROWS.map(
    (row, i) => rows.includes(i) ? <div key={i} className="h-dash-row">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "Sora,sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "#0F0F1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.name}
                  {row.vip && <span style={{ fontSize: ".84rem", color: "#C8973A", fontWeight: 700, marginLeft: "6px" }}>★ VIP</span>}
                </div>
                <div style={{ fontFamily: "Sora,sans-serif", fontSize: ".99rem", color: "#8888A8", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.note}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                <span style={{ fontSize: ".79rem", fontWeight: 700, padding: "4px 11px", borderRadius: "100px", letterSpacing: ".04em", ...row.badgeCls === "pk" ? { background: "rgba(42,91,168,.1)", color: "#1B3F7A" } : row.badgeCls === "dl" ? { background: "rgba(200,151,58,.1)", color: "#C8973A" } : { background: "rgba(29,184,122,.1)", color: "#0a8a55" } }}>
                  {row.badge}
                </span>
                <span style={{ fontFamily: "Sora,sans-serif", fontSize: "1.09rem", fontWeight: 700, color: "#0F0F1A" }}>{row.amt}</span>
              </div>
            </div> : null
  )}
      </div>
    </div>;
}
function HeroSection() {
  return <>
      <style>{`
        @keyframes ldot{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(29,184,122,.4)}50%{opacity:.7;box-shadow:0 0 0 5px rgba(29,184,122,0)}}
        @keyframes hfade{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
        @keyframes rowin{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
        @keyframes chipfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .hv-chip{background:#fff;border-radius:12px;border:1px solid #EAEAF2;box-shadow:0 8px 30px rgba(15,15,26,.1);padding:11px 15px;font-size:1.01rem;font-weight:600;color:#0F0F1A;white-space:nowrap;animation:chipfloat 4s ease-in-out infinite;display:flex;align-items:center;gap:6px;}
        .hv-chip .ci{width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .hv-chip .ci.g{background:rgba(29,184,122,.1)}.hv-chip .ci.p{background:rgba(42,91,168,.1)}.hv-chip .ci.a{background:rgba(200,151,58,.1)}
        .h-tag{opacity:0;animation:hfade .8s .1s forwards;}
        .h1-anim{opacity:0;animation:hfade .9s .25s forwards;}
        .h-sub{opacity:0;animation:hfade .9s .4s forwards;}
        .h-cta{opacity:0;animation:hfade .9s .55s forwards;}
        .h-proof{opacity:0;animation:hfade .9s .7s forwards;}
        .h-visual{opacity:0;animation:hfade 1.2s .9s forwards;}
        .h-btn-p{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#2A5BA8,#1B3F7A);color:#fff;padding:15px 32px;border-radius:10px;font-weight:700;font-size:1.22rem;text-decoration:none;border:none;cursor:pointer;box-shadow:0 8px 32px rgba(42,91,168,.35);transition:all .25s;position:relative;overflow:hidden;font-family:Sora,sans-serif;}
        .h-btn-p:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(42,91,168,.45);}
        .h-btn-s{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#0F0F1A;padding:15px 32px;border-radius:10px;font-weight:600;font-size:1.22rem;text-decoration:none;border:1.5px solid #EAEAF2;cursor:pointer;transition:all .25s;font-family:Sora,sans-serif;}
        .h-btn-s:hover{border-color:#2A5BA8;color:#2A5BA8;transform:translateY(-2px);}
        .proof-item{display:flex;align-items:center;gap:7px;font-size:.9rem;color:#8888A8;font-weight:500;}
        .proof-sep{width:4px;height:4px;border-radius:50%;background:#EAEAF2;}

        /* Dashboard card */
        .h-dash-card {
          background:#fff;border-radius:24px;border:1px solid #EAEAF2;
          box-shadow:0 50px 140px rgba(15,15,26,.14),0 0 0 1px rgba(42,91,168,.07);
          padding:40px;text-align:left;
        }
        .h-dash-metrics {
          display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;
        }
        .h-dash-row {
          display:flex;align-items:center;justify-content:space-between;
          padding:14px 18px;background:#F8F8FC;border-radius:12px;
          border:1px solid #EAEAF2;animation:rowin .5s ease both;gap:10px;
        }
        .h-cta-wrap {
          display:flex;gap:14px;justify-content:center;flex-wrap:wrap;
        }

        /* Dashboard header row */
        .h-dash-header { display:flex;align-items:center;justify-content:space-between;padding-bottom:22px;border-bottom:1px solid #EAEAF2;margin-bottom:22px;gap:8px; }
        .h-dash-title { font-family:Sora,sans-serif;font-size:1.11rem;font-weight:700;color:#0F0F1A; }

        @media (max-width: 1023px) {
          .hero-section { padding: 120px 40px 80px !important; min-height:auto !important; }
          .h-dash-card { padding: 28px 24px; }
        }

        @media (max-width: 639px) {
          .hero-section { padding: 92px 20px 56px !important; min-height:auto !important; overflow:hidden; }

          /* Headline \u2014 remove nowrap, shrink font */
          .h1-anim { font-size: clamp(1.9rem, 8.5vw, 2.4rem) !important; letter-spacing: -.025em !important; }
          .h1-anim span, .h1-anim em { white-space: normal !important; }

          /* Badge pill \u2014 allow wrapping, shrink text */
          .h-tag {
            font-size: .68rem !important; letter-spacing: .04em !important;
            padding: 5px 14px !important; border-radius: 12px !important;
            white-space: normal; text-align: center; line-height: 1.5;
            max-width: 88vw;
          }

          /* Dashboard card */
          .h-dash-metrics { grid-template-columns: repeat(2,1fr); gap:10px; }
          .h-dash-card { padding: 18px 14px; border-radius: 16px; }
          .h-dash-header { flex-wrap:wrap; padding-bottom:12px !important; margin-bottom:12px !important; }
          .h-dash-title { font-size:.88rem !important; }
          .h-dash-row { padding: 10px 12px; }

          /* CTAs */
          .h-btn-p, .h-btn-s { width:100%; justify-content:center; font-size:1rem; padding:14px 20px; }
          .h-cta-wrap { flex-direction:column; align-items:stretch; }

          /* Proof + chips */
          .proof-sep { display:none; }
          .proof-item { font-size:.84rem; }
          .hv-chip { font-size:.88rem; padding:8px 12px; }
          .h-visual { margin-top:44px !important; }
          .h-proof { margin-top:36px !important; }
        }
      `}</style>

      <section className="hero-section" style={{ minHeight: "110vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "150px 60px 120px", position: "relative", overflow: "visible" }}>
        
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(42,91,168,.12) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 80% 80%,rgba(200,151,58,.06) 0%,transparent 50%),radial-gradient(ellipse 40% 30% at 10% 70%,rgba(42,91,168,.06) 0%,transparent 50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(42,91,168,.12) 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none", opacity: 0.6 }} />

        
        <div className="h-tag" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#F0EFFC", border: "1px solid rgba(42,91,168,.2)", color: "#1B3F7A", fontSize: ".84rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "6px 16px", borderRadius: "100px", marginBottom: "32px", fontFamily: "Sora,sans-serif" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#1DB87A", animation: "ldot 2s ease-in-out infinite", flexShrink: 0 }} />
          Zero Missed Orders = Zero Missed Revenue.
        </div>

        
        <h1 className="h1-anim" style={{ fontFamily: "Sora,sans-serif", fontSize: "clamp(2.6rem,6.2vw,7rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-.04em", color: "#0F0F1A", marginBottom: "10px", maxWidth: "1080px" }}>
          <span style={{ whiteSpace: "nowrap" }}>Your Business Phone,</span><br />
          <span style={{ background: "linear-gradient(135deg,#2A5BA8,#1B3F7A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", whiteSpace: "nowrap" }}>Answered by AI.</span><br />
          <em style={{ fontFamily: "Lora,Georgia,serif", fontStyle: "italic", fontWeight: 600, whiteSpace: "nowrap" }}>Every Single Time.</em>
        </h1>

        
        <p className="h-sub" style={{ fontFamily: "Sora,sans-serif", fontSize: "clamp(1rem,1.5vw,1.22rem)", color: "#525270", maxWidth: "520px", lineHeight: 1.75, margin: "20px auto 44px" }}>
          Mitchells picks up every call, captures order details, manages bookings, sends SMS confirmations, and syncs to your system — so your team stays focused on production.
        </p>

        
        <div className="h-cta h-cta-wrap">
          <button className="h-btn-p" onClick={() => navigate_to("/signin")}>
            Request a Free Demo
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
          <button className="h-btn-s" onClick={() => document.getElementById("why-Mitchells")?.scrollIntoView({ behavior: "smooth" })}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M10 8l6 4-6 4V8z" /></svg>
            See How It Works
          </button>
        </div>

        
        <div className="h-proof" style={{ marginTop: "56px", display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          {[
    "Try free \u2014 no credit card",
    "Live in minutes",
    "Cancel anytime",
    "99% order accuracy"
  ].map((text, i) => <span key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="proof-item">
                <svg viewBox="0 0 24 24" style={{ width: "14px", height: "14px", stroke: "#1DB87A", fill: "none", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }}><polyline points="20 6 9 17 4 12" /></svg>
                {text}
              </span>
              {i < 3 && <span className="proof-sep" />}
            </span>)}
        </div>

        
        <div className="h-visual" style={{ position: "relative", zIndex: 1, maxWidth: "1160px", width: "100%", margin: "90px auto 0" }}>
          <DashboardCard />
          
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "28px" }}>
            <div className="hv-chip" style={{ animationDelay: "0s" }}>
              <div className="ci g"><svg width="11" height="11" fill="none" stroke="#1DB87A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div>
              SMS sent to James W.
            </div>
            <div className="hv-chip" style={{ animationDelay: "-1.5s" }}>
              <div className="ci p"><svg width="11" height="11" fill="none" stroke="#2A5BA8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg></div>
              Call answered instantly
            </div>
            <div className="hv-chip" style={{ animationDelay: "-3s" }}>
              <div className="ci a"><svg width="11" height="11" fill="none" stroke="#C8973A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg></div>
              +$47 recovered
            </div>
          </div>
        </div>
      </section>
    </>;
}
function navigate_to(path) {
  window.location.href = path;
}
export {
  HeroSection as default
};

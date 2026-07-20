import { useEffect, useRef } from "react";
function FeaturesBentoSection() {
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
    ref.current?.querySelectorAll(".sr-b").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return <>
      <style>{`
        @keyframes mwa{0%,100%{height:4px;opacity:.3}50%{height:22px;opacity:1}}
        .sr-b{opacity:0;transform:translateY(40px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}
        .sr-b.sr-up{opacity:1;transform:none}
        .bcard-vx{background:#fff;border:1px solid #EAEAF2;border-radius:18px;padding:30px;transition:border-color .3s,transform .3s,box-shadow .3s;overflow:hidden;position:relative;}
        .bcard-vx:hover{border-color:rgba(42,91,168,.3);transform:translateY(-4px);box-shadow:0 20px 56px rgba(42,91,168,.08);}
        .bc-icon-vx{width:42px;height:42px;border-radius:12px;background:#F0EFFC;display:flex;align-items:center;justify-content:center;margin-bottom:16px;}
        .bc-tag-vx{font-size:.86rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#2A5BA8;margin-bottom:7px;font-family:Sora,sans-serif;}
        .bc-h-vx{font-size:1.14rem;font-weight:700;color:#0F0F1A;margin-bottom:7px;line-height:1.3;font-family:Sora,sans-serif;}
        .bc-p-vx{font-size:1.09rem;color:#525270;line-height:1.68;font-family:Sora,sans-serif;}
        .ch-chip-vx{display:inline-flex;align-items:center;background:#F0EFFC;border:1px solid rgba(42,91,168,.15);color:#1B3F7A;font-size:.82rem;font-weight:600;padding:4px 12px;border-radius:100px;font-family:Sora,sans-serif;}
        .pos-badge-vx{display:inline-flex;align-items:center;gap:5px;background:#F8F8FC;border:1px solid #EAEAF2;border-radius:7px;padding:5px 11px;font-size:.82rem;font-weight:600;color:#0F0F1A;font-family:Sora,sans-serif;}
        .cm-row-vx{display:flex;align-items:center;justify-content:space-between;padding:7px 11px;background:rgba(255,255,255,.04);border-radius:8px;border:1px solid rgba(255,255,255,.06);font-size:.98rem;font-family:Sora,sans-serif;}

        @media (max-width: 1023px) {
          .feat-section { padding: 80px 40px !important; }
          .bcard-vx { padding: 24px; }
        }
        @media (max-width: 639px) {
          .feat-section { padding: 60px 20px !important; }
          .bcard-vx { padding: 20px; border-radius: 14px; }
          .bc-p-vx { font-size: 1rem; }
        }
      `}</style>

      <section id="features" className="feat-section" style={{ background: "#F8F8FC", padding: "120px 60px" }} ref={ref}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <div className="sr-b" style={{ fontSize: ".79rem", fontWeight: 700, letterSpacing: ".13em", textTransform: "uppercase", color: "#2A5BA8", marginBottom: "14px", fontFamily: "Sora,sans-serif" }}>Everything You Need</div>
            <h2 className="sr-b" style={{ fontFamily: "Sora,sans-serif", fontSize: "clamp(2rem,4.4vw,4rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-.03em", color: "#0F0F1A", maxWidth: "580px", margin: "0 auto 12px" }}>
              One AI. Every order type.<br /><em style={{ fontFamily: "Lora,serif", fontStyle: "italic", fontWeight: 600 }}>Every customer, valued.</em>
            </h2>
            <p className="sr-b" style={{ fontFamily: "Sora,sans-serif", fontSize: "1.11rem", color: "#525270", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto" }}>
              From pickup to reservations, SMS confirmations to POS sync — Mitchells runs your front-of-house phone, end to end.
            </p>
          </div>

          
          <div className="bento-grid">

            
            <div className="bcard-vx sr-b bento-c7">
              <div className="bc-icon-vx">
                <svg viewBox="0 0 24 24" style={{ width: "21px", height: "21px", stroke: "#2A5BA8", fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div className="bc-tag-vx">Order Types</div>
              <h3 className="bc-h-vx">Every order type. One AI.</h3>
              <p className="bc-p-vx">Takeout, pickup, delivery, dine-in, reservations, and FAQ — handled in one natural conversation, every time.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginTop: "14px" }}>
                {["Pickup", "Takeout", "Delivery", "Dine-In", "Reservations", "FAQs"].map((c) => <span key={c} className="ch-chip-vx">{c}</span>)}
              </div>
            </div>

            
            <div className="bcard-vx sr-b bento-c5">
              <div className="bc-icon-vx">
                <svg viewBox="0 0 24 24" style={{ width: "21px", height: "21px", stroke: "#2A5BA8", fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                </svg>
              </div>
              <div className="bc-tag-vx">Voice AI</div>
              <h3 className="bc-h-vx">Sounds human.<br />No difference.</h3>
              <p className="bc-p-vx">Natural voice, instant responses, real interruption handling. 99% accuracy, every call.</p>
              <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "28px", marginTop: "14px" }}>
                {Array.from({ length: 10 }, (_, i) => <div key={i} style={{ width: "3px", borderRadius: "2px", background: i % 2 === 0 ? "#2A5BA8" : "rgba(42,91,168,.3)", animation: `mwa 1.2s ease-in-out infinite`, animationDelay: `${[0, 0.1, 0.2, 0.1, 0, 0.1, 0.2, 0.3, 0.2, 0.1][i]}s` }} />)}
              </div>
            </div>

            
            <div className="bcard-vx sr-b bento-c12" style={{ background: "linear-gradient(135deg,#0F0F1A 0%,#1a1a3a 100%)", border: "1px solid rgba(42,91,168,.2)" }}>
              <div className="bento-2col">
                <div>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(42,91,168,.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <svg viewBox="0 0 24 24" style={{ width: "21px", height: "21px", stroke: "#fff", fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                  </div>
                  <div style={{ fontSize: ".86rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(42,91,168,.65)", marginBottom: "7px", fontFamily: "Sora,sans-serif" }}>Customer Intelligence</div>
                  <h3 style={{ fontFamily: "Sora,sans-serif", fontSize: "1.14rem", fontWeight: 700, color: "#fff", marginBottom: "7px", lineHeight: 1.3 }}>Knows your customers.<br />Makes them feel it.</h3>
                  <p style={{ fontFamily: "Sora,sans-serif", fontSize: "1.09rem", color: "rgba(255,255,255,.42)", lineHeight: 1.68, margin: 0 }}>Recognizes every caller by number, greets them by name, and tracks who orders the most. Your regulars feel like VIPs — automatically.</p>
                </div>
                <div>
                  <div style={{ fontSize: ".86rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: "8px", fontFamily: "Sora,sans-serif" }}>Top Customers This Week</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                    {[
    { name: "James W.", orders: "14 orders", vip: true },
    { name: "Maria L.", orders: "9 orders", vip: true },
    { name: "Amir K.", orders: "7 orders", vip: false },
    { name: "Sofia R.", orders: "5 orders", vip: false }
  ].map((c, i) => <div key={i} className="cm-row-vx">
                        <div style={{ fontWeight: 600, color: "#fff" }}>{c.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                          <span style={{ color: "#2A5BA8", fontWeight: 700, fontSize: ".82rem" }}>{c.orders}</span>
                          {c.vip && <span style={{ fontSize: ".79rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#C8973A", background: "rgba(200,151,58,.12)", padding: "2px 7px", borderRadius: "100px" }}>VIP</span>}
                        </div>
                      </div>)}
                  </div>
                </div>
              </div>
            </div>

            
            <div className="bcard-vx sr-b bento-c8">
              <div className="bc-icon-vx">
                <svg viewBox="0 0 24 24" style={{ width: "21px", height: "21px", stroke: "#2A5BA8", fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              </div>
              <div className="bc-tag-vx">Instant SMS</div>
              <h3 className="bc-h-vx">Sends SMS confirmations automatically.</h3>
              <p className="bc-p-vx">Every order and reservation triggers an instant SMS to the customer. Order details, pickup time, reservation confirmation — all sent without any staff involvement.</p>
              <div style={{ marginTop: "16px", background: "#F8F8FC", border: "1px solid #EAEAF2", borderRadius: "10px", padding: "13px 15px", fontSize: "1.01rem", color: "#525270", lineHeight: 1.6, fontFamily: "Sora,sans-serif" }}>
                <span style={{ fontSize: ".86rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#1DB87A", display: "block", marginBottom: "4px" }}>SMS Delivered</span>
                "Hi James! Your order at Hot Chickz is confirmed. Ready for pickup in ~15 min. See you soon!"
              </div>
            </div>

            
            <div className="bcard-vx sr-b bento-c4">
              <div className="bc-icon-vx">
                <svg viewBox="0 0 24 24" style={{ width: "21px", height: "21px", stroke: "#2A5BA8", fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
              </div>
              <div className="bc-tag-vx">POS Sync</div>
              <h3 className="bc-h-vx">Syncs to your POS instantly.</h3>
              <p className="bc-p-vx">Orders go from call to kitchen ticket automatically. No manual entry, no relay, no errors.</p>
              <div style={{ display: "flex", gap: "8px", marginTop: "15px", flexWrap: "wrap" }}>
                {[["Toast", "#1DB87A"], ["Clover", "#1DB87A"], ["Square", "#1DB87A"], ["More +", "#C8973A"]].map(([name, dot]) => <span key={name} className="pos-badge-vx">
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: dot }} />
                    {name}
                  </span>)}
              </div>
            </div>

            
            <div className="bcard-vx sr-b bento-c4" style={{ background: "#0F0F1A", border: "1px solid #0F0F1A" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(42,91,168,.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <svg viewBox="0 0 24 24" style={{ width: "21px", height: "21px", stroke: "#fff", fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
              <div style={{ fontSize: ".86rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(42,91,168,.65)", marginBottom: "7px", fontFamily: "Sora,sans-serif" }}>Revenue Protected</div>
              <div style={{ fontSize: "4.2rem", fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1, marginBottom: "7px", background: "linear-gradient(135deg,#2A5BA8,#1B3F7A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>$0</div>
              <h3 style={{ fontFamily: "Sora,sans-serif", fontSize: "1.14rem", fontWeight: 700, color: "#fff", marginBottom: "7px", lineHeight: 1.3 }}>Missed revenue.</h3>
              <p style={{ fontFamily: "Sora,sans-serif", fontSize: "1.09rem", color: "rgba(255,255,255,.42)", lineHeight: 1.68, margin: 0 }}>Every call answered. Every dollar recovered. Nothing falls through the cracks again.</p>
            </div>

            
            <div className="bcard-vx sr-b bento-c8" style={{ background: "linear-gradient(135deg,#F0EFFC 0%,#fff 60%)", border: "1px solid rgba(42,91,168,.15)" }}>
              <div className="bento-3col">
                {[
    { icon: "M19.07 4.93A10 10 0 105 19.07", tag: "Full Control", h: "Enable or disable anytime.", p: "One toggle from your dashboard. You're always in control \u2014 active or paused in seconds." },
    { icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2", tag: "Setup", h: "Live in minutes, not days.", p: "Add your menu, greetings, and hours in under 10 minutes. We handle the technical setup." },
    { icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z", tag: "Labor", h: "Less labor. More kitchen focus.", p: "Your staff stops answering phones entirely. They cook, they serve \u2014 Mitchells handles the calls." }
  ].map((c, i) => <div key={i}>
                    <div className="bc-icon-vx">
                      <svg viewBox="0 0 24 24" style={{ width: "21px", height: "21px", stroke: "#2A5BA8", fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}><path d={c.icon} /></svg>
                    </div>
                    <div className="bc-tag-vx">{c.tag}</div>
                    <h3 className="bc-h-vx">{c.h}</h3>
                    <p className="bc-p-vx">{c.p}</p>
                  </div>)}
              </div>
            </div>

          </div>
        </div>
      </section>
    </>;
}
export {
  FeaturesBentoSection as default
};

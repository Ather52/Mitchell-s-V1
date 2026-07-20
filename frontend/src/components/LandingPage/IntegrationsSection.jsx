import { useState } from "react";
function ToastLogo() {
  return <svg viewBox="0 0 44 44" style={{ width: 70, height: 70 }}>
      <rect width="44" height="44" rx="10" fill="#FF6B2B" />
      <path d="M9 34L9 21Q9 8 22 8Q35 8 35 21L35 34Z" fill="white" opacity="0.95" />
      <rect x="7" y="30" width="30" height="5" rx="2.5" fill="#FF6B2B" />
    </svg>;
}
function SpotOnLogo() {
  return <svg viewBox="0 0 44 44" style={{ width: 70, height: 70 }}>
      <rect width="44" height="44" rx="10" fill="#E8302C" />
      <circle cx="22" cy="22" r="12" stroke="white" strokeWidth="3.5" fill="none" />
      <circle cx="22" cy="22" r="5" fill="white" />
    </svg>;
}
function OpenTableLogo() {
  return <svg viewBox="0 0 44 44" style={{ width: 70, height: 70 }}>
      <rect width="44" height="44" rx="10" fill="#DA3743" />
      <line x1="14" y1="10" x2="14" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M11 10L11 18Q11 21 14 21Q17 21 17 18L17 10" stroke="white" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <ellipse cx="30" cy="28" rx="8" ry="5.5" stroke="white" strokeWidth="2.5" fill="none" />
      <line x1="30" y1="10" x2="30" y2="23" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>;
}
function CloverLogo() {
  return <svg viewBox="0 0 44 44" style={{ width: 70, height: 70 }}>
      <rect width="44" height="44" rx="10" fill="#1E8A3C" />
      <circle cx="17" cy="17" r="7.5" fill="white" opacity="0.95" />
      <circle cx="27" cy="17" r="7.5" fill="white" opacity="0.95" />
      <circle cx="17" cy="27" r="7.5" fill="white" opacity="0.95" />
      <circle cx="27" cy="27" r="7.5" fill="white" opacity="0.95" />
      <rect x="16" y="16" width="12" height="12" fill="white" opacity="0.95" />
      <line x1="22" y1="32" x2="22" y2="38" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>;
}
function SquareLogo() {
  return <svg viewBox="0 0 44 44" style={{ width: 70, height: 70 }}>
      <rect width="44" height="44" rx="10" fill="#1A1A1A" />
      <rect x="9" y="9" width="26" height="26" rx="4" fill="white" />
    </svg>;
}
function NCRAlohaLogo() {
  return <svg viewBox="0 0 44 44" style={{ width: 70, height: 70 }}>
      <rect width="44" height="44" rx="10" fill="#005A9C" />
      <path d="M6 20Q11 12 16 20Q22 28 27 20Q32 12 38 20" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 28Q11 20 16 28Q22 36 27 28Q32 20 38 28" stroke="rgba(255,255,255,.45)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}
function OloLogo() {
  return <svg viewBox="0 0 44 44" style={{ width: 70, height: 70 }}>
      <rect width="44" height="44" rx="10" fill="#E85C2A" />
      <circle cx="11" cy="22" r="5.5" stroke="white" strokeWidth="3" fill="none" />
      <rect x="19" y="11" width="3.5" height="22" rx="1.75" fill="white" />
      <circle cx="33" cy="22" r="5.5" stroke="white" strokeWidth="3" fill="none" />
    </svg>;
}
function TouchBistroLogo() {
  return <svg viewBox="0 0 44 44" style={{ width: 70, height: 70 }}>
      <rect width="44" height="44" rx="10" fill="#E4382D" />
      <line x1="16" y1="9" x2="16" y2="35" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M13 9L13 18Q13 21 16 21Q19 21 19 18L19 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="28" y1="9" x2="28" y2="35" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 9Q35 14 35 22L28 24Z" fill="white" />
    </svg>;
}
function LightspeedLogo() {
  return <svg viewBox="0 0 44 44" style={{ width: 70, height: 70 }}>
      <rect width="44" height="44" rx="10" fill="#FF6B00" />
      <path d="M27 6L11 25H21L17 38L33 19H23Z" fill="white" />
    </svg>;
}
const POS_ITEMS = [
  { name: "Toast", tag: "Full menu sync", color: "#FF6B2B", Logo: ToastLogo },
  { name: "SpotOn", tag: "Table & delivery", color: "#E8302C", Logo: SpotOnLogo },
  { name: "OpenTable", tag: "Reservations", color: "#DA3743", Logo: OpenTableLogo },
  { name: "Clover", tag: "POS + payments", color: "#1E8A3C", Logo: CloverLogo },
  { name: "Square", tag: "Retail + food", color: "#1A1A1A", Logo: SquareLogo },
  { name: "NCR Aloha", tag: "Enterprise POS", color: "#005A9C", Logo: NCRAlohaLogo },
  { name: "Olo", tag: "Digital ordering", color: "#E85C2A", Logo: OloLogo },
  { name: "TouchBistro", tag: "Mitchell's POS", color: "#E4382D", Logo: TouchBistroLogo },
  { name: "Lightspeed", tag: "Cloud POS", color: "#FF6B00", Logo: LightspeedLogo }
];
function PosCard({ name, tag, color, Logo }) {
  const [hov, setHov] = useState(false);
  return <div
    className="pos-card-vx"
    onMouseEnter={() => setHov(true)}
    onMouseLeave={() => setHov(false)}
    style={{
      background: "#fff",
      border: `1.5px solid ${hov ? color : "#EAEAF2"}`,
      borderTop: `4px solid ${color}`,
      borderRadius: "20px",
      padding: "38px 28px 34px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "14px",
      textAlign: "center",
      cursor: "default",
      transition: "border-color .2s, box-shadow .2s",
      boxShadow: hov ? `0 20px 60px ${color}30, 0 4px 24px rgba(15,15,26,.06)` : "0 2px 16px rgba(15,15,26,.05)"
    }}
  >
      <div
    style={{
      width: "88px",
      height: "88px",
      borderRadius: "22px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      boxShadow: `0 0 0 8px ${color}14`,
      transition: "box-shadow .2s"
    }}
  >
        <Logo />
      </div>
      <div style={{ fontFamily: "Sora,sans-serif", fontSize: "1.16rem", fontWeight: 700, color: "#0F0F1A" }}>{name}</div>
      <div style={{ fontFamily: "Sora,sans-serif", fontSize: "1.01rem", color, fontWeight: 600, letterSpacing: ".02em" }}>{tag}</div>
      <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: ".88rem",
      fontWeight: 700,
      color: "#1DB87A",
      background: "rgba(29,184,122,.08)",
      border: "1px solid rgba(29,184,122,.2)",
      padding: "5px 13px",
      borderRadius: "100px",
      marginTop: "4px"
    }}
  >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1DB87A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        Works with Mitchells
      </div>
    </div>;
}
function IntegrationsSection() {
  return <>
      <style>{`
        @media (max-width: 1023px) { .integ-section { padding: 80px 40px !important; } }
        @media (max-width: 639px)  {
          .integ-section { padding: 60px 20px !important; }
          .integ-header { margin-bottom: 40px !important; }
          .pos-card-vx { padding: 24px 20px 20px !important; border-radius: 14px !important; gap: 10px !important; }
        }
      `}</style>
      <section id="integrations" className="integ-section" style={{ background: "#F8F8FC", padding: "120px 60px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div className="integ-header" style={{ textAlign: "center", marginBottom: "72px" }}>
            <div style={{ fontSize: ".79rem", fontWeight: 700, letterSpacing: ".13em", textTransform: "uppercase", color: "#2A5BA8", marginBottom: "14px", fontFamily: "Sora,sans-serif" }}>Integrations</div>
            <h2 style={{ fontFamily: "Sora,sans-serif", fontSize: "clamp(2rem,4.4vw,4rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-.03em", color: "#0F0F1A", maxWidth: "540px", margin: "0 auto 16px" }}>
              Works with every POS you already use
            </h2>
            <p style={{ fontFamily: "Sora,sans-serif", fontSize: "1.11rem", color: "#525270", lineHeight: 1.8, maxWidth: "460px", margin: "0 auto" }}>
              Plug Mitchells into your current system in minutes — no migration, no retraining.
            </p>
          </div>
          
          <div className="pos-grid">
            {POS_ITEMS.map((p) => <PosCard key={p.name} {...p} />)}
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "Sora,sans-serif", fontSize: "1.11rem", color: "#8888A8" }}>
              Don't see your POS?{" "}
              <a href="mailto:hello@Mitchells.ai" style={{ color: "#1B3F7A", fontWeight: 700, textDecoration: "none" }}>Contact us</a>
              {" "}— we integrate on request.
            </p>
          </div>
        </div>
      </section>
    </>;
}
export {
  IntegrationsSection as default
};

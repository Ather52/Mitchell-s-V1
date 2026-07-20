import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { MitchellsLogo } from "../MitchellsLogo";
const NToast = () => <svg viewBox="0 0 44 44" style={{ width: 28, height: 28 }}><rect width="44" height="44" rx="10" fill="#FF6B2B" /><path d="M9 34L9 21Q9 8 22 8Q35 8 35 21L35 34Z" fill="white" opacity="0.95" /><rect x="7" y="30" width="30" height="5" rx="2.5" fill="#FF6B2B" /></svg>;
const NSpotOn = () => <svg viewBox="0 0 44 44" style={{ width: 28, height: 28 }}><rect width="44" height="44" rx="10" fill="#E8302C" /><circle cx="22" cy="22" r="12" stroke="white" strokeWidth="3.5" fill="none" /><circle cx="22" cy="22" r="5" fill="white" /></svg>;
const NOpenTable = () => <svg viewBox="0 0 44 44" style={{ width: 28, height: 28 }}><rect width="44" height="44" rx="10" fill="#DA3743" /><line x1="14" y1="10" x2="14" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round" /><path d="M11 10L11 18Q11 21 14 21Q17 21 17 18L17 10" stroke="white" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" /><ellipse cx="30" cy="28" rx="8" ry="5.5" stroke="white" strokeWidth="2.5" fill="none" /><line x1="30" y1="10" x2="30" y2="23" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>;
const NClover = () => <svg viewBox="0 0 44 44" style={{ width: 28, height: 28 }}><rect width="44" height="44" rx="10" fill="#1E8A3C" /><circle cx="17" cy="17" r="7.5" fill="white" opacity="0.95" /><circle cx="27" cy="17" r="7.5" fill="white" opacity="0.95" /><circle cx="17" cy="27" r="7.5" fill="white" opacity="0.95" /><circle cx="27" cy="27" r="7.5" fill="white" opacity="0.95" /><rect x="16" y="16" width="12" height="12" fill="white" opacity="0.95" /><line x1="22" y1="32" x2="22" y2="38" stroke="white" strokeWidth="3" strokeLinecap="round" /></svg>;
const NOlo = () => <svg viewBox="0 0 44 44" style={{ width: 28, height: 28 }}><rect width="44" height="44" rx="10" fill="#E85C2A" /><circle cx="11" cy="22" r="5.5" stroke="white" strokeWidth="3" fill="none" /><rect x="19" y="11" width="3.5" height="22" rx="1.75" fill="white" /><circle cx="33" cy="22" r="5.5" stroke="white" strokeWidth="3" fill="none" /></svg>;
const NSquare = () => <svg viewBox="0 0 44 44" style={{ width: 28, height: 28 }}><rect width="44" height="44" rx="10" fill="#1A1A1A" /><rect x="9" y="9" width="26" height="26" rx="4" fill="white" /></svg>;
const NNCRAloha = () => <svg viewBox="0 0 44 44" style={{ width: 28, height: 28 }}><rect width="44" height="44" rx="10" fill="#005A9C" /><path d="M6 20Q11 12 16 20Q22 28 27 20Q32 12 38 20" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 28Q11 20 16 28Q22 36 27 28Q32 20 38 28" stroke="rgba(255,255,255,.45)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const NTouchBistro = () => <svg viewBox="0 0 44 44" style={{ width: 28, height: 28 }}><rect width="44" height="44" rx="10" fill="#E4382D" /><line x1="16" y1="9" x2="16" y2="35" stroke="white" strokeWidth="2.5" strokeLinecap="round" /><path d="M13 9L13 18Q13 21 16 21Q19 21 19 18L19 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /><line x1="28" y1="9" x2="28" y2="35" stroke="white" strokeWidth="2.5" strokeLinecap="round" /><path d="M28 9Q35 14 35 22L28 24Z" fill="white" /></svg>;
const NLightspeed = () => <svg viewBox="0 0 44 44" style={{ width: 28, height: 28 }}><rect width="44" height="44" rx="10" fill="#FF6B00" /><path d="M27 6L11 25H21L17 38L33 19H23Z" fill="white" /></svg>;
const NAV_POS_L = [
  { name: "Toast", Logo: NToast },
  { name: "SpotOn", Logo: NSpotOn },
  { name: "OpenTable", Logo: NOpenTable },
  { name: "Clover", Logo: NClover },
  { name: "Olo", Logo: NOlo }
];
const NAV_POS_R = [
  { name: "Square", Logo: NSquare },
  { name: "NCR Aloha", Logo: NNCRAloha },
  { name: "TouchBistro", Logo: NTouchBistro },
  { name: "Lightspeed", Logo: NLightspeed }
];
const resources = [
  { name: "Customer Stories", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>, desc: "See businesses winning with Mitchells", scrollId: "review" },
  { name: "Blog", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>, desc: "Tips, trends, and business tech insights" },
  { name: "ROI Calculator", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>, desc: "Calculate your revenue uplift" }
];
function Navbar() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrapRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const toggle = (menu) => setOpenDropdown((p) => p === menu ? null : menu);
  const initial = user?.email?.[0]?.toUpperCase() ?? "?";
  const scrollTo = (id) => {
    setOpenDropdown(null);
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
  return <div ref={wrapRef}>
      <style>{`
        #vx-nav {
          position:fixed;top:0;left:0;right:0;z-index:300;height:72px;
          display:grid;grid-template-columns:1fr auto 1fr;align-items:center;
          padding:0 60px;transition:all .45s cubic-bezier(.16,1,.3,1);
        }
        #vx-nav.solid {
          background:rgba(255,255,255,.96);backdrop-filter:blur(28px) saturate(1.4);
          border-bottom:1px solid #EAEAF2;box-shadow:0 4px 48px rgba(15,15,26,.08);
        }
        .vx-logo { display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none; }
        .vx-logo-name {
          font-size:1.38rem;font-weight:800;letter-spacing:-.03em;
          background:linear-gradient(135deg,#0F0F1A 30%,#1B3F7A 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .vx-nav-links { display:flex;gap:32px;list-style:none;margin:0;padding:0; }
        .vx-nav-link {
          font-size:.9rem;font-weight:500;color:#525270;background:none;border:none;
          cursor:pointer;display:flex;align-items:center;gap:4px;white-space:nowrap;
          padding:4px 0;font-family:'Sora',sans-serif;position:relative;
          transition:color .2s;
        }
        .vx-nav-link::after {
          content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;
          background:#2A5BA8;border-radius:2px;transition:width .22s cubic-bezier(.16,1,.3,1);
        }
        .vx-nav-link:hover,.vx-nav-link.active {color:#0F0F1A;}
        .vx-nav-link:hover::after,.vx-nav-link.active::after {width:100%;}
        .vx-btn-login {
          background:none;border:1.5px solid #EAEAF2;color:#525270;
          padding:7px 18px;border-radius:8px;font-size:.88rem;font-weight:600;
          cursor:pointer;font-family:'Sora',sans-serif;white-space:nowrap;
          transition:all .2s;
        }
        .vx-btn-login:hover{border-color:#2A5BA8;color:#1B3F7A;background:#F5F4FE;}
        .vx-btn-demo {
          background:linear-gradient(135deg,#1B3F7A 0%,#2A5BA8 100%);
          color:#fff;padding:9px 22px;border-radius:8px;
          font-size:.88rem;font-weight:600;border:none;cursor:pointer;
          transition:all .22s;font-family:'Sora',sans-serif;white-space:nowrap;
          box-shadow:0 2px 12px rgba(27,63,122,.25);
        }
        .vx-btn-demo:hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 8px 24px rgba(27,63,122,.38);}
        .vx-dropdown {
          position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);
          background:#fff;border:1px solid #EAEAF2;border-radius:14px;
          box-shadow:0 20px 60px rgba(15,15,26,.12);z-index:400;overflow:hidden;
          animation:vxdd .18s cubic-bezier(.16,1,.3,1);
        }
        @keyframes vxdd {
          from{opacity:0;transform:translateX(-50%) translateY(-8px)}
          to{opacity:1;transform:translateX(-50%) translateY(0)}
        }
        .vx-dd-header {
          padding:9px 16px;font-size:.62rem;font-weight:700;letter-spacing:.1em;
          text-transform:uppercase;color:#8888A8;border-bottom:1px solid #EAEAF2;
          background:#FAFAFA;
        }
        .vx-dd-row {
          display:flex;align-items:center;gap:10px;padding:9px 16px;
          font-size:.82rem;font-weight:500;color:#525270;cursor:pointer;
          transition:background .15s,color .15s;white-space:nowrap;
        }
        .vx-dd-row:hover{background:#F8F8FC;color:#0F0F1A;}
        .vx-pos-logo {
          width:30px;height:30px;border-radius:8px;display:flex;align-items:center;
          justify-content:center;flex-shrink:0;overflow:hidden;
        }
        .vx-res-icon {
          width:32px;height:32px;border-radius:8px;background:#F0EFFC;display:flex;
          align-items:center;justify-content:center;color:#2A5BA8;flex-shrink:0;
          transition:background .15s,color .15s;
        }
        .vx-dd-row:hover .vx-res-icon{background:#1B3F7A;color:#fff;}
        .vx-chevron { transition:transform .2s; }
        .vx-chevron.open { transform:rotate(180deg); }
        .vx-profile-btn {
          display:flex;align-items:center;gap:8px;
          background:rgba(42,91,168,.08);border:1.5px solid rgba(42,91,168,.2);
          border-radius:100px;padding:4px 14px 4px 4px;
          cursor:pointer;font-family:'Sora',sans-serif;
          transition:background .2s,border-color .2s,box-shadow .2s;
        }
        .vx-profile-btn:hover{
          background:rgba(42,91,168,.14);border-color:rgba(42,91,168,.42);
          box-shadow:0 0 0 3px rgba(42,91,168,.08);
        }
        .vx-av {
          width:28px;height:28px;border-radius:50%;
          background:linear-gradient(135deg,#1B3F7A,#2A5BA8);
          color:#fff;display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:800;flex-shrink:0;
        }
        .vx-av-lg {
          width:42px;height:42px;border-radius:50%;
          background:linear-gradient(135deg,#1B3F7A,#2A5BA8);
          color:#fff;display:flex;align-items:center;justify-content:center;
          font-size:16px;font-weight:800;flex-shrink:0;
          box-shadow:0 0 0 3px rgba(42,91,168,.25);
        }
        .vx-profile-dd-btn {
          width:100%;display:flex;align-items:center;gap:10px;
          padding:10px 16px;font-family:'Sora',sans-serif;font-size:.82rem;font-weight:600;
          background:none;border:none;cursor:pointer;text-align:left;
          transition:background .15s,color .15s;
          color:#525270;
        }
        .vx-profile-dd-btn:hover { background:#F8F8FC; color:#0F0F1A; }
        .vx-profile-dd-icon {
          width:30px;height:30px;border-radius:8px;display:flex;align-items:center;
          justify-content:center;flex-shrink:0;
          background:#F0EFFC;color:#2A5BA8;
          transition:background .15s,color .15s;
        }
        .vx-profile-dd-btn:hover .vx-profile-dd-icon { background:#1B3F7A;color:#fff; }
        @keyframes vxProfileIn {
          from{opacity:0;transform:translateY(-10px) scale(.97)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }

        .vx-nav-right { display:flex;align-items:center;gap:10px;justify-self:end; }

        .vx-hamburger {
          display:none;align-items:center;justify-content:center;
          background:none;border:1.5px solid #EAEAF2;border-radius:8px;
          padding:8px;cursor:pointer;color:#525270;
          transition:border-color .2s,color .2s,background .2s;
          justify-self:end;
        }
        .vx-hamburger:hover { border-color:#2A5BA8;color:#1B3F7A;background:#F5F4FE; }

        .vx-mobile-menu {
          display:none;
          position:fixed;top:72px;left:0;right:0;z-index:299;
          background:rgba(255,255,255,.98);backdrop-filter:blur(20px);
          border-top:1px solid #EAEAF2;
          padding:12px 20px 28px;
          flex-direction:column;gap:2px;
          box-shadow:0 16px 40px rgba(15,15,26,.12);
        }
        .vx-mobile-menu.open { display:flex;animation:vxMobIn .2s cubic-bezier(.16,1,.3,1); }
        @keyframes vxMobIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        .vx-mob-link {
          display:block;width:100%;padding:13px 16px;border-radius:10px;
          font-family:'Sora',sans-serif;font-size:.95rem;font-weight:600;
          color:#525270;background:none;border:none;cursor:pointer;
          text-align:left;transition:background .15s,color .15s;
        }
        .vx-mob-link:hover { background:#F8F8FC;color:#0F0F1A; }
        .vx-mob-divider { height:1px;background:#EAEAF2;margin:8px 0; }
        .vx-mob-cta { display:flex;flex-direction:column;gap:10px;padding-top:8px; }
        .vx-mob-cta .vx-btn-login,.vx-mob-cta .vx-btn-demo { width:100%;padding:12px;text-align:center;border-radius:10px;font-size:.92rem; }

        @media (max-width: 1023px) {
          #vx-nav { grid-template-columns:1fr auto;padding:0 24px; }
          .vx-nav-links { display:none; }
          .vx-nav-right { display:none; }
          .vx-hamburger { display:flex; }
        }
        @media (max-width: 639px) {
          #vx-nav { padding:0 16px; }
          .vx-logo-name { font-size:1.15rem; }
        }
      `}</style>

      <nav id="vx-nav" className={scrolled ? "solid" : ""}>
        
        <div className="vx-logo" onClick={() => navigate("/")}>
          <MitchellsLogo height={28} />
          <span className="vx-logo-name">Mitchells</span>
        </div>

        
        <ul className="vx-nav-links" style={{ justifySelf: "center" }}>
          <li>
            <button className="vx-nav-link" onClick={() => scrollTo("why-Mitchells")}>Why Mitchells</button>
          </li>
          <li>
            <button className="vx-nav-link" onClick={() => scrollTo("features")}>Features</button>
          </li>

          
          <li style={{ position: "relative" }}>
            <button className={`vx-nav-link ${openDropdown === "pos" ? "active" : ""}`} onClick={() => toggle("pos")}>
              Integrations
              <ChevronDown size={13} className={`vx-chevron ${openDropdown === "pos" ? "open" : ""}`} />
            </button>
            {openDropdown === "pos" && <div className="vx-dropdown" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minWidth: "360px" }}>
                <div>
                  <div className="vx-dd-header">Point of Sale</div>
                  {NAV_POS_L.map(({ name, Logo }) => <div key={name} className="vx-dd-row">
                      <span className="vx-pos-logo"><Logo /></span>
                      {name}
                    </div>)}
                </div>
                <div style={{ borderLeft: "1px solid #EAEAF2" }}>
                  <div className="vx-dd-header">More Platforms</div>
                  {NAV_POS_R.map(({ name, Logo }) => <div key={name} className="vx-dd-row">
                      <span className="vx-pos-logo"><Logo /></span>
                      {name}
                    </div>)}
                </div>
              </div>}
          </li>

          
          <li style={{ position: "relative" }}>
            <button className={`vx-nav-link ${openDropdown === "res" ? "active" : ""}`} onClick={() => toggle("res")}>
              Resources
              <ChevronDown size={13} className={`vx-chevron ${openDropdown === "res" ? "open" : ""}`} />
            </button>
            {openDropdown === "res" && <div className="vx-dropdown" style={{ minWidth: "280px" }}>
                {resources.map((r) => <div key={r.name} className="vx-dd-row" onClick={r.scrollId ? () => scrollTo(r.scrollId) : void 0} style={{ alignItems: "flex-start", gap: "12px", padding: "12px 16px", cursor: r.scrollId ? "pointer" : "default" }}>
                    <div className="vx-res-icon">{r.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#0F0F1A", fontSize: ".82rem" }}>{r.name}</div>
                      <div style={{ fontSize: ".72rem", color: "#8888A8", marginTop: "2px" }}>{r.desc}</div>
                    </div>
                  </div>)}
              </div>}
          </li>
        </ul>

        
        <div className="vx-nav-right">
          {isLoggedIn ? <div style={{ position: "relative" }}>
              <button className="vx-profile-btn" onClick={() => toggle("profile")}>
                <div className="vx-av">{initial}</div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#525270", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email ?? ""}
                </span>
                <ChevronDown size={12} className={`vx-chevron ${openDropdown === "profile" ? "open" : ""}`} style={{ color: "#2A5BA8" }} />
              </button>
              {openDropdown === "profile" && <div
    style={{
      position: "absolute",
      top: "calc(100% + 14px)",
      right: 0,
      background: "#fff",
      border: "1px solid #EAEAF2",
      borderRadius: "18px",
      boxShadow: "0 12px 48px rgba(15,15,26,.13), 0 2px 8px rgba(15,15,26,.06)",
      overflow: "hidden",
      zIndex: 400,
      width: "260px",
      animation: "vxProfileIn .2s cubic-bezier(.16,1,.3,1) both"
    }}
  >
                  <div style={{ position: "absolute", top: "-6px", right: "22px", width: "12px", height: "12px", background: "#FAF9FF", border: "1px solid #EAEAF2", transform: "rotate(45deg)", borderBottom: "none", borderRight: "none", zIndex: 1 }} />
                  <div style={{ position: "relative", overflow: "hidden", padding: "20px 18px 16px", background: "linear-gradient(145deg,#0F0F1A 0%,#1A1830 60%,#0e1520 100%)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                    <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", background: "radial-gradient(circle,rgba(42,91,168,.28) 0%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
                    <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="vx-av-lg">{initial}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontFamily: "Sora,sans-serif", fontSize: ".8rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: ".62rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: "100px", background: user?.role === "admin" ? "rgba(27,63,122,.3)" : "rgba(29,184,122,.2)", color: user?.role === "admin" ? "#E8C56A" : "#1DB87A", border: `1px solid ${user?.role === "admin" ? "rgba(42,91,168,.3)" : "rgba(29,184,122,.25)"}` }}>{user?.role ?? "admin"}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: ".62rem", fontWeight: 600, color: "rgba(255,255,255,.38)" }}>
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#1DB87A", display: "inline-block" }} />
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "8px 0" }}>
                    <button onClick={() => {
    setOpenDropdown(null);
    navigate("/dashboard");
  }} className="vx-profile-dd-btn">
                      <span className="vx-profile-dd-icon"><LayoutDashboard size={14} /></span>
                      <div>
                        <div>Go to Dashboard</div>
                        <div style={{ fontSize: ".7rem", color: "#8888A8", fontWeight: 500, marginTop: "1px" }}>View your company analytics</div>
                      </div>
                    </button>
                    <button onClick={() => {
    setOpenDropdown(null);
    navigate("/dashboard/settings");
  }} className="vx-profile-dd-btn">
                      <span className="vx-profile-dd-icon"><Settings size={14} /></span>
                      <div>
                        <div>Settings</div>
                        <div style={{ fontSize: ".7rem", color: "#8888A8", fontWeight: 500, marginTop: "1px" }}>Manage agent & account</div>
                      </div>
                    </button>
                  </div>
                  <div style={{ borderTop: "1px solid #EAEAF2", padding: "8px 0 4px" }}>
                    <button
    onClick={() => {
      setOpenDropdown(null);
      logout(navigate);
    }}
    className="vx-profile-dd-btn"
    style={{ color: "#E54545" }}
    onMouseOver={(e) => {
      e.currentTarget.style.background = "rgba(229,69,69,.05)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.background = "none";
    }}
  >
                      <span style={{ width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(229,69,69,.08)", color: "#E54545" }}>
                        <LogOut size={14} />
                      </span>
                      Sign out
                    </button>
                  </div>
                </div>}
            </div> : <>
              <button className="vx-btn-login" onClick={() => navigate("/signin")}>Login</button>
              <button className="vx-btn-demo" onClick={() => navigate("/signin")}>Request a Demo</button>
            </>}
        </div>

        
        <button className="vx-hamburger" onClick={() => setMobileOpen((p) => !p)} aria-label="Toggle menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      
      <div className={`vx-mobile-menu${mobileOpen ? " open" : ""}`}>
        <button className="vx-mob-link" onClick={() => scrollTo("why-Mitchells")}>Why Mitchells</button>
        <button className="vx-mob-link" onClick={() => scrollTo("features")}>Features</button>
        <button className="vx-mob-link" onClick={() => scrollTo("integrations")}>Integrations</button>
        <button className="vx-mob-link" onClick={() => scrollTo("review")}>Customer Stories</button>
        <button className="vx-mob-link" onClick={() => scrollTo("demo")}>Pricing</button>
        <div className="vx-mob-divider" />
        <div className="vx-mob-cta">
          {isLoggedIn ? <>
              <button className="vx-btn-demo" onClick={() => {
    navigate("/dashboard");
    setMobileOpen(false);
  }}>Go to Dashboard</button>
              <button className="vx-btn-login" onClick={() => {
    logout(navigate);
    setMobileOpen(false);
  }}>Sign out</button>
            </> : <>
              <button className="vx-btn-login" onClick={() => {
    navigate("/signin");
    setMobileOpen(false);
  }}>Login</button>
              <button className="vx-btn-demo" onClick={() => {
    navigate("/signin");
    setMobileOpen(false);
  }}>Request a Demo</button>
            </>}
        </div>
      </div>
    </div>;
}
export {
  Navbar as default
};

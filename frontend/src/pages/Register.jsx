import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { registerApi } from "../api/api";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { MitchellsLogo } from "../components/MitchellsLogo";
const STATS = [
  { num: "100%", label: "automated setup" },
  { num: "24/7", label: "agent availability" },
  { num: "0", label: "missed calls" }
];
const TESTIMONIAL = {
  quote: "Setting up our company portal was instant. Within minutes, Mitchell's AI was handling our overflow calls.",
  name: "Robert D.",
  role: "Operations Manager, Mitchell's"
};
function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { isMobile } = useBreakpoint();
  useEffect(() => {
    setMounted(true);
  }, []);
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    try {
      await registerApi({ email, password, full_name: fullName });
      toast.success("Account created successfully! Please sign in.");
      navigate("/signin");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const inputStyle = (field) => ({
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: `1.5px solid ${focusedField === field ? "#2A5BA8" : "#EAEAF2"}`,
    outline: "none",
    fontFamily: "Sora, sans-serif",
    fontSize: ".9rem",
    color: "#0F0F1A",
    background: focusedField === field ? "#FDFCFF" : "#F8F8FC",
    boxShadow: focusedField === field ? "0 0 0 3px rgba(42,91,168,.12)" : "none",
    transition: "border-color .2s, box-shadow .2s, background .2s",
    boxSizing: "border-box",
    opacity: loading ? 0.6 : 1
  });
  return <>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes orb      { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.06) translateY(-18px)} }
        @keyframes spin     { to{transform:rotate(360deg)} }

        .vx-split { display:flex;min-height:100vh;font-family:'Sora',sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale; }

        .vx-panel-left {
          flex:1;position:relative;overflow:hidden;
          background:linear-gradient(145deg,#0F0F1A 0%,#1A1830 60%,#0e1520 100%);
          display:flex;flex-direction:column;justify-content:center;padding:64px 56px;
        }
        .vx-pl-orb1 {
          position:absolute;top:-120px;right:-120px;width:480px;height:480px;
          background:radial-gradient(circle,rgba(42,91,168,.22) 0%,transparent 70%);
          border-radius:50%;animation:orb 8s ease-in-out infinite;pointer-events:none;
        }
        .vx-pl-orb2 {
          position:absolute;bottom:-100px;left:-80px;width:380px;height:380px;
          background:radial-gradient(circle,rgba(29,184,122,.14) 0%,transparent 70%);
          border-radius:50%;animation:orb 11s ease-in-out infinite reverse;pointer-events:none;
        }
        .vx-pl-content { position:relative;z-index:1; }

        .vx-stat-row { display:flex;gap:32px;margin:36px 0; }
        .vx-stat-num {
          font-size:2.4rem;font-weight:800;letter-spacing:-.04em;
          background:linear-gradient(135deg,#fff 30%,#E8C56A 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          line-height:1;
        }
        .vx-stat-label { font-size:.72rem;color:rgba(255,255,255,.4);font-weight:500;margin-top:3px;line-height:1.3; }

        .vx-testimonial {
          margin-top:40px;padding:22px 24px;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);
          border-radius:16px;backdrop-filter:blur(16px);
        }

        .vx-panel-right {
          width:480px;flex-shrink:0;background:#fff;display:flex;flex-direction:column;
          justify-content:center;align-items:center;padding:48px 56px;
          border-left:1px solid #EAEAF2;
        }
        .vx-login-card { width:100%;max-width:380px; }

        .vx-login-submit {
          width:100%;padding:13px;border-radius:10px;border:none;
          background:linear-gradient(135deg,#1B3F7A 0%,#2A5BA8 100%);
          color:#fff;font-family:'Sora',sans-serif;font-size:.95rem;font-weight:700;
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
          box-shadow:0 4px 18px rgba(27,63,122,.28);
          transition:filter .2s,transform .2s,box-shadow .2s;
        }
        .vx-login-submit:hover:not(:disabled){ filter:brightness(1.09);transform:translateY(-1px);box-shadow:0 8px 28px rgba(27,63,122,.4); }
        .vx-login-submit:disabled { opacity:.65;cursor:not-allowed; }

        .vx-spin { animation:spin .8s linear infinite; }

        @media(max-width:1023px){
          .vx-panel-left { display:none; }
          .vx-panel-right { width:100%;border-left:none;background:#fff;padding:48px 40px; }
          .vx-login-card { max-width:440px; }
        }
        @media(max-width:639px){
          .vx-panel-right { padding:32px 20px;background:#F8F8FC; }
          .vx-login-card { max-width:100%; }
          .vx-stat-row { gap:20px; flex-wrap:wrap; margin:24px 0; }
          .vx-stat-num { font-size:1.8rem; }
        }
      `}</style>

      <div className="vx-split">
        
        <div className="vx-panel-left">
          <div className="vx-pl-orb1" />
          <div className="vx-pl-orb2" />

          <div className="vx-pl-content">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48, animation: "fadeIn .8s ease" }}>
              <MitchellsLogo height={32} />
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>Mitchell's</span>
            </div>

            <div style={{ animation: "fadeUp .7s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <h1 style={{ fontSize: "2.8rem", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.1, letterSpacing: "-.04em" }}>
                Empower your sales operations.
              </h1>
              <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,.6)", margin: "16px 0 0", lineHeight: 1.6, fontWeight: 400, maxWidth: 460 }}>
                Create a team account to manage calls, tweak phone agent prompts, sync product catalog, and track real-time analytics.
              </p>
            </div>

            <div className="vx-stat-row" style={{ animation: "fadeUp .8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              {STATS.map((s, idx) => <div key={idx} style={{ flex: 1, minWidth: 100 }}>
                  <div className="vx-stat-num">{s.num}</div>
                  <div className="vx-stat-label">{s.label}</div>
                </div>)}
            </div>

            <div className="vx-testimonial" style={{ animation: "fadeUp .9s cubic-bezier(0.16, 1, 0.3, 1)", opacity: mounted ? 1 : 0, transition: "opacity .6s" }}>
              <p style={{ margin: 0, fontSize: ".9rem", lineHeight: 1.6, color: "rgba(255,255,255,.85)", fontStyle: "italic", fontWeight: 400 }}>
                "{TESTIMONIAL.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2A5BA8,#1B3F7A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", fontWeight: 800, color: "#fff" }}>
                  {TESTIMONIAL.name[0]}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: ".8rem", fontWeight: 700, color: "#fff" }}>{TESTIMONIAL.name}</p>
                  <p style={{ margin: 0, fontSize: ".7rem", color: "rgba(255,255,255,.45)" }}>{TESTIMONIAL.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {
    /* RIGHT PANEL */
  }
        <div className="vx-panel-right">
          <div className="vx-login-card" style={{ animation: "fadeUp .6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            {isMobile && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
                <MitchellsLogo height={26} />
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0F0F1A", letterSpacing: "-.02em" }}>Mitchell's</span>
              </div>}

            <h2 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0F0F1A", margin: 0, letterSpacing: "-.03em" }}>Create an account</h2>
            <p style={{ fontSize: ".86rem", color: "#5F5F6E", margin: "8px 0 32px", lineHeight: 1.4 }}>
              Fill in your details below to set up your account.
            </p>

            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: ".76rem", fontWeight: 700, color: "#3C3C4A", letterSpacing: ".02em", textTransform: "uppercase" }}>Full Name</label>
                <input
    type="text"
    placeholder="e.g. John Doe"
    value={fullName}
    onChange={(e) => setFullName(e.target.value)}
    style={inputStyle("name")}
    onFocus={() => setFocusedField("name")}
    onBlur={() => setFocusedField(null)}
    required
    disabled={loading}
  />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: ".76rem", fontWeight: 700, color: "#3C3C4A", letterSpacing: ".02em", textTransform: "uppercase" }}>Email Address</label>
                <input
    type="email"
    placeholder="name@company.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    style={inputStyle("email")}
    onFocus={() => setFocusedField("email")}
    onBlur={() => setFocusedField(null)}
    required
    disabled={loading}
  />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: ".76rem", fontWeight: 700, color: "#3C3C4A", letterSpacing: ".02em", textTransform: "uppercase" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
    type={showPass ? "text" : "password"}
    placeholder="At least 8 characters"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    style={{ ...inputStyle("pass"), paddingRight: 46 }}
    onFocus={() => setFocusedField("pass")}
    onBlur={() => setFocusedField(null)}
    required
    disabled={loading}
  />
                  <button
    type="button"
    onClick={() => setShowPass(!showPass)}
    style={{
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      padding: 6,
      color: "#8E8E9E",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="vx-login-submit" style={{ marginTop: 8 }} disabled={loading}>
                {loading ? <Loader2 size={18} className="vx-spin" /> : "Sign Up"}
              </button>
            </form>

            <p style={{ margin: "24px 0 0", textAlign: "center", fontSize: ".85rem", color: "#5F5F6E", fontFamily: "Sora, sans-serif" }}>
              Already have an account?{" "}
              <Link to="/signin" style={{ color: "#1B3F7A", fontWeight: 700, textDecoration: "none" }}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>;
}
export {
  Register as default
};

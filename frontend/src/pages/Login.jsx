import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { loginApi } from "../api/api";
import { Eye, EyeOff } from "lucide-react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { MitchellsLogo } from "../components/MitchellsLogo";
import { BRAND, C } from "../theme/colors";

const STATS = [
  { num: "1933", label: "established in Lahore" },
  { num: "90+", label: "years of trust" },
  { num: "24/7", label: "AI sales line" },
];

const CHIPS = [
  { text: "Distributor order captured", dot: BRAND.green, delay: "0s", dur: "3.6s" },
  { text: "Export inquiry logged", dot: BRAND.gold, delay: "-1.4s", dur: "4.1s" },
  { text: "Karachi hours applied", dot: "#6EB5FF", delay: "-2.8s", dur: "3.8s" },
];

const TESTIMONIAL = {
  quote:
    "Our AI line now handles distributor calls across Pakistan — orders for jams, squashes and ketchups are captured accurately, even after office hours.",
  name: "Sales Team",
  role: "Mitchell's Fruit Farms Ltd., Pakistan",
};

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleContinue = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginApi({ email, password });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refreshToken", data.refresh_token);
      localStorage.setItem("role", "admin");
      localStorage.setItem("email", email);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: `1.5px solid ${focusedField === field ? BRAND.blue : "#EAEAF2"}`,
    outline: "none",
    fontFamily: "Sora, sans-serif",
    fontSize: ".9rem",
    color: "#0F0F1A",
    background: focusedField === field ? "#FDFCFF" : BRAND.cream,
    boxShadow: focusedField === field ? "0 0 0 3px rgba(27,63,122,.12)" : "none",
    transition: "border-color .2s, box-shadow .2s, background .2s",
    boxSizing: "border-box",
    opacity: loading ? 0.6 : 1,
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
        @keyframes chipfloat{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes ldot     { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(200,151,58,.5)} 50%{opacity:.7;box-shadow:0 0 0 6px rgba(200,151,58,0)} }
        @keyframes slideLeft { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:none} }
        @keyframes spin     { to{transform:rotate(360deg)} }

        .vx-split { display:flex;min-height:100vh;font-family:'Sora',sans-serif;-webkit-font-smoothing:antialiased; }

        .vx-panel-left {
          flex:1;position:relative;overflow:hidden;
          background:linear-gradient(155deg,${BRAND.blueDark} 0%,${BRAND.blue} 45%,#16325c 100%);
          display:flex;flex-direction:column;justify-content:center;padding:64px 56px;
        }
        .vx-panel-left::before {
          content:"";position:absolute;inset:0;pointer-events:none;
          background:
            radial-gradient(ellipse 80% 50% at 100% 0%,rgba(200,151,58,.18) 0%,transparent 55%),
            radial-gradient(ellipse 60% 40% at 0% 100%,rgba(27,122,78,.12) 0%,transparent 50%);
        }
        .vx-pl-gold-bar {
          position:absolute;top:0;left:0;right:0;height:4px;
          background:linear-gradient(90deg,${BRAND.gold},${BRAND.goldLight},${BRAND.gold});
        }
        .vx-pl-content { position:relative;z-index:1; }

        .vx-stat-row { display:flex;gap:32px;margin:36px 0;flex-wrap:wrap; }
        .vx-stat-num {
          font-size:2.2rem;font-weight:800;letter-spacing:-.04em;color:#fff;line-height:1;
        }
        .vx-stat-label { font-size:.72rem;color:${BRAND.textMuted};font-weight:500;margin-top:4px;line-height:1.3; }

        .vx-lp-chip {
          display:inline-flex;align-items:center;gap:8px;
          background:rgba(255,255,255,.08);border:1px solid rgba(200,151,58,.35);
          border-radius:100px;padding:9px 16px;font-size:.82rem;font-weight:600;
          color:rgba(255,255,255,.92);white-space:nowrap;
        }

        .vx-testimonial {
          margin-top:40px;padding:22px 24px;
          background:rgba(255,255,255,.06);border:1px solid rgba(200,151,58,.25);
          border-radius:16px;border-left:3px solid ${BRAND.gold};
        }

        .vx-panel-right {
          width:480px;flex-shrink:0;background:#fff;display:flex;flex-direction:column;
          justify-content:center;align-items:center;padding:48px 56px;
          border-left:1px solid #EAEAF2;
        }
        .vx-login-card { width:100%;max-width:380px; }

        .vx-login-submit {
          width:100%;padding:13px;border-radius:10px;border:none;
          background:linear-gradient(135deg,${BRAND.blue} 0%,${BRAND.blueDark} 100%);
          color:#fff;font-family:'Sora',sans-serif;font-size:.95rem;font-weight:700;
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
          box-shadow:0 4px 18px rgba(27,63,122,.28);
          transition:filter .2s,transform .2s,box-shadow .2s;
        }
        .vx-login-submit:hover:not(:disabled){
          filter:brightness(1.08);transform:translateY(-1px);
          box-shadow:0 8px 28px rgba(27,63,122,.35);
        }
        .vx-login-submit:disabled { opacity:.65;cursor:not-allowed; }
        .vx-spin { animation:spin .8s linear infinite; }

        @media(max-width:1023px){
          .vx-panel-left { display:none; }
          .vx-panel-right { width:100%;border-left:none;padding:48px 40px; }
          .vx-login-card { max-width:440px; }
        }
        @media(max-width:639px){
          .vx-panel-right { padding:32px 20px;background:${BRAND.cream}; }
          .vx-login-card { max-width:100%; }
        }
      `}</style>

      <div className="vx-split">
        <div className="vx-panel-left">
          <div className="vx-pl-gold-bar" />
          <div className="vx-pl-content">
            <div
              style={{
                marginBottom: "40px",
                opacity: mounted ? 1 : 0,
                animation: mounted ? "fadeUp .6s ease both" : "none",
              }}
            >
              <MitchellsLogo height={52} style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,.25))" }} />
              <p
                style={{
                  margin: "14px 0 0",
                  fontSize: ".78rem",
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: BRAND.goldLight,
                }}
              >
                Fruit Farms Ltd. · Pakistan
              </p>
            </div>

            <div
              style={{
                opacity: mounted ? 1 : 0,
                animation: mounted ? "fadeUp .65s .1s ease both" : "none",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  background: "rgba(200,151,58,.15)",
                  border: `1px solid rgba(200,151,58,.4)`,
                  borderRadius: "100px",
                  padding: "5px 14px",
                  marginBottom: "18px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: BRAND.gold,
                    display: "inline-block",
                    animation: "ldot 1.6s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: ".72rem",
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    color: BRAND.goldLight,
                    textTransform: "uppercase",
                  }}
                >
                  Est. 1933 — Lahore, Pakistan
                </span>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(1.75rem,2.8vw,2.45rem)",
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1.18,
                  letterSpacing: "-.03em",
                }}
              >
                Pakistan&apos;s heritage food brand,
                <br />
                <span style={{ color: BRAND.goldLight }}>
                  powered by voice AI.
                </span>
              </h2>
              <p
                style={{
                  marginTop: "14px",
                  fontSize: ".95rem",
                  color: BRAND.textMuted,
                  lineHeight: 1.65,
                  maxWidth: "420px",
                }}
              >
                Jams, squashes, ketchups, sauces &amp; confectionery — our AI
                agent answers distributor calls, captures orders, and handles
                export &amp; trade inquiries across Pakistan.
              </p>
            </div>

            <div
              className="vx-stat-row"
              style={{
                opacity: mounted ? 1 : 0,
                animation: mounted ? "fadeUp .65s .22s ease both" : "none",
              }}
            >
              {STATS.map((s) => (
                <div key={s.num}>
                  <div className="vx-stat-num">{s.num}</div>
                  <div className="vx-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                opacity: mounted ? 1 : 0,
                animation: mounted ? "fadeUp .65s .34s ease both" : "none",
              }}
            >
              {CHIPS.map((c) => (
                <div
                  key={c.text}
                  className="vx-lp-chip"
                  style={{
                    animation: `chipfloat ${c.dur} ease-in-out infinite`,
                    animationDelay: c.delay,
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: c.dot,
                      flexShrink: 0,
                    }}
                  />
                  {c.text}
                </div>
              ))}
            </div>

            <div
              className="vx-testimonial"
              style={{
                opacity: mounted ? 1 : 0,
                animation: mounted ? "fadeUp .65s .46s ease both" : "none",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: ".92rem",
                  fontStyle: "italic",
                  fontFamily: "'Lora',Georgia,serif",
                  color: "rgba(255,255,255,.82)",
                  lineHeight: 1.65,
                }}
              >
                &ldquo;{TESTIMONIAL.quote}&rdquo;
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "14px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: BRAND.gold,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: ".75rem",
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  M
                </div>
                <div>
                  <div
                    style={{
                      fontSize: ".85rem",
                      fontWeight: 700,
                      color: "rgba(255,255,255,.95)",
                    }}
                  >
                    {TESTIMONIAL.name}
                  </div>
                  <div
                    style={{
                      fontSize: ".75rem",
                      color: BRAND.textMuted,
                    }}
                  >
                    {TESTIMONIAL.role}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="vx-panel-right">
          <div
            className="vx-login-card"
            style={{
              opacity: mounted ? 1 : 0,
              animation: mounted ? "slideLeft .6s .1s ease both" : "none",
            }}
          >
            {(isMobile || isTablet) && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "6px",
                  marginBottom: "28px",
                }}
              >
                <MitchellsLogo height={40} />
                <span
                  style={{
                    fontSize: ".72rem",
                    fontWeight: 700,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: BRAND.gold,
                  }}
                >
                  Mitchell&apos;s Fruit Farms · Pakistan
                </span>
              </div>
            )}

            <div style={{ marginBottom: "32px" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.45rem",
                  fontWeight: 800,
                  color: BRAND.blueDark,
                  letterSpacing: "-.03em",
                }}
              >
                Sign in
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: ".88rem", color: "#8888A8" }}>
                Mitchell&apos;s sales &amp; operations portal
              </p>
            </div>

            <form
              onSubmit={handleContinue}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: ".82rem", fontWeight: 600, color: "#525270" }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@mitchells.com.pk"
                  required
                  disabled={loading}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle("email")}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label style={{ fontSize: ".82rem", fontWeight: 600, color: "#525270" }}>
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{
                      fontSize: ".8rem",
                      fontWeight: 600,
                      color: BRAND.blue,
                      textDecoration: "none",
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle("password"), paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#8888A8",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="vx-login-submit"
                style={{ marginTop: "4px" }}
              >
                {loading ? (
                  <>
                    <svg className="vx-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="4" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* <p style={{ marginTop: "20px", textAlign: "center", fontSize: ".85rem", color: "#5F5F6E" }}>
              Don&apos;t have an account?{" "}
              <Link to="/register" style={{ color: BRAND.blue, fontWeight: 700, textDecoration: "none" }}>
                Sign Up
              </Link>
            </p> */}

            <p style={{ marginTop: "28px", textAlign: "center", fontSize: ".78rem", color: "#C0C0D0" }}>
              Mitchell&apos;s Fruit Farms Ltd. · Pakistan
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export { SignIn as default };

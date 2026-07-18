import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { resetPasswordApi } from "../api/api";
import { Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { MitchellsLogo } from "../components/MitchellsLogo";
function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { isMobile } = useBreakpoint();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid reset link. Token is missing.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordApi({ token, new_password: newPassword });
      toast.success("Password updated successfully! Please login with your new password.");
      navigate("/signin");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Password reset failed. Please request a new link.");
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
          border-radius:50%;pointer-events:none;
        }
        .vx-pl-content { position:relative;z-index:1; }

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
        }
      `}</style>

      <div className="vx-split">
        
        <div className="vx-panel-left">
          <div className="vx-pl-orb1" />
          <div className="vx-pl-content">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
              <MitchellsLogo height={32} />
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>Mitchell's</span>
            </div>

            <div style={{ animation: "fadeUp .7s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <h1 style={{ fontSize: "2.8rem", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.1, letterSpacing: "-.04em" }}>
                Secure your new credentials.
              </h1>
              <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,.6)", margin: "16px 0 0", lineHeight: 1.6, fontWeight: 400, maxWidth: 460 }}>
                Choose a strong password to protect your account metadata, call logs, and customer order histories.
              </p>
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

            {!token ? <div style={{ textAlign: "center" }}>
                <div style={{ display: "inline-flex", padding: 16, borderRadius: "50%", background: "#FEF2F2", color: "#EF4444", marginBottom: 24 }}>
                  <KeyRound size={36} />
                </div>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0F0F1A", margin: 0, letterSpacing: "-.03em" }}>Invalid Link</h2>
                <p style={{ fontSize: ".9rem", color: "#5F5F6E", margin: "12px 0 28px", lineHeight: 1.6 }}>
                  This password reset link is missing a secure token or has expired. Please request a new link to proceed.
                </p>
                <Link to="/forgot-password" className="vx-login-submit" style={{ textDecoration: "none" }}>
                  Request New Link
                </Link>
              </div> : <>
                <h2 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0F0F1A", margin: 0, letterSpacing: "-.03em" }}>Reset Password</h2>
                <p style={{ fontSize: ".86rem", color: "#5F5F6E", margin: "8px 0 32px", lineHeight: 1.4 }}>
                  Please type in your new password below.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: ".76rem", fontWeight: 700, color: "#3C3C4A", letterSpacing: ".02em", textTransform: "uppercase" }}>New Password</label>
                    <div style={{ position: "relative" }}>
                      <input
    type={showPass ? "text" : "password"}
    placeholder="At least 8 characters"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    style={{ ...inputStyle("new-pass"), paddingRight: 46 }}
    onFocus={() => setFocusedField("new-pass")}
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

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: ".76rem", fontWeight: 700, color: "#3C3C4A", letterSpacing: ".02em", textTransform: "uppercase" }}>Confirm Password</label>
                    <input
    type="password"
    placeholder="Repeat new password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    style={inputStyle("confirm-pass")}
    onFocus={() => setFocusedField("confirm-pass")}
    onBlur={() => setFocusedField(null)}
    required
    disabled={loading}
  />
                  </div>

                  <button type="submit" className="vx-login-submit" style={{ marginTop: 8 }} disabled={loading}>
                    {loading ? <Loader2 size={18} className="vx-spin" /> : "Update Password"}
                  </button>
                </form>
              </>}

            <p style={{ margin: "32px 0 0", textAlign: "center", fontSize: ".85rem", color: "#5F5F6E", fontFamily: "Sora, sans-serif" }}>
              Back to{" "}
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
  ResetPassword as default
};

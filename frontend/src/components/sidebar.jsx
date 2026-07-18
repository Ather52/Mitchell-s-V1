import { useRef, useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { MitchellsLogo } from "./MitchellsLogo";
import {
  ChartBarIncreasing,
  ChartNoAxesColumnIncreasing,
  PhoneCall,
  PhoneOutgoing,
  Settings,
  SquareMenu,
  LogOut,
  ChevronUp,
  Menu,
  X,
  RefreshCw,
  Pause,
  Play,
  ShoppingBag,
  Bot,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  getSettingsApi,
  updateSettingsApi,
  getDashboardStatsApi
} from "../api/api";
import { C, BRAND } from "../theme/colors";

const SIDEBAR_CSS = `
  @keyframes vxDropIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes ldot     { 0%,100%{box-shadow:0 0 0 0 rgba(29,184,122,.5)} 50%{box-shadow:0 0 0 5px rgba(29,184,122,0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes vxSkeleton { 0%,100%{opacity:.4} 50%{opacity:.9} }

  .vx-nav-link {
    display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:10px;
    text-decoration:none; font-family:'Sora',sans-serif; font-size:.84rem; font-weight:600;
    color:${C.textSub}; background:transparent; transition:background .15s, color .15s;
    white-space:nowrap; overflow:hidden; box-sizing:border-box;
  }
  .vx-nav-link:hover  { background:${C.goldBg}; color:${C.gold}; }
  .vx-nav-link.active { background:${C.blueBg}; color:${C.blue}; font-weight:700; }

  .vx-profile-btn {
    display:flex; align-items:center; gap:9px; padding:8px 8px; border-radius:10px;
    background:transparent; border:none; cursor:pointer; width:100%; box-sizing:border-box;
    transition:background .15s;
  }
  .vx-profile-btn:hover { background:${C.blueBg}; }

  .vx-profile-popup { animation:vxDropIn .18s cubic-bezier(.22,1,.36,1) both; }

  .vx-popup-row {
    display:flex; align-items:center; gap:9px; padding:10px 16px;
    background:none; border:none; width:100%; cursor:pointer;
    font-family:'Sora',sans-serif; font-size:.82rem; font-weight:600; color:${C.textSub};
    transition:background .12s, color .12s; text-align:left; box-sizing:border-box;
  }
  .vx-popup-row:hover { background:${C.bg}; color:${C.text}; }

  .vx-popup-logout {
    display:flex; align-items:center; gap:9px; padding:10px 16px;
    background:none; border:none; width:100%; cursor:pointer;
    font-family:'Sora',sans-serif; font-size:.82rem; font-weight:700; color:${C.gold};
    transition:background .12s; text-align:left; box-sizing:border-box;
  }
  .vx-popup-logout:hover { background:rgba(229,69,69,.06); }

  .vx-agent-toggle {
    display:flex; align-items:center; gap:5px;
    font-family:'Sora',sans-serif; font-size:.72rem; font-weight:700;
    border:none; border-radius:7px; padding:5px 10px; cursor:pointer;
    transition:background .15s, color .15s, box-shadow .15s; flex-shrink:0;
  }

  .vx-refresh-btn {
    background:none; border:none; cursor:pointer; padding:2px;
    color:${C.textMuted}; display:flex; align-items:center; transition:color .15s;
    border-radius:4px;
  }
  .vx-refresh-btn:hover { color:${C.blue}; }
  .vx-refresh-btn.spinning svg { animation:spin .6s linear infinite; }

  .vx-stat-cell {
    flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:10px 8px; border-radius:10px; background:${C.goldBg}; border:1px solid ${C.goldBdr};
    gap:2px; min-width:0;
  }
`;
const NAV_ITEMS = [
  { icon: <ChartNoAxesColumnIncreasing size={16} />, label: "Overview", to: "/dashboard", end: true },
  { icon: <Bot size={16} />, label: "Agents", to: "/dashboard/agents" },
  { icon: <PhoneCall size={16} />, label: "Calls & Orders", to: "/dashboard/calls" },
  { icon: <PhoneOutgoing size={16} />, label: "Outbound Calls", to: "/dashboard/calling/outbound" },
  { icon: <AlertCircle size={16} />, label: "Complaints", to: "/dashboard/complaints" },
  { icon: <SquareMenu size={16} />, label: "Products", to: "/dashboard/menu" },
  { icon: <ChartBarIncreasing size={16} />, label: "Reports", to: "/dashboard/report" },
  { icon: <Settings size={16} />, label: "Settings", to: "/dashboard/settings" }
];
function Avatar({ initial, size = 28 }) {
  return <div style={{
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    background: BRAND.gold,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: C.font,
    fontSize: size * 0.3,
    fontWeight: 800,
    color: "#fff"
  }}>
    {initial}
  </div>;
}
function SidebarContent({ collapsed, onCollapse, onClose, isMobile }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const initial = user?.email?.[0]?.toUpperCase() ?? "?";
  const displayEmail = user?.email ?? "";
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);
  const [agentActive, setAgentActive] = useState(null);
  const [agentToggling, setAgentToggling] = useState(false);
  const fetchAgent = useCallback(async () => {
    try {
      const s = await getSettingsApi();
      setAgentActive(s.is_active);
    } catch {
    }
  }, []);
  const toggleAgent = async () => {
    if (agentActive === null || agentToggling) return;
    const next = !agentActive;
    setAgentToggling(true);
    setAgentActive(next);
    try {
      await updateSettingsApi({ is_active: next });
      toast.success(next ? "Agent is now live" : "Agent paused");
    } catch {
      setAgentActive(!next);
      toast.error("Failed to update agent status");
    } finally {
      setAgentToggling(false);
    }
  };
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(false);
    try {
      setStats(await getDashboardStatsApi());
    } catch {
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);
  const [clock, setClock] = useState(
    () => (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    fetchAgent();
    fetchStats();
    const clockTick = setInterval(() => setClock((/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 3e4);
    const agentPoll = setInterval(fetchAgent, 3e4);
    const statsPoll = setInterval(fetchStats, 6e4);
    return () => {
      clearInterval(clockTick);
      clearInterval(agentPoll);
      clearInterval(statsPoll);
    };
  }, [fetchAgent, fetchStats]);
  const w = collapsed ? 64 : 240;
  const isActive = agentActive === true;
  return <>
    <style>{SIDEBAR_CSS}</style>
    <aside style={{
      fontFamily: C.font,
      width: w,
      minWidth: w,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      background: C.white,
      borderRight: `1px solid ${C.border}`,
      padding: "14px 10px",
      transition: "width .25s cubic-bezier(.4,0,.2,1), min-width .25s cubic-bezier(.4,0,.2,1)",
      minHeight: "100vh",
      height: "100vh",
      overflowY: "auto",
      overflowX: "hidden",
      boxSizing: "border-box",
      position: "sticky",
      top: 0
    }}>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>


        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: "2px 2px 14px",
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 10,
          position: "relative"
        }}>
          {isMobile ? <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.textMuted, display: "flex", alignItems: "center", borderRadius: 7, marginRight: collapsed ? 0 : "auto" }}>
            <X size={17} />
          </button> : <button
            onClick={onCollapse}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              cursor: "pointer",
              width: 26,
              height: 26,
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.textMuted,
              flexShrink: 0,
              marginRight: collapsed ? 0 : "auto",
              fontFamily: C.font,
              fontSize: "1rem",
              lineHeight: 1,
              transition: "background .15s, border-color .15s, color .15s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = C.blueBg;
              e.currentTarget.style.borderColor = C.blueLight;
              e.currentTarget.style.color = C.blue;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.textMuted;
            }}
          >
            {collapsed ? "\u203A" : "\u2039"}
          </button>}
          {!collapsed && <div style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            cursor: "pointer"
          }} onClick={() => navigate("/dashboard")}>
            <MitchellsLogo height={24} color="#0F0F1A" />
          </div>}
        </div>

        {collapsed ? <div
          title={agentActive === null ? "Loading\u2026" : isActive ? "Agent is live" : "Agent is paused"}
          style={{ display: "flex", justifyContent: "center", padding: "8px 0 10px" }}
        >
          <div style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: agentActive === null ? C.textLight : isActive ? C.blue : C.textLight,
            animation: isActive ? "ldot 1.8s ease-in-out infinite" : "none",
            flexShrink: 0
          }} />
        </div> : <div style={{
          borderRadius: 12,
          padding: "12px 13px",
          marginBottom: 6,
          border: `1.5px solid ${agentActive === null ? C.border : isActive ? "rgb(87, 151, 224)" : C.border}`,
          background: agentActive === null ? C.bg : isActive ? C.blueBg : C.bg,
          transition: "border-color .3s, background .3s"
        }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {agentActive === null ? <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.textLight, animation: "vxSkeleton 1.2s ease infinite" }} /> : <div style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                flexShrink: 0,
                background: isActive ? C.blue : C.textLight,
                animation: isActive ? "ldot 1.8s ease-in-out infinite" : "none"
              }} />}
              <span style={{
                fontFamily: C.font,
                fontSize: ".7rem",
                fontWeight: 800,
                letterSpacing: ".07em",
                textTransform: "uppercase",
                color: agentActive === null ? C.textLight : isActive ? C.blue : C.textMuted
              }}>
                {agentActive === null ? "Loading" : isActive ? "Live" : "Paused"}
              </span>
            </div>
            <span style={{ fontFamily: C.font, fontSize: ".72rem", fontWeight: 600, color: C.textMuted }}>
              {clock}
            </span>
          </div>


          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{
              fontFamily: C.font,
              fontSize: ".75rem",
              fontWeight: 500,
              color: isActive ? C.textSub : C.textMuted,
              lineHeight: 1.4
            }}>
              {agentActive === null ? "Fetching status\u2026" : isActive ? "Answering all calls" : "Not answering calls"}
            </span>

            <button
              className="vx-agent-toggle"
              onClick={toggleAgent}
              disabled={agentActive === null || agentToggling}
              style={{
                background: agentToggling ? C.bg : isActive ? C.goldBg : C.blueBg,
                color: agentToggling ? C.textMuted : isActive ? C.gold : C.blue,
                opacity: agentActive === null ? 0.5 : 1
              }}
            >
              {agentToggling ? <div style={{ width: 10, height: 10, border: `2px solid ${C.textMuted}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .6s linear infinite" }} /> : isActive ? <><Pause size={10} /> Pause</> : <><Play size={10} /> Go Live</>}
            </button>
          </div>
        </div>}

        {NAV_ITEMS.map((item) => <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={isMobile ? onClose : void 0}
          title={collapsed ? item.label : void 0}
          className={({ isActive: isActive2 }) => `vx-nav-link${isActive2 ? " active" : ""}`}
          style={{ justifyContent: collapsed ? "center" : "flex-start" }}
        >
          <span style={{ flexShrink: 0, width: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {item.icon}
          </span>
          {!collapsed && <>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
            {item.badge && <span style={{
              fontFamily: C.font,
              fontSize: ".62rem",
              fontWeight: 700,
              letterSpacing: ".04em",
              padding: "2px 7px",
              borderRadius: 100,
              flexShrink: 0,
              background: C.blueBg,
              color: C.blue
            }}>{item.badge}</span>}
          </>}
        </NavLink>)}

        {!collapsed && <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
            <span style={{ fontFamily: C.font, fontSize: ".7rem", fontWeight: 700, color: C.textMuted, letterSpacing: ".05em", textTransform: "uppercase" }}>
              Today
            </span>
            <button
              className={`vx-refresh-btn${statsLoading ? " spinning" : ""}`}
              onClick={fetchStats}
              title="Refresh stats"
            >
              <RefreshCw size={11} />
            </button>
          </div>


          <div style={{ display: "flex", gap: 7 }}>
            <div className="vx-stat-cell">
              <span style={{ fontFamily: C.font, fontSize: "1.1rem", fontWeight: 800, color: C.gold, lineHeight: 1 }}>
                {statsError ? "\u2014" : stats === null ? <span style={{ display: "inline-block", width: 24, height: 14, borderRadius: 4, background: C.goldBorder, animation: "vxSkeleton 1.2s ease infinite" }} /> : stats.orders.today}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
                <ShoppingBag size={9} style={{ color: C.textMuted, flexShrink: 0 }} />
                <span style={{ fontFamily: C.font, fontSize: ".65rem", fontWeight: 600, color: C.gold }}>Orders</span>
              </div>
            </div>
            <div className="vx-stat-cell">
              <span style={{ fontFamily: C.font, fontSize: "1.1rem", fontWeight: 800, color: C.gold, lineHeight: 1 }}>
                {statsError ? "\u2014" : stats === null ? <span style={{ display: "inline-block", width: 24, height: 14, borderRadius: 4, background: C.goldBorder, animation: "vxSkeleton 1.2s ease infinite" }} /> : (stats.calls.today ?? stats.calls.total)}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
                <PhoneCall size={9} style={{ color: C.gold, flexShrink: 0 }} />
                <span style={{ fontFamily: C.font, fontSize: ".65rem", fontWeight: 600, color: C.gold }}>Calls</span>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {[
              {
                label: "Inbound",
                calls: stats?.calls?.today_inbound ?? 0,
                orders: stats?.orders?.today_inbound ?? 0,
                icon: <PhoneCall size={9} style={{ color: C.blue, flexShrink: 0 }} />
              },
              {
                label: "Outbound",
                calls: stats?.calls?.today_outbound ?? 0,
                orders: stats?.orders?.today_outbound ?? 0,
                icon: <PhoneOutgoing size={9} style={{ color: C.gold, flexShrink: 0 }} />
              }
            ].map((item) => <div key={item.label} style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "8px 9px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.bg,
              minWidth: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {item.icon}
                <span style={{ fontFamily: C.font, fontSize: ".64rem", fontWeight: 800, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              </div>
              <span style={{ fontFamily: C.font, fontSize: ".62rem", fontWeight: 700, color: C.textMuted }}>
                {statsError ? "\u2014" : stats === null ? "Loading" : `${item.calls} calls`}
              </span>
              <span style={{ fontFamily: C.font, fontSize: ".62rem", fontWeight: 700, color: C.textMuted }}>
                {statsError ? "\u2014" : stats === null ? "Loading" : `${item.orders} orders`}
              </span>
            </div>)}
          </div>
        </div>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 1, background: C.border }} />


        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            className="vx-profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <Avatar initial={initial} size={30} />
            {!collapsed && <>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <p style={{ margin: 0, fontFamily: C.font, fontSize: ".78rem", fontWeight: 600, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayEmail}
                </p>
                <span style={{
                  fontFamily: C.font,
                  fontSize: ".62rem",
                  fontWeight: 700,
                  letterSpacing: ".05em",
                  textTransform: "uppercase",
                  color: user?.role === "admin" ? C.blue : C.blue
                }}>
                  {user?.role ?? "user"}
                </span>
              </div>
              <ChevronUp size={13} style={{
                color: C.textMuted,
                flexShrink: 0,
                transition: "transform .2s",
                transform: profileOpen ? "rotate(0deg)" : "rotate(180deg)"
              }} />
            </>}
          </button>


          {profileOpen && <div className="vx-profile-popup" style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: collapsed ? 48 : 0,
            right: collapsed ? "auto" : 0,
            width: collapsed ? 230 : void 0,
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(15,15,26,.10), 0 2px 6px rgba(15,15,26,.06)",
            overflow: "hidden",
            zIndex: 50
          }}>

            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar initial={initial} size={36} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontFamily: C.font, fontSize: ".8rem", fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayEmail}
                  </p>
                  <span style={{
                    display: "inline-block",
                    marginTop: 3,
                    fontFamily: C.font,
                    fontSize: ".62rem",
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: 100,
                    background: user?.role === "admin" ? C.blueBg : C.blueLight,
                    color: user?.role === "admin" ? C.blue : C.blue
                  }}>
                    {user?.role ?? "user"}
                  </span>
                </div>
              </div>
            </div>


            <button className="vx-popup-row" onClick={() => {
              navigate("/dashboard/settings");
              setProfileOpen(false);
            }}>
              <Settings size={14} style={{ flexShrink: 0, color: C.textMuted }} />
              Settings
            </button>

            <div style={{ height: 1, background: C.border, margin: "0 12px" }} />


            <button className="vx-popup-logout" onClick={() => logout(navigate)}>
              <LogOut size={14} />
              Sign out
            </button>
          </div>}
        </div>
      </div>

    </aside>
  </>;
}
function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  return <>

    <button
      onClick={() => setMobileOpen(true)}
      className="vx-mobile-trigger"
      style={{
        display: "none",
        position: "fixed",
        top: 14,
        left: 14,
        zIndex: 50,
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 9,
        padding: "7px 8px",
        cursor: "pointer",
        color: C.textSub,
        boxShadow: "0 2px 8px rgba(15,15,26,.08)"
      }}
    >
      <Menu size={18} />
    </button>

    <style>{`
        @media(max-width:767px){
          .vx-mobile-trigger{ display:flex !important; align-items:center; }
          .vx-desktop-sidebar{ display:none !important; }
        }
        @media(min-width:768px){ .vx-mobile-trigger{ display:none !important; } }
      `}</style>


    <div className="vx-desktop-sidebar" style={{ display: "flex", position: "sticky", top: 0, height: "100vh" }}>
      <SidebarContent
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        onClose={() => {
        }}
        isMobile={false}
      />
    </div>


    {mobileOpen && <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex" }}>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(15,15,26,.35)", backdropFilter: "blur(2px)" }}
        onClick={() => setMobileOpen(false)}
      />
      <div style={{ position: "relative", zIndex: 50, display: "flex" }}>
        <SidebarContent collapsed={false} onCollapse={() => {
        }} onClose={() => setMobileOpen(false)} isMobile />
      </div>
    </div>}
  </>;
}
export {
  Sidebar as default
};

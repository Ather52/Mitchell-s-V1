import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  PhoneOutgoing,
  Users,
  Megaphone,
  Activity,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { getOutboundStatsApi } from "../../api/api";
import { C, Btn, spinStyle } from "./outboundStyles";

function StatCard({ icon, label, value, loading }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "20px 22px",
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: C.blueBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.blue,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: ".8rem", fontWeight: 600, color: C.textMuted }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, color: C.text }}>
        {loading ? (
          <Loader2 size={20} style={spinStyle} />
        ) : (
          value ?? "—"
        )}
      </div>
    </div>
  );
}

export default function OutboundDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchLock = useRef(false);

  const fetchStats = useCallback(async (silent = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    if (!silent) setRefreshing(true);
    try {
      setStats(await getOutboundStatsApi());
    } catch {
      if (!silent) setStats(null);
    } finally {
      fetchLock.current = false;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(false);
    const interval = setInterval(() => fetchStats(true), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const cards = [
    { icon: <Megaphone size={18} />, label: "Campaigns", value: stats?.campaigns },
    { icon: <Users size={18} />, label: "Contacts", value: stats?.contacts },
    { icon: <PhoneOutgoing size={18} />, label: "Calls Today", value: stats?.calls_today },
    { icon: <Activity size={18} />, label: "Active Calls", value: stats?.active_calls },
    { icon: <CheckCircle2 size={18} />, label: "Completed Calls", value: stats?.completed_calls },
  ];

  return (
    <div style={{ background: C.pageBg, minHeight: "100vh", padding: "24px 28px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: C.text }}>
            Outbound Calling
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: ".85rem", color: C.textMuted }}>
            Manage campaigns and outbound calls
          </p>
        </div>
        <Btn variant="secondary" loading={refreshing} onClick={() => fetchStats(false)}>
          <RefreshCw size={14} />
          Refresh
        </Btn>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 28 }}>
        {cards.map((c) => (
          <StatCard key={c.label} {...c} loading={initialLoading} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Campaigns", path: "/dashboard/calling/outbound/campaigns" }
        ].map((item) => (
          <Btn key={item.path} variant="primary" onClick={() => navigate(item.path)}>
            {item.label}
            <ArrowRight size={14} />
          </Btn>
        ))}
      </div>
    </div>
  );
}

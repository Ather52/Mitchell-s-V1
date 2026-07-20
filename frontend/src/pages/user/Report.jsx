import { useEffect, useState } from "react";
import {
  Phone,
  ShoppingBag,
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  PhoneCall,
  Star,
  Truck,
  Store
} from "lucide-react";
import { getReportApi } from "../../api/api";
import { C } from "../../theme/colors";

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
  bg,
  bdr,
  delay = 0
}) {
  return <div style={{
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 1px 8px rgba(0,0,0,.05)",
    animation: `fadeUp .35s ${delay}s both`
  }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 600, color: C.textMuted }}>{label}</span>
        <div style={{
    width: 34,
    height: 34,
    borderRadius: 10,
    background: bg,
    border: `1px solid ${bdr}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color,
    flexShrink: 0
  }}>
          {icon}
        </div>
      </div>
      <div>
        <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1 }}>
          {value}
        </p>
        {sub && <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, color: C.textMuted, margin: "6px 0 0" }}>{sub}</p>}
      </div>
    </div>;
}
function SectionHeader({ icon, title, sub }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <span style={{ color: C.blue, display: "flex" }}>{icon}</span>
      <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
      {sub && <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, color: C.textMuted, marginLeft: 2 }}>{sub}</span>}
    </div>;
}
function LineChart({
  data,
  color,
  label
}) {
  if (!data.length) {
    return <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, color: C.textMuted }}>No data</span>
      </div>;
  }
  const W = 400;
  const H = 110;
  const max = Math.max(...data.map((d) => d.value), 1);
  const pts = data.map((d, i) => ({
    x: data.length === 1 ? W / 2 : i / (data.length - 1) * W,
    y: H - d.value / max * (H - 20) - 10,
    v: d.value,
    date: d.date
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const gradId = `grad-${label.replace(/\s/g, "")}`;
  const peak = pts.reduce((m, p) => p.v > m.v ? p : m, pts[0]);
  return <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 110, overflow: "visible" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((pct, i) => {
    const y = H - pct * (H - 20) - 10;
    return <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="rgba(0,0,0,.05)" strokeWidth="1" />;
  })}
        <polygon fill={`url(#${gradId})`} points={`0,${H} ${polyline} ${W},${H}`} />
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={polyline} />
        {pts.map((p, i) => p.v > 0 && <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="#fff" strokeWidth="2" />)}
        {peak.v > 0 && <>
            <rect
    x={Math.min(Math.max(peak.x - 18, 0), W - 36)}
    y={peak.y - 24}
    width={36}
    height={17}
    rx={5}
    fill={color}
    opacity="0.92"
  />
            <text
    x={Math.min(Math.max(peak.x, 18), W - 18)}
    y={peak.y - 12}
    textAnchor="middle"
    fontSize="9.5"
    fontWeight="700"
    fill="#fff"
  >
              {peak.v}
            </text>
          </>}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {[data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].filter(Boolean).map((d, i) => <span key={i} style={{ fontFamily: "'Sora',sans-serif", fontSize: 10, color: C.textMuted }}>
              {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>)}
      </div>
    </div>;
}
function DonutChart({
  data,
  colors,
  centerLabel
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  const R = 38;
  const cx = 54;
  const cy = 54;
  const stroke = 12;
  let cumAngle = -Math.PI / 2;
  const arcs = Object.entries(data).map(([label, val]) => {
    const angle = val / total * 2 * Math.PI;
    const x1 = cx + R * Math.cos(cumAngle);
    const y1 = cy + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + R * Math.cos(cumAngle);
    const y2 = cy + R * Math.sin(cumAngle);
    return {
      label,
      val,
      color: colors[label] ?? "#cbd5e1",
      x1,
      y1,
      x2,
      y2,
      large: angle > Math.PI ? 1 : 0,
      pct: Math.round(val / total * 100)
    };
  });
  return <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg viewBox="0 0 108 108" style={{ width: 96, height: 96, flexShrink: 0 }}>
        {arcs.map((a, i) => <path
    key={i}
    d={`M ${a.x1} ${a.y1} A ${R} ${R} 0 ${a.large} 1 ${a.x2} ${a.y2}`}
    fill="none"
    stroke={a.color}
    strokeWidth={stroke}
    strokeLinecap="butt"
  />)}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={C.text}>{total}</text>
        <text x={cx} y={cy + 17} textAnchor="middle" fontSize="8" fill={C.textMuted}>{centerLabel ?? "total"}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
        {arcs.map((a) => <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0, display: "block" }} />
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, color: C.textSub, flex: 1 }}>{a.label}</span>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, color: C.text }}>{a.val}</span>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 10, color: C.textMuted, width: 32, textAlign: "right" }}>{a.pct}%</span>
          </div>)}
      </div>
    </div>;
}
function HBar({ items }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item) => <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, width: 82, flexShrink: 0 }}>
            {item.icon && <span style={{ color: C.textMuted, display: "flex" }}>{item.icon}</span>}
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, color: C.textSub }}>{item.label}</span>
          </div>
          <div style={{ flex: 1, height: 8, background: C.inputBg, borderRadius: 4, overflow: "hidden" }}>
            <div style={{
    height: "100%",
    width: `${item.total > 0 ? item.value / item.total * 100 : 0}%`,
    background: item.color,
    borderRadius: 4,
    transition: "width .4s ease"
  }} />
          </div>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, color: C.text, width: 28, textAlign: "right" }}>
            {item.value}
          </span>
        </div>)}
    </div>;
}
function StatRow({ label, value, color }) {
  return <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "9px 0",
    borderBottom: `1px solid ${C.borderFaint}`
  }}>
      <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, color: C.textSub }}>{label}</span>
      <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: color ?? C.text }}>
        {value}
      </span>
    </div>;
}
function RingProgress({ pct, color, label, value }) {
  const R = 30;
  const cx = 38;
  const cy = 38;
  const circ = 2 * Math.PI * R;
  const dash = Math.min(pct, 100) / 100 * circ;
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg viewBox="0 0 76 76" style={{ width: 70, height: 70 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.inputBg} strokeWidth={7} />
        <circle
    cx={cx}
    cy={cy}
    r={R}
    fill="none"
    stroke={color}
    strokeWidth={7}
    strokeDasharray={`${dash} ${circ}`}
    strokeLinecap="round"
    transform={`rotate(-90 ${cx} ${cy})`}
    style={{ transition: "stroke-dasharray .5s ease" }}
  />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="12" fontWeight="800" fill={C.text}>{value}</text>
      </svg>
      <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 600, color: C.textMuted, textAlign: "center" }}>
        {label}
      </span>
    </div>;
}
const PERIODS = [
  { label: "Today", days: 1 },
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 }
];
function Report() {
  const [data, setData] = useState(null);
  const [loading, setLoad] = useState(true);
  const [refresh, setRef] = useState(false);
  const [period, setPeriod] = useState(7);
  const fetchData = async (days, silent = false) => {
    if (!silent) setLoad(true);
    else setRef(true);
    try {
      setData(await getReportApi(days));
    } catch {
    } finally {
      setLoad(false);
      setRef(false);
    }
  };
  useEffect(() => {
    fetchData(period);
  }, []);
  const handlePeriod = (days) => {
    setPeriod(days);
    fetchData(days, false);
  };
  if (loading) {
    return <div style={{ fontFamily: "'Sora',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.pageBg }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <svg style={{ width: 28, height: 28, animation: "spin 1s linear infinite", color: C.blue }} fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" style={{ opacity: 0.25 }} />
            <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" style={{ opacity: 0.75 }} />
          </svg>
          <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, color: C.textMuted, margin: 0 }}>Loading reports…</p>
        </div>
      </div>;
  }
  if (!data) return null;
  const s = data.summary;
  const apiDataReliable = s.successful_calls >= s.total_orders;
  const handledCalls = Math.max(s.successful_calls, s.total_orders);
  const failedCalls = Math.max(0, s.total_calls - handledCalls);
  const successRate = s.total_calls > 0 ? Math.round(handledCalls / s.total_calls * 100) : 0;
  const convRate = s.total_calls > 0 ? Math.round(s.total_orders / s.total_calls * 100) : 0;
  const totalCallers = s.new_callers + s.repeat_callers;
  const returnRate = totalCallers > 0 ? Math.round(s.repeat_callers / totalCallers * 100) : 0;
  const avgMin = s.total_calls > 0 ? (s.total_minutes / s.total_calls).toFixed(1) : "0";
  const successColor = successRate >= 80 ? C.blue : successRate >= 55 ? C.gold : C.blue;
  const successBg = successRate >= 80 ? C.blueBg : successRate >= 55 ? C.goldBg : C.blueBg;
  const successBdr = successRate >= 80 ? C.blueBdr : successRate >= 55 ? C.goldBdr : C.blueBdr;
  return <div style={{ fontFamily: "'Sora',sans-serif", WebkitFontSmoothing: "antialiased", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: C.pageBg }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .rp-period-btn {
          font-family:'Sora',sans-serif; font-size:11px; font-weight:600;
          border-radius:6px; padding:4px 11px; cursor:pointer;
          border:none; transition:all .15s; white-space:nowrap;
        }
        .rp-period-btn.active  { background:${C.card}; color:${C.text}; box-shadow:0 1px 3px rgba(0,0,0,.1); border:1px solid ${C.border}; }
        .rp-period-btn:not(.active) { background:transparent; color:${C.textMuted}; border:1px solid transparent; }
        .rp-period-btn:not(.active):hover { background:${C.inputBg}; color:${C.textSub}; }
        .rp-card { background:${C.card}; border:1px solid ${C.border}; border-radius:14px; padding:20px; box-shadow:0 1px 8px rgba(0,0,0,.05); }
      `}</style>

      <div style={{ background: C.topBar, borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 8px rgba(0,0,0,.05)", flexShrink: 0, padding: "11px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: C.text, margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
            <TrendingUp size={15} style={{ color: C.blue }} /> Analytics
          </h1>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, color: C.textMuted }}>
            {data.period_days === 1 ? "Today" : `Last ${data.period_days} days`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 2, background: C.inputBg, borderRadius: 8, padding: "3px", border: `1px solid ${C.borderFaint}` }}>
            {PERIODS.map((p) => <button key={p.days} onClick={() => handlePeriod(p.days)} className={`rp-period-btn${period === p.days ? " active" : ""}`}>
                {p.label}
              </button>)}
          </div>
          <button
    onClick={() => fetchData(period, true)}
    disabled={refresh}
    style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 7px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.card, color: C.textMuted, cursor: "pointer", opacity: refresh ? 0.5 : 1, transition: "opacity .15s" }}
  >
            <RefreshCw size={13} style={{ animation: refresh ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

        {!apiDataReliable && s.total_calls > 0 && <div style={{
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    background: C.goldBg,
    border: `1px solid ${C.goldBdr}`,
    borderRadius: 12,
    padding: "12px 16px",
    animation: "fadeIn .3s both"
  }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <div>
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: C.gold, margin: "0 0 3px" }}>
                Data inconsistency detected
              </p>
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, color: C.textSub, margin: 0, lineHeight: 1.55 }}>
                The API reports <strong>{s.successful_calls} successful calls</strong> but <strong>{s.total_orders} orders were placed</strong> — a logical impossibility, since an order requires a handled call.
                This means the <code>successful_calls</code> field is not being populated correctly on the backend.
                Success rate and missed-call counts below are estimated using <strong>orders as the minimum floor</strong> for handled calls.
              </p>
            </div>
          </div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 12 }}>
          <KpiCard
    label="Calls Received"
    value={s.total_calls}
    icon={<Phone size={15} />}
    color={C.blue}
    bg={C.blueBg}
    bdr={C.blueBdr}
    delay={0}
    sub={`${handledCalls} handled`}
  />
          <KpiCard
    label="Missed / Failed"
    value={failedCalls}
    icon={<PhoneCall size={15} />}
    color={failedCalls > 0 ? C.blue : C.textSub}
    bg={failedCalls > 0 ? C.blueBg : C.inputBg}
    bdr={failedCalls > 0 ? C.blueBdr : C.border}
    delay={0.04}
    sub={failedCalls > 0 ? `of ${s.total_calls} total` : "none missed"}
  />
          <KpiCard
    label="Orders Received"
    value={s.total_orders}
    icon={<ShoppingBag size={15} />}
    color={C.blue}
    bg={C.blueBg}
    bdr={C.blueBdr}
    delay={0.08}
    sub={`${convRate}% of calls`}
  />
          <KpiCard
    label="Success Rate"
    value={`${successRate}%`}
    icon={<PhoneCall size={15} />}
    color={successColor}
    bg={successBg}
    bdr={successBdr}
    delay={0.12}
    sub={`${handledCalls} / ${s.total_calls} calls`}
  />
          <KpiCard
    label="Conversion Rate"
    value={`${convRate}%`}
    icon={<TrendingUp size={15} />}
    color={C.blue}
    bg={C.blueBg}
    bdr={C.blueBdr}
    delay={0.16}
    sub="calls → orders"
  />
          <KpiCard
    label="AI Minutes"
    value={s.total_minutes.toFixed(0)}
    icon={<Clock size={15} />}
    color={C.blue}
    bg={C.blueBg}
    bdr={C.blueBdr}
    delay={0.2}
    sub={`~${avgMin} min / call`}
  />
          <KpiCard
    label="Return Rate"
    value={`${returnRate}%`}
    icon={<Star size={15} />}
    color={returnRate >= 30 ? C.blue : C.textSub}
    bg={returnRate >= 30 ? C.blueBg : C.inputBg}
    bdr={returnRate >= 30 ? C.blueBdr : C.border}
    delay={0.24}
    sub={`${s.repeat_callers} repeat callers`}
  />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, animation: "fadeUp .4s .18s both" }}>
          <div className="rp-card">
            <SectionHeader icon={<Phone size={14} />} title="Calls Over Time" sub={`${data.calls_over_time.reduce((a, d) => a + d.calls, 0)} total`} />
            <LineChart color={C.blue} label="calls" data={data.calls_over_time.map((d) => ({ date: d.date, value: d.calls }))} />
          </div>
          <div className="rp-card">
            <SectionHeader icon={<ShoppingBag size={14} />} title="Orders Over Time" sub={`${data.orders_over_time.reduce((a, d) => a + d.orders, 0)} total`} />
            <LineChart color={C.blue} label="orders" data={data.orders_over_time.map((d) => ({ date: d.date, value: d.orders }))} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, animation: "fadeUp .4s .28s both" }}>

          
          <div className="rp-card">
            <SectionHeader icon={<PhoneCall size={14} />} title="Call Performance" />
            <div style={{ display: "flex", gap: 12, justifyContent: "space-around", marginBottom: 16 }}>
              <RingProgress pct={successRate} color={successColor} label="Success" value={`${successRate}%`} />
              <RingProgress pct={convRate} color={C.blue} label="Conversion" value={`${convRate}%`} />
              <RingProgress pct={returnRate} color={C.blue} label="Return" value={`${returnRate}%`} />
            </div>
            <StatRow label="Successful" value={s.successful_calls} color={C.blue} />
            <StatRow label="Failed / Missed" value={failedCalls} color={failedCalls > 0 ? C.blue : C.textMuted} />
            <StatRow label="Total Calls" value={s.total_calls} />
            <StatRow label="Avg Duration" value={`${avgMin} min`} />
          </div>

          
          <div className="rp-card">
            <SectionHeader icon={<Star size={14} />} title="Caller Sentiment" />
            {Object.keys(data.sentiment_breakdown).length > 0 ? <DonutChart
    data={data.sentiment_breakdown}
    colors={{ Positive: C.blue, Happy: C.blue, Neutral: "#94a3b8", Negative: C.blue, Frustrated: C.blue }}
    centerLabel="calls"
  /> : <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, color: C.textMuted, textAlign: "center", padding: "28px 0" }}>
                No sentiment data yet
              </p>}
          </div>

          
          <div className="rp-card">
            <SectionHeader icon={<ShoppingBag size={14} />} title="Order Types" />
            <HBar items={[
    { label: "Pickup", value: s.order_type_distribution.pickup, total: s.total_orders, color: C.blue, icon: <Store size={12} /> },
    { label: "Delivery", value: s.order_type_distribution.delivery, total: s.total_orders, color: C.blue, icon: <Truck size={12} /> }
  ]} />
            <div style={{ marginTop: 18 }}>
              <StatRow label="Total Orders" value={s.total_orders} />
              <StatRow label="Conversion Rate" value={`${convRate}%`} color={C.blue} />
            </div>
          </div>

          
          <div className="rp-card" style={{ gridColumn: "1 / -1", display: "flex", gap: 32, alignItems: "flex-start" }}>
            <div style={{ flexShrink: 0 }}>
              <SectionHeader icon={<Users size={14} />} title="Customer Mix" />
              {totalCallers > 0 ? <DonutChart
    data={{ "New": s.new_callers, "Returning": s.repeat_callers }}
    colors={{ New: C.blue, Returning: C.blue }}
    centerLabel="callers"
  /> : <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, color: C.textMuted, textAlign: "center", padding: "28px 0" }}>
                  No caller data yet
                </p>}
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 8px" }}>Breakdown</p>
              <StatRow label="New Callers" value={s.new_callers} color={C.blue} />
              <StatRow label="Returning Callers" value={s.repeat_callers} color={C.blue} />
              <StatRow label="Return Rate" value={`${returnRate}%`} color={returnRate >= 30 ? C.blue : C.textMuted} />
              <StatRow label="Total Unique Callers" value={totalCallers} />
            </div>
          </div>

        </div>


        {data.top_repeat_callers.length > 0 && <div className="rp-card" style={{ animation: "fadeUp .4s .38s both" }}>
            <SectionHeader
    icon={<Users size={14} />}
    title="Top Repeat Callers"
    sub={`${data.top_repeat_callers.length} caller${data.top_repeat_callers.length !== 1 ? "s" : ""}`}
  />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {data.top_repeat_callers.map((caller, i) => <div
    key={i}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 13px",
      background: C.pageBg,
      borderRadius: 11,
      border: `1px solid ${C.borderFaint}`,
      transition: "box-shadow .15s, border-color .15s"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.07)";
      e.currentTarget.style.borderColor = C.blueBdr;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = C.borderFaint;
    }}
  >
                  <div style={{
    width: 32,
    height: 32,
    borderRadius: "50%",
    flexShrink: 0,
    background: C.blueBg,
    border: `1.5px solid ${C.blueBdr}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}>
                    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 800, color: C.blue }}>
                      {i + 1}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: C.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {caller.name !== "Unknown" ? caller.name : caller.phone}
                    </p>
                    <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, color: C.textMuted, margin: 0 }}>
                      {caller.phone}
                    </p>
                  </div>
                  <span style={{
    fontFamily: "'Sora',sans-serif",
    fontSize: 12,
    fontWeight: 800,
    background: C.blueBg,
    color: C.blue,
    border: `1px solid ${C.blueBdr}`,
    borderRadius: 8,
    padding: "3px 10px",
    flexShrink: 0
  }}>
                    {caller.call_count}×
                  </span>
                </div>)}
            </div>
          </div>}

      </div>
    </div>;
}
export {
  Report as default
};

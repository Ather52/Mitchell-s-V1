import { Loader2 } from "lucide-react";
import { C, BRAND } from "../../theme/colors";

export { C, BRAND };

export const spinStyle = { animation: "spin 1s linear infinite" };

export function Btn({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  type = "button",
  ...props
}) {
  const variants = {
    primary: {
      background: C.blue,
      color: "#fff",
      border: "none",
      padding: "8px 14px",
    },
    secondary: {
      background: C.card,
      color: C.textSub,
      border: `1px solid ${C.border}`,
      padding: "8px 14px",
    },
    success: {
      background: C.blue,
      color: "#fff",
      border: "none",
      padding: "8px 16px",
    },
    ghost: {
      background: "none",
      color: C.textMuted,
      border: "none",
      padding: 8,
    },
    danger: {
      background: "none",
      color: C.blue,
      border: "none",
      padding: 4,
    },
    link: {
      background: C.blueBg,
      color: C.blue,
      border: "none",
      padding: "5px 10px",
      fontSize: ".75rem",
    },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      {...props}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 10,
        fontWeight: 700,
        fontSize: ".8rem",
        fontFamily: "'Sora', sans-serif",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.65 : 1,
        ...v,
        ...style,
      }}
    >
      {loading && <Loader2 size={14} style={spinStyle} />}
      {children}
    </button>
  );
}

export function formatDuration(ms) {
  if (!ms) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export const STATUS_COLORS = {
  registered: { bg: C.blueBg, color: C.blue },
  ongoing: { bg: C.goldBg, color: C.gold },
  ended: { bg: C.blueBg, color: C.blue },
  completed: { bg: C.blueBg, color: C.blue },
  failed: { bg: C.blueBg, color: C.blue },
  pending: { bg: C.blueBg, color: C.blue },
  calling: { bg: C.goldBg, color: C.gold },
  draft: { bg: C.blueBg, color: C.blue },
  active: { bg: C.blueBg, color: C.blue },
  paused: { bg: C.goldBg, color: C.gold },
};

const STATUS_LABELS = {
  registered: "Dialing",
  ongoing: "In Progress",
  ended: "Completed",
  completed: "Completed",
  failed: "Failed",
  pending: "Pending",
  calling: "Calling",
  draft: "Draft",
  active: "Active",
  paused: "Paused",
};

export function StatusBadge({ status }) {
  const key = (status || "").toLowerCase();
  const s = STATUS_COLORS[key] || { bg: C.blueBg, color: C.blue };
  const label = STATUS_LABELS[key] || status;
  return (
    <span
      style={{
        fontSize: ".7rem",
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 100,
        background: s.bg,
        color: s.color,
      }}
    >
      {label}
    </span>
  );
}

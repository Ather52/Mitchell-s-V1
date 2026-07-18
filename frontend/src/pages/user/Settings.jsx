import { useEffect, useRef, useState } from "react";
import {
  Clock,
  Mic,
  Zap,
  Volume2,
  PhoneCall,
  Save,
  Store,
  AlertCircle,
  MessageSquare,
  Play,
  Pause,
  Building2,
  Radio,
  Plus,
  Phone,
  Upload,
  Bell,
  Link2,
  Info,
  Search,
  Trash2,
  Edit2,
  Check
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getSettingsApi,
  updateSettingsApi,
  getVoicesApi,
  createPromptApi,
  getPromptsApi,
  updatePromptApi,
  activatePromptApi,
  deletePromptApi
} from "../../api/api";
import { C as themeC } from "../../theme/colors";

const C = {
  ...themeC,
  purpleBg: "#F0EFFC",
  purpleRing: "rgba(42,91,168,0.14)",
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const PAKISTAN_TIMEZONES = [
  { value: "Asia/Karachi", label: "Pakistan Standard Time (PKT) \u2014 Karachi, Islamabad, Lahore" }
];
const WAIT_OPTIONS = [
  "5 min",
  "10 min",
  "15 min",
  "20 min",
  "25 min",
  "30 min",
  "35 min",
  "40 min",
  "45 min",
  "60 min",
  "75 min",
  "90 min"
];
const INTEGRATIONS = [
  { name: "Order Sync", desc: "Sync orders and products to your fulfillment system" },
  { name: "Calendly", desc: "Manage consultations and meeting slots" },
  { name: "DoorDash Drive", desc: "Dispatch deliveries through DoorDash fleet" },
  { name: "Stripe", desc: "Payment processing and digital receipts" },
];
const SMS_ITEMS = [
  { label: "Order confirmed", desc: "Text the customer when their order is accepted" },
  { label: "Sync failure alert", desc: "Notify the manager if an order fails to push" },
  { label: "Daily digest", desc: "Morning summary of calls and orders to manager" }
];
const SECTIONS = [
  { id: "store", label: "Company", icon: <Building2 size={15} />, desc: "Identity & locations" },
  { id: "hours", label: "Hours", icon: <Clock size={15} />, desc: "Office & warehouse schedule" },
  { id: "voice", label: "Voice & AI", icon: <Mic size={15} />, desc: "Agent voice & behavior" },
  { id: "greetings", label: "Greetings", icon: <MessageSquare size={15} />, desc: "Open & closed messages" },
  { id: "prompts", label: "System Prompts", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>, desc: "AI behavioral rules" },
  { id: "phone", label: "Phone", icon: <PhoneCall size={15} />, desc: "Number & call routing" },
  { id: "integrations", label: "Integrations", icon: <Link2 size={15} />, desc: "Platform links" }
];
const CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes ldot   { 0%,100%{box-shadow:0 0 0 0 rgba(29,184,122,.45)} 50%{box-shadow:0 0 0 5px rgba(29,184,122,0)} }
  @keyframes secIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

  .vx-st * { box-sizing: border-box; }

  .vx-st input, .vx-st textarea, .vx-st select {
    font-family:'Sora',sans-serif; font-size:.875rem; color:${C.text};
    background:${C.white}; border:1.5px solid ${C.border}; border-radius:10px;
    padding:10px 13px; outline:none; width:100%;
    transition:border-color .18s, box-shadow .18s;
    -webkit-appearance:none; appearance:none;
  }
  .vx-st input:focus, .vx-st textarea:focus, .vx-st select:focus {
    border-color:${C.blueLight}; background:#FDFCFF; box-shadow:0 0 0 3px ${C.blueRing};
  }
  .vx-st input::placeholder, .vx-st textarea::placeholder { color:${C.textLight}; }
  .vx-st textarea { resize:vertical; line-height:1.65; }
  .vx-st select {
    padding-right:34px; cursor:pointer;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238888A8' stroke-width='2.2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 12px center;
  }
  .vx-st input[type="time"] { cursor:pointer; }
  .vx-st input[type="time"]::-webkit-calendar-picker-indicator { opacity:.45; cursor:pointer; }
  .vx-st input[type="search"]::-webkit-search-cancel-button { opacity:.5; cursor:pointer; }
  .vx-st input:disabled, .vx-st textarea:disabled, .vx-st select:disabled {
    background:${C.bg}; color:${C.textMuted}; cursor:not-allowed; opacity:.7; border-style:dashed;
  }
  .vx-st input[type="range"] {
    -webkit-appearance:none; appearance:none; background:transparent; cursor:pointer; padding:0; border:none; box-shadow:none;
  }
  .vx-st input[type="range"]:focus { box-shadow:none; border:none; background:transparent; }
  .vx-st input[type="range"]::-webkit-slider-runnable-track { height:6px; border-radius:6px; background:${C.border}; }
  .vx-st input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance:none; width:18px; height:18px; border-radius:50%;
    background:${C.blue}; border:2.5px solid #fff; box-shadow:0 1px 6px rgba(27,63,122,.38); margin-top:-6px; cursor:pointer;
  }

  .vx-iw { position:relative; display:flex; align-items:center; }
  .vx-iw svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); pointer-events:none; color:${C.textMuted}; z-index:1; flex-shrink:0; }
  .vx-iw input, .vx-iw select { padding-left:36px !important; }

  .vx-save:hover:not(:disabled) { filter:brightness(1.09); transform:translateY(-1px); box-shadow:0 8px 26px rgba(27,63,122,.38) !important; }
  .vx-save:disabled { opacity:.45; cursor:not-allowed; }

  .vx-card { transition:box-shadow .2s; }
  .vx-card:hover { box-shadow:0 4px 22px rgba(15,15,26,.07) !important; }

  .vx-vc:hover { border-color:${C.blueLight} !important; background:rgba(42,91,168,.03) !important; }

  .vx-nav-item {
    display:inline-flex; align-items:center; gap:7px;
    padding:0 15px; height:44px; flex-shrink:0;
    border:none; border-bottom:2.5px solid transparent;
    background:transparent; cursor:pointer;
    transition:border-color .14s, background .14s;
    position:relative; margin-bottom:-1.5px;
  }
  .vx-nav-item:hover:not(.vx-nav-on) { background:rgba(27,63,122,.045); }
  .vx-nav-on { border-bottom-color:${C.blue} !important; background:rgba(27,63,122,.04) !important; }
  .vx-nav-icon {
    width:20px; height:20px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    color:${C.textMuted}; transition:color .14s;
  }
  .vx-nav-on .vx-nav-icon { color:${C.blue}; }

  .vx-st .vx-ts {
    font-family:'Sora',sans-serif; font-size:.73rem; color:${C.text};
    background-color:${C.white}; border:1.5px solid ${C.border}; border-radius:8px;
    padding:5px 24px 5px 9px; outline:none; cursor:pointer; flex:1; min-width:0; width:auto;
    -webkit-appearance:none; appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238888A8' stroke-width='2.2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 7px center;
    transition:border-color .18s, box-shadow .18s;
  }
  .vx-st .vx-ts:focus {
    border-color:${C.blueLight}; background-color:#FDFCFF; box-shadow:0 0 0 3px ${C.blueRing};
  }

  .vx-conn:hover { border-color:${C.blueLight} !important; color:${C.blue} !important; }

  .vx-sec { animation:secIn .26s cubic-bezier(.22,1,.36,1) both; }

  .vx-g2  { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .vx-g3  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
  .vx-g2s { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .vx-sg  { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

  .vx-layout { display:flex; flex-direction:column; flex:1; overflow:hidden; }
  .vx-sidebar {
    width:100%; flex-shrink:0;
    background:${C.white}; border-bottom:1.5px solid ${C.border};
    display:flex; flex-direction:row; align-items:stretch;
    overflow-x:auto; overflow-y:hidden; padding:0 16px;
    -webkit-overflow-scrolling:touch; scrollbar-width:none;
  }
  .vx-sidebar::-webkit-scrollbar { display:none; }
  .vx-main { flex:1; overflow-y:auto; padding:24px 28px 48px; }

  @media (max-width:768px) {
    .vx-main { padding:18px 18px 40px; }
    .vx-nav-item { padding:0 11px; }
  }

  @media (max-width:640px) {
    .vx-sidebar { padding:0 8px; }
    .vx-nav-item { padding:0 9px; gap:5px; height:40px; }
    .vx-nav-label-txt { font-size:.7rem !important; }
    .vx-main { padding:14px 14px 40px; }
    .vx-g2, .vx-g2s, .vx-g3, .vx-sg { grid-template-columns:1fr !important; gap:12px; }
  }

  @media (max-width:480px) {
    .vx-topbar { padding:0 14px !important; }
    .vx-topbar-meta { display:none; }
    .vx-nav-icon { display:none; }
  }
`;
const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = h.toString().padStart(2, "0");
      const mm = m === 0 ? "00" : "30";
      const period = h < 12 ? "AM" : "PM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      opts.push({ value: `${hh}:${mm}`, label: `${h12}:${mm} ${period}` });
    }
  }
  return opts;
})();
function buildDefaultSchedule(open, close) {
  return DAY_KEYS.reduce((acc, day) => {
    acc[day] = { open: open || "11:00", close: close || "22:00", closed: false };
    return acc;
  }, {});
}
function Field({ label, hint, children, optional }) {
  return <div>
      {label && <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <label style={{ fontFamily: C.font, fontSize: ".74rem", fontWeight: 700, color: C.textSub, letterSpacing: ".015em" }}>
            {label}
          </label>
          {optional && <span style={{ fontFamily: C.font, fontSize: ".61rem", fontWeight: 600, color: C.textLight, background: C.borderFaint, padding: "1px 6px", borderRadius: 4 }}>
              optional
            </span>}
        </div>}
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontFamily: C.font, fontSize: ".71rem", color: C.textMuted, lineHeight: 1.5 }}>{hint}</p>}
    </div>;
}
function PlannedBadge() {
  return <span style={{ fontFamily: C.font, fontSize: ".6rem", fontWeight: 700, letterSpacing: ".05em", padding: "2px 7px", borderRadius: 100, background: C.blueBg, color: C.blueLight }}>
      Planned
    </span>;
}
function InfoNote({ children }) {
  return <div style={{ display: "flex", gap: 9, padding: "11px 13px", borderRadius: 9, background: "rgba(27,63,122,.05)", border: `1px solid rgba(42,91,168,.14)` }}>
      <Info size={12} style={{ color: C.blueLight, flexShrink: 0, marginTop: 1 }} />
      <p style={{ margin: 0, fontFamily: C.font, fontSize: ".73rem", color: C.textSub, lineHeight: 1.58 }}>{children}</p>
    </div>;
}
function Card({ children, delay = 0, faded }) {
  return <div className="vx-card" style={{
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    boxShadow: "0 1px 4px rgba(15,15,26,.04)",
    animation: `fadeUp .38s cubic-bezier(.22,1,.36,1) ${delay}s both`,
    opacity: faded ? 0.5 : 1,
    pointerEvents: faded ? "none" : void 0,
    overflow: "hidden"
  }}>
      {children}
    </div>;
}
function CardHeader({ title, subtitle, icon, action, badge }) {
  return <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: `1px solid ${C.border}`,
    flexWrap: "wrap",
    gap: 8
  }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: C.blueBg, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </span>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontFamily: C.font, fontSize: ".86rem", fontWeight: 800, color: C.text, letterSpacing: "-.018em" }}>{title}</span>
            {badge}
          </div>
          {subtitle && <p style={{ margin: "2px 0 0", fontFamily: C.font, fontSize: ".71rem", color: C.textMuted }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>;
}
function SectionDivider({ label }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "2px 0" }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontFamily: C.font, fontSize: ".61rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: C.textLight, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>;
}
function CardBody({ children, gap = 16 }) {
  return <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap }}>{children}</div>;
}
function TimeSelect({ value, onChange }) {
  return <div className="vx-iw">
      <Clock size={12} />
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>;
}
function TimezoneSelect({ value, onChange }) {
  const isKnown = PAKISTAN_TIMEZONES.some((tz) => tz.value === value);
  return <div className="vx-iw">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
      <select value={isKnown ? value : ""} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>Select timezone…</option>
        <optgroup label="Pakistan">
          {PAKISTAN_TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
        </optgroup>
        {!isKnown && value && <optgroup label="Current"><option value={value}>{value}</option></optgroup>}
      </select>
    </div>;
}
function WaitTimeSelect({ value, onChange, placeholder }) {
  const isPreset = WAIT_OPTIONS.includes(value);
  return <div className="vx-iw">
      <Clock size={12} />
      <select value={isPreset ? value : ""} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>{placeholder}</option>
        {WAIT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        {value && !isPreset && <option value={value}>{value}</option>}
      </select>
    </div>;
}
function Slider({ label, sublabel, icon, value, min = 0, max = 1, step = 0.05, onChange }) {
  const pct = (value - min) / (max - min) * 100;
  return <div style={{ padding: "13px 14px", background: C.bg, borderRadius: 11, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ color: C.blueLight, display: "flex" }}>{icon}</span>
          <div>
            <p style={{ margin: 0, fontFamily: C.font, fontSize: ".79rem", fontWeight: 700, color: C.text }}>{label}</p>
            {sublabel && <p style={{ margin: 0, fontFamily: C.font, fontSize: ".67rem", color: C.textMuted }}>{sublabel}</p>}
          </div>
        </div>
        <span style={{ fontFamily: C.font, fontSize: ".74rem", fontWeight: 800, color: C.blue, background: C.blueBg, padding: "2px 9px", borderRadius: 6, minWidth: 40, textAlign: "center" }}>
          {value.toFixed(2)}
        </span>
      </div>
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", height: 5, background: C.border, borderRadius: 5, overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${C.blue},${C.blueLight})`, borderRadius: 5 }} />
        </div>
        <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={(e) => onChange(parseFloat(e.target.value))}
    style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%", zIndex: 2 }}
  />
        <div style={{
    position: "absolute",
    width: 17,
    height: 17,
    borderRadius: "50%",
    background: C.blue,
    border: "2.5px solid #fff",
    boxShadow: "0 1px 5px rgba(27,63,122,.4)",
    left: `calc(${pct}% - 8.5px)`,
    pointerEvents: "none"
  }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontFamily: C.font, fontSize: ".63rem", color: C.textLight }}>{min}</span>
        <span style={{ fontFamily: C.font, fontSize: ".63rem", color: C.textLight }}>{max}</span>
      </div>
    </div>;
}
function VoiceCard({ voice, selected, onSelect }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const togglePlay = (e) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
    }
  };
  return <div className="vx-vc" onClick={onSelect} style={{
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "10px 13px",
    borderRadius: 10,
    cursor: "pointer",
    border: `1.5px solid ${selected ? C.blue : C.border}`,
    background: selected ? "rgba(27,63,122,.05)" : C.white,
    transition: "border-color .15s, background .15s",
    position: "relative"
  }}>
      {selected && <div style={{ position: "absolute", top: 9, right: 9, width: 6, height: 6, borderRadius: "50%", background: C.blue }} />}
      <div style={{
    width: 36,
    height: 36,
    borderRadius: "50%",
    flexShrink: 0,
    background: selected ? C.blue : C.blueBg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: C.font,
    fontSize: ".85rem",
    fontWeight: 800,
    color: selected ? "#fff" : C.blueLight
  }}>{voice.voice_name[0]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontFamily: C.font, fontSize: ".81rem", fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{voice.voice_name}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, flexWrap: "wrap" }}>
          <span style={{
    fontFamily: C.font,
    fontSize: ".63rem",
    fontWeight: 700,
    padding: "1px 6px",
    borderRadius: 100,
    textTransform: "capitalize",
    background: voice.gender === "female" ? "rgba(236,72,153,.08)" : "rgba(59,130,246,.08)",
    color: voice.gender === "female" ? "#be185d" : "#1d4ed8",
    border: `1px solid ${voice.gender === "female" ? "rgba(236,72,153,.2)" : "rgba(59,130,246,.2)"}`
  }}>{voice.gender}</span>
          <span style={{ fontFamily: C.font, fontSize: ".69rem", color: C.textMuted }}>{voice.accent} · {voice.age}</span>
        </div>
      </div>
      <button onClick={togglePlay} style={{
    width: 30,
    height: 30,
    borderRadius: "50%",
    flexShrink: 0,
    border: "none",
    cursor: "pointer",
    background: playing ? C.blue : C.blueBg,
    color: playing ? "#fff" : C.blueLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background .15s"
  }}>
        {playing ? <Pause size={10} /> : <Play size={10} style={{ marginLeft: 1 }} />}
      </button>
      <audio ref={audioRef} src={voice.preview_audio_url} onEnded={() => setPlaying(false)} />
    </div>;
}
function WeeklyScheduleEditor({ value, onChange, defaultOpen, defaultClose }) {
  const effective = value ?? buildDefaultSchedule(defaultOpen, defaultClose);
  const updDay = (day, field, val) => onChange({ ...effective, [day]: { ...effective[day], [field]: val } });
  return <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      {DAY_KEYS.map((day, i) => {
    const d = effective[day] ?? { open: defaultOpen || "11:00", close: defaultClose || "22:00", closed: false };
    return <div key={day} style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 13px",
      borderBottom: i < DAY_KEYS.length - 1 ? `1px solid ${C.borderFaint}` : "none",
      background: i % 2 === 0 ? C.white : "rgba(248,248,252,.5)"
    }}>
            <span style={{ fontFamily: C.font, fontSize: ".72rem", fontWeight: 700, color: C.text, width: 28, flexShrink: 0 }}>
              {DAYS[i].slice(0, 3)}
            </span>
            <button
      onClick={() => updDay(day, "closed", !d.closed)}
      style={{
        position: "relative",
        width: 30,
        height: 17,
        borderRadius: 9,
        border: "none",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        background: d.closed ? C.border : C.blue,
        transition: "background .18s"
      }}
    >
              <span style={{
      position: "absolute",
      top: 1.5,
      width: 14,
      height: 14,
      borderRadius: "50%",
      background: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,.18)",
      left: d.closed ? 2 : 14,
      transition: "left .18s"
    }} />
            </button>
            {d.closed ? <span style={{ fontFamily: C.font, fontSize: ".7rem", color: C.textLight, flex: 1, fontStyle: "italic" }}>Closed</span> : <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                <select className="vx-ts" value={d.open} onChange={(e) => updDay(day, "open", e.target.value)}>
                  {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <span style={{ fontFamily: C.font, fontSize: ".68rem", color: C.textLight, flexShrink: 0 }}>–</span>
                <select className="vx-ts" value={d.close} onChange={(e) => updDay(day, "close", e.target.value)}>
                  {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>}
          </div>;
  })}
    </div>;
}
function ToggleRow({ label, desc, checked, onChange }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "11px 0" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontFamily: C.font, fontSize: ".81rem", fontWeight: 700, color: C.text }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontFamily: C.font, fontSize: ".71rem", color: C.textMuted }}>{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)} style={{
    position: "relative",
    width: 40,
    height: 22,
    borderRadius: 11,
    border: "none",
    cursor: "pointer",
    background: checked ? C.blue : C.border,
    transition: "background .2s",
    padding: 0,
    flexShrink: 0
  }}>
        <span style={{ position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)", left: checked ? 21 : 3, transition: "left .2s" }} />
      </button>
    </div>;
}
function KnowledgeBase() {
  const [drag, setDrag] = useState(false);
  return <div
    onDragOver={(e) => {
      e.preventDefault();
      setDrag(true);
    }}
    onDragLeave={() => setDrag(false)}
    onDrop={(e) => {
      e.preventDefault();
      setDrag(false);
      toast("Knowledge base uploads coming soon");
    }}
    onClick={() => toast("Knowledge base uploads coming soon")}
    style={{
      border: `2px dashed ${drag ? C.blue : C.border}`,
      borderRadius: 11,
      padding: "22px 18px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 9,
      background: drag ? "rgba(27,63,122,.04)" : C.bg,
      cursor: "pointer",
      transition: "border-color .15s, background .15s"
    }}
  >
      <div style={{ width: 40, height: 40, borderRadius: 11, background: drag ? C.blue : C.blueBg, color: drag ? "#fff" : C.blueLight, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .15s" }}>
        <Upload size={17} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontFamily: C.font, fontSize: ".83rem", fontWeight: 700, color: C.text }}>Drop files here or click to browse</p>
        <p style={{ margin: "3px 0 0", fontFamily: C.font, fontSize: ".71rem", color: C.textMuted, lineHeight: 1.5 }}>
          Product catalogs, shipping terms, pricing agreements — referenced during calls
        </p>
      </div>
      <PlannedBadge />
    </div>;
}
function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [voices, setVoices] = useState([]);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeSection, setActiveSection] = useState("store");
  const [voiceSearch, setVoiceSearch] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptText, setNewPromptText] = useState("");
  const [promptSaving, setPromptSaving] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editText, setEditText] = useState("");
  const [expandedPromptId, setExpandedPromptId] = useState(null);
  const upd = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, vr] = await Promise.all([getSettingsApi(), getVoicesApi()]);
        setSettings(s);
        setVoices(vr.voices);
        setForm({
          voice_id: s.voice_id,
          voice_speed: s.voice_speed,
          voice_temperature: s.voice_temperature,
          interruption_sensitivity: s.interruption_sensitivity,
          responsiveness: s.responsiveness,
          is_active: s.is_active,
          kitchen_open_time: s.kitchen_open_time,
          kitchen_close_time: s.kitchen_close_time,
          store_open_time: s.store_open_time,
          store_close_time: s.store_close_time,
          closed_greeting: s.closed_greeting,
          open_greeting: s.open_greeting ?? "",
          restaurant_timezone: s.restaurant_timezone,
          prompt_instructions: s.prompt_instructions ?? "",
          delivery_address: s.delivery_address ?? "",
          pickup_address: s.pickup_address ?? "",
          restaurant_name: s.restaurant_name ?? "",
          restaurant_info: s.restaurant_info ?? "",
          wait_time_pickup: s.wait_time_pickup ?? "",
          wait_time_delivery: s.wait_time_delivery ?? "",
          store_hours: s.store_hours ?? buildDefaultSchedule(s.store_open_time, s.store_close_time),
          kitchen_hours: s.kitchen_hours ?? buildDefaultSchedule(s.kitchen_open_time, s.kitchen_close_time)
        });
        setPrompts(await getPromptsApi());
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettingsApi(form);
      const fresh = await getSettingsApi();
      setSettings(fresh);
      setDirty(false);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };
  const refreshPrompts = async () => setPrompts(await getPromptsApi());
  const handleCreatePrompt = async () => {
    if (!newPromptName.trim() || !newPromptText.trim()) {
      toast.error("Enter a name and text");
      return;
    }
    setPromptSaving(true);
    try {
      await createPromptApi({ name: newPromptName, text: newPromptText });
      await refreshPrompts();
      toast.success("Prompt created");
      setIsCreatingPrompt(false);
      setNewPromptName("");
      setNewPromptText("");
    } catch {
      toast.error("Failed to create prompt");
    } finally {
      setPromptSaving(false);
    }
  };
  const handleActivatePrompt = async (id) => {
    try {
      const activated = await activatePromptApi(id);
      setForm((p) => ({ ...p, prompt_instructions: activated.text }));
      setDirty(false);
      await refreshPrompts();
      toast.success("Prompt activated and synced to agent");
    } catch {
      toast.error("Failed to activate prompt");
    }
  };
  const handleSaveEdit = async (id) => {
    setPromptSaving(true);
    try {
      const updates = {};
      if (editName.trim()) updates.name = editName.trim();
      if (editText.trim()) updates.text = editText.trim();
      await updatePromptApi(id, updates);
      await refreshPrompts();
      toast.success("Prompt updated");
      setEditingPromptId(null);
    } catch {
      toast.error("Failed to update prompt");
    } finally {
      setPromptSaving(false);
    }
  };
  const handleDeletePrompt = async (id) => {
    try {
      await deletePromptApi(id);
      await refreshPrompts();
      toast.success("Prompt deleted");
    } catch {
      toast.error("Failed to delete prompt");
    }
  };
  if (loading) {
    return <div className="vx-st" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg }}>
        <style>{CSS}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 26, height: 26, border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <p style={{ fontFamily: C.font, fontSize: ".81rem", color: C.textMuted, margin: 0 }}>Loading settings…</p>
        </div>
      </div>;
  }
  if (!settings) return null;
  const f = form;
  const filteredVoices = voices.filter(
    (v) => [v.voice_name, v.accent, v.gender].some((s) => s.toLowerCase().includes(voiceSearch.toLowerCase()))
  );
  const activeVoiceName = voices.find((v) => v.voice_id === f.voice_id)?.voice_name;
  const assignedNumber = settings.retell_live?.agent_phone_number ?? settings.retell_live?.phone_number ?? null;
  const Spinner = () => <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />;
  const StoreSection = () => <div className="vx-sec" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <CardHeader title="Company Identity" subtitle="Core details the AI uses when speaking with callers" icon={<Building2 size={14} />} />
        <CardBody>
          <div className="vx-g2">
            <Field label="Company Name">
              <input type="text" autoComplete="organization" value={f.restaurant_name ?? ""} onChange={(e) => upd("restaurant_name", e.target.value)} placeholder="e.g. Mitchell's Fruit Farms" />
            </Field>
            <Field label="Timezone">
              <TimezoneSelect value={f.restaurant_timezone ?? ""} onChange={(v) => upd("restaurant_timezone", v)} />
            </Field>
          </div>
          <Field label="Company Bio" hint="Used when callers ask what products you offer or general company details.">
            <textarea rows={3} autoComplete="off" spellCheck value={f.restaurant_info ?? ""} onChange={(e) => upd("restaurant_info", e.target.value)} placeholder="Describe your products, specialties, and general company details…" />
          </Field>
        </CardBody>
      </Card>

      <Card delay={0.05}>
        <CardHeader
    title="Fulfillment Locations"
    subtitle="Addresses read aloud when callers ask for collection or shipping details"
    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>}
  />
        <CardBody>
          <div className="vx-g2">
            <Field label="Warehouse/Pickup Address">
              <div className="vx-iw">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <input type="text" autoComplete="street-address" value={f.pickup_address ?? ""} onChange={(e) => upd("pickup_address", e.target.value)} placeholder="e.g. Renala Khurd, Okara, Punjab, Pakistan" />
              </div>
            </Field>
            <Field label="Shipping Address" optional>
              <div className="vx-iw">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <input type="text" autoComplete="street-address" value={f.delivery_address ?? ""} onChange={(e) => upd("delivery_address", e.target.value)} placeholder="Same as pickup, or a separate distribution center" />
              </div>
            </Field>
          </div>
          <InfoNote>Leave delivery address blank to use the pickup address for both.</InfoNote>
        </CardBody>
      </Card>
    </div>;
  const HoursSection = () => <div className="vx-sec" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <CardHeader title="Office Hours" subtitle="When the AI answers with an open greeting vs. a closed greeting" icon={<Clock size={14} />} />
        <CardBody>
          <InfoNote>Default hours apply when no per-day override is set. Use the schedule below to customize each day individually.</InfoNote>
          <div className="vx-g2s">
            <Field label="Default Opens"><TimeSelect value={f.store_open_time ?? ""} onChange={(v) => upd("store_open_time", v)} /></Field>
            <Field label="Default Closes"><TimeSelect value={f.store_close_time ?? ""} onChange={(v) => upd("store_close_time", v)} /></Field>
          </div>
          <SectionDivider label="Per-Day Schedule" />
          <WeeklyScheduleEditor value={f.store_hours} onChange={(v) => upd("store_hours", v)} defaultOpen={f.store_open_time ?? "11:00"} defaultClose={f.store_close_time ?? "22:00"} />
        </CardBody>
      </Card>

      <Card delay={0.06}>
        <CardHeader
    title="Fulfillment & Shipping"
    subtitle="Warehouse hours control order acceptance; fulfillment times are read aloud to callers"
    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8.56 2.9A7 7 0 0119 9v4l3 3v1H2v-1l3-3V9c0-3.1 2-5.8 4.56-6.1" /><path d="M12 22a2 2 0 002-2h-4a2 2 0 002 2" /></svg>}
  />
        <CardBody>
          <div className="vx-g2">
            <Field label="Dispatch Preparation Time">
              <WaitTimeSelect value={f.wait_time_pickup ?? ""} onChange={(v) => upd("wait_time_pickup", v)} placeholder="Select prep time…" />
            </Field>
            <Field label="Wholesale Delivery Time">
              <WaitTimeSelect value={f.wait_time_delivery ?? ""} onChange={(v) => upd("wait_time_delivery", v)} placeholder="Select delivery wait…" />
            </Field>
          </div>
          <SectionDivider label="Warehouse Operations Hours" />
          <div className="vx-g2s">
            <Field label="Warehouse Opens"><TimeSelect value={f.kitchen_open_time ?? ""} onChange={(v) => upd("kitchen_open_time", v)} /></Field>
            <Field label="Warehouse Closes"><TimeSelect value={f.kitchen_close_time ?? ""} onChange={(v) => upd("kitchen_close_time", v)} /></Field>
          </div>
          <SectionDivider label="Per-Day Warehouse Schedule" />
          <WeeklyScheduleEditor value={f.kitchen_hours} onChange={(v) => upd("kitchen_hours", v)} defaultOpen={f.kitchen_open_time ?? "11:00"} defaultClose={f.kitchen_close_time ?? "21:40"} />
        </CardBody>
      </Card>
    </div>;
  const VoiceSection = () => <div className="vx-sec" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <CardHeader title="Agent Status" subtitle="Toggle whether the AI agent answers incoming calls right now" icon={<PhoneCall size={14} />} />
        <CardBody gap={0}>
          <div style={{
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    borderRadius: 11,
    border: `1.5px solid ${f.is_active ? "#b8d4ff" : C.border}`,
    background: f.is_active ? "#e8f2ff" : C.bg,
    transition: "border-color .2s, background .2s",
    flexWrap: "wrap"
  }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: f.is_active ? "rgba(3,76,161,0.12)" : C.border, display: "flex", alignItems: "center", justifyContent: "center", color: f.is_active ? C.blue : C.textMuted, transition: "all .2s" }}>
              <PhoneCall size={19} />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <p style={{ margin: 0, fontFamily: C.font, fontSize: ".86rem", fontWeight: 800, color: C.text }}>AI Phone Agent</p>
              <p style={{ margin: "2px 0 0", fontFamily: C.font, fontSize: ".73rem", color: C.textMuted }}>
                {f.is_active ? "Live \u2014 answering all incoming calls automatically" : "Paused \u2014 calls ring without an AI answering"}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
              <button onClick={() => upd("is_active", !f.is_active)} style={{
    position: "relative",
    width: 48,
    height: 26,
    borderRadius: 13,
    border: "none",
    cursor: "pointer",
    background: f.is_active ? C.blue : C.border,
    transition: "background .2s",
    padding: 0
  }}>
                <span style={{ position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.22)", left: f.is_active ? 25 : 3, transition: "left .2s" }} />
              </button>
              <span style={{ fontFamily: C.font, fontSize: ".65rem", fontWeight: 700, color: f.is_active ? C.blue : C.textMuted }}>
                {f.is_active ? "Active" : "Paused"}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card delay={0.06}>
        <CardHeader
    title="Voice"
    subtitle="Choose the voice your callers hear — preview before selecting"
    icon={<Mic size={14} />}
    action={activeVoiceName ? <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 100, background: "linear-gradient(135deg,#1B3F7A,#2A5BA8)", flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.font, fontSize: ".62rem", fontWeight: 800, color: "#fff" }}>{activeVoiceName[0]}</div>
              <span style={{ fontFamily: C.font, fontSize: ".71rem", fontWeight: 700, color: "#fff" }}>{activeVoiceName}</span>
            </div> : void 0}
  />
        <CardBody>
          <div className="vx-iw" style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <Search size={12} />
            <input type="search" value={voiceSearch} onChange={(e) => setVoiceSearch(e.target.value)} placeholder="Search by name, accent, or gender…" style={{ background: "transparent", border: "none", boxShadow: "none", paddingLeft: 36 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto", paddingRight: 2 }}>
            {filteredVoices.length === 0 ? <p style={{ fontFamily: C.font, fontSize: ".79rem", color: C.textMuted, textAlign: "center", padding: "18px 0", margin: 0 }}>No voices match your search</p> : filteredVoices.map((v) => <VoiceCard key={v.voice_id} voice={v} selected={f.voice_id === v.voice_id} onSelect={() => upd("voice_id", v.voice_id)} />)}
          </div>
        </CardBody>
      </Card>

      <Card delay={0.12}>
        <CardHeader title="Behavior Tuning" subtitle="Fine-tune how the agent sounds and responds during calls" icon={<Zap size={14} />} />
        <CardBody>
          <div className="vx-sg">
            <Slider label="Speed" sublabel="How fast the agent speaks" icon={<Radio size={12} />} value={f.voice_speed ?? 1} min={0.5} max={2} step={0.05} onChange={(v) => upd("voice_speed", v)} />
            <Slider label="Creativity" sublabel="Response variability" icon={<Zap size={12} />} value={f.voice_temperature ?? 0.7} onChange={(v) => upd("voice_temperature", v)} />
            <Slider label="Patience" sublabel="Interruption tolerance" icon={<Volume2 size={12} />} value={f.interruption_sensitivity ?? 0.8} onChange={(v) => upd("interruption_sensitivity", v)} />
            <Slider label="Responsiveness" sublabel="Reply speed" icon={<Zap size={12} />} value={f.responsiveness ?? 1} onChange={(v) => upd("responsiveness", v)} />
          </div>
        </CardBody>
      </Card>
    </div>;
  const GreetingsSection = () => <div className="vx-sec" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <CardHeader title="Call Greetings" subtitle="The first thing the AI says when a call connects" icon={<MessageSquare size={14} />} />
        <CardBody>
          <Field label="Open Greeting" hint="Plays when your business is open. Keep it friendly and under 30 words.">
            <textarea rows={3} spellCheck value={f.open_greeting ?? ""} onChange={(e) => upd("open_greeting", e.target.value)} placeholder="Thanks for calling Mitchell's! Would you like to place a distributor order for pickup or shipping?" />
          </Field>
          <Field label="Closed Greeting" hint="Plays when the office is closed. Let callers know when to call back.">
            <textarea rows={3} spellCheck value={f.closed_greeting ?? ""} onChange={(e) => upd("closed_greeting", e.target.value)} placeholder="Thanks for calling! We're currently closed. Our office opens at 8 AM — we'd love to assist you then!" />
          </Field>
          <InfoNote>The agent continues naturally after the greeting — you don't need to ask every question up front.</InfoNote>
        </CardBody>
      </Card>

      <Card delay={0.06}>
        <CardHeader title="Knowledge Base" subtitle="Documents the AI can reference during calls" icon={<Upload size={14} />} badge={<PlannedBadge />} />
        <CardBody>
          <KnowledgeBase />
          <div className="vx-g3">
            {["PDF catalogs", "Product specs", "Policy docs", "Shipping info", "FAQ sheets", "Promo flyers"].map((type) => <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.blueLight, flexShrink: 0 }} />
                <span style={{ fontFamily: C.font, fontSize: ".71rem", fontWeight: 600, color: C.textSub }}>{type}</span>
              </div>)}
          </div>
        </CardBody>
      </Card>
    </div>;
  const PromptsSection = () => {
    const codeIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>;
    const chevron = (flipped) => <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: "transform .22s", transform: flipped ? "rotate(180deg)" : "none" }}
    >
        <path d="M6 9l6 6 6-6" />
      </svg>;
    return <div className="vx-sec" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <CardHeader
      title="System Prompts"
      subtitle="Select a prompt with the radio button to activate it — only one can be active at a time"
      icon={codeIcon}
      action={<button
        onClick={() => {
          setIsCreatingPrompt(true);
          setNewPromptName("");
          setNewPromptText("");
        }}
        disabled={isCreatingPrompt}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontFamily: C.font,
          fontSize: ".73rem",
          fontWeight: 700,
          background: "linear-gradient(135deg,#1B3F7A,#2A5BA8)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "7px 13px",
          cursor: isCreatingPrompt ? "not-allowed" : "pointer",
          opacity: isCreatingPrompt ? 0.5 : 1,
          boxShadow: "0 2px 10px rgba(27,63,122,.2)",
          flexShrink: 0
        }}
      >
                <Plus size={11} /> Add Prompt
              </button>}
    />

          {isCreatingPrompt && <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, background: "rgba(27,63,122,.03)", display: "flex", flexDirection: "column", gap: 13, animation: "fadeUp .2s ease both" }}>
              <p style={{ margin: 0, fontFamily: C.font, fontSize: ".82rem", fontWeight: 800, color: C.blue }}>New Prompt</p>
              <Field label="Title">
                <input autoFocus type="text" value={newPromptName} onChange={(e) => setNewPromptName(e.target.value)} placeholder="e.g. Weekend Script, Upsell Mode…" />
              </Field>
              <Field label="Prompt Content">
                <textarea rows={6} value={newPromptText} onChange={(e) => setNewPromptText(e.target.value)} placeholder="Enter behavioral instructions for your AI agent…" style={{ resize: "vertical" }} />
              </Field>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setIsCreatingPrompt(false)} style={{ flex: 1, fontFamily: C.font, fontSize: ".79rem", fontWeight: 600, color: C.textSub, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 0", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleCreatePrompt} disabled={promptSaving} style={{ flex: 2, fontFamily: C.font, fontSize: ".79rem", fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#1B3F7A,#2A5BA8)", border: "none", borderRadius: 8, padding: "9px 0", cursor: promptSaving ? "not-allowed" : "pointer", opacity: promptSaving ? 0.6 : 1, boxShadow: "0 3px 12px rgba(27,63,122,.22)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  {promptSaving ? <Spinner /> : <><Save size={11} /> Create Prompt</>}
                </button>
              </div>
            </div>}

          {prompts.length === 0 && !isCreatingPrompt && <div style={{ padding: "44px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <span style={{ color: C.textLight }}>{codeIcon}</span>
              <p style={{ margin: 0, fontFamily: C.font, fontSize: ".82rem", color: C.textMuted, textAlign: "center" }}>
                No prompts yet — click <strong style={{ color: C.blue }}>Add Prompt</strong> to create your first.
              </p>
            </div>}

          {prompts.map((p, i) => {
      const isExpanded = expandedPromptId === p.id;
      const isEditing = editingPromptId === p.id;
      const isLast = i === prompts.length - 1;
      return <div key={p.id} style={{ borderBottom: !isLast ? `1px solid ${C.borderFaint}` : "none" }}>

                {
        /* Row header — always visible */
      }
                <div
        onClick={() => setExpandedPromptId(isExpanded ? null : p.id)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", background: p.is_active ? "rgba(29,184,122,.03)" : C.white, cursor: "pointer" }}
      >
                  {
        /* Radio */
      }
                  <span
        onClick={(e) => {
          e.stopPropagation();
          if (!p.is_active) handleActivatePrompt(p.id);
        }}
        title={p.is_active ? "Active" : "Set as active"}
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          flexShrink: 0,
          border: `2px solid ${p.is_active ? C.blue : C.border}`,
          background: p.is_active ? C.blue : C.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: p.is_active ? "default" : "pointer",
          transition: "border-color .15s, background .15s"
        }}
      >
                    {p.is_active && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "block" }} />}
                  </span>

                  {
        /* Title + badge */
      }
                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: C.font, fontSize: ".84rem", fontWeight: p.is_active ? 700 : 600, color: p.is_active ? C.text : C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                    {p.is_active && <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: C.font, fontSize: ".62rem", fontWeight: 700, color: C.blue, background: "rgba(29,184,122,.12)", padding: "2px 8px", borderRadius: 100, flexShrink: 0 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.blue, animation: "ldot 1.8s ease-in-out infinite" }} />
                        Active
                      </span>}
                  </div>

                  {
        /* Edit / Delete / Chevron */
      }
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <button
        onClick={(e) => {
          e.stopPropagation();
          setEditingPromptId(p.id);
          setEditName(p.name);
          setEditText(p.text);
          setExpandedPromptId(p.id);
        }}
        title="Edit"
        style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
                      <Edit2 size={11} />
                    </button>
                    <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeletePrompt(p.id);
        }}
        title="Delete"
        style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.blueBdr}`, background: C.blueBg, color: C.blue, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
                      <Trash2 size={11} />
                    </button>
                    <span style={{ color: C.textMuted, display: "flex" }}>{chevron(isExpanded)}</span>
                  </div>
                </div>

                {
        /* Expanded body */
      }
                {isExpanded && (isEditing ? <div style={{ padding: "4px 20px 18px 52px", display: "flex", flexDirection: "column", gap: 11, animation: "fadeUp .18s ease both" }}>
                      <input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        placeholder="Prompt title…"
        style={{ fontFamily: C.font, fontSize: ".83rem", fontWeight: 700, color: C.text, border: `1.5px solid ${C.blueLight}`, borderRadius: 8, padding: "8px 12px", background: C.white, outline: "none", width: "100%" }}
      />
                      <textarea
        rows={7}
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        placeholder="Prompt instructions…"
        style={{ fontFamily: C.font, fontSize: ".79rem", color: C.text, border: `1.5px solid ${C.blueLight}`, borderRadius: 8, padding: "9px 12px", background: C.white, outline: "none", resize: "vertical", width: "100%", lineHeight: 1.65 }}
      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setEditingPromptId(null)} style={{ flex: 1, fontFamily: C.font, fontSize: ".77rem", fontWeight: 600, color: C.textSub, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "8px 0", cursor: "pointer" }}>Cancel</button>
                        <button onClick={() => handleSaveEdit(p.id)} disabled={promptSaving} style={{ flex: 2, fontFamily: C.font, fontSize: ".77rem", fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#1B3F7A,#2A5BA8)", border: "none", borderRadius: 7, padding: "8px 0", cursor: promptSaving ? "not-allowed" : "pointer", opacity: promptSaving ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                          {promptSaving ? <Spinner /> : <><Check size={11} /> Save Changes</>}
                        </button>
                      </div>
                    </div> : <div style={{ padding: "4px 20px 18px 52px", animation: "fadeUp .18s ease both" }}>
                      <p style={{ margin: 0, fontFamily: C.font, fontSize: ".79rem", color: C.textSub, lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {p.text}
                      </p>
                    </div>)}
              </div>;
    })}
        </Card>
      </div>;
  };
  const PhoneSection = () => <div className="vx-sec" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <CardHeader title="AI Phone Number" subtitle="Your dedicated Mitchell's AI number — share as your company's main line" icon={<Phone size={14} />} />
        <CardBody>
          <div style={{
    padding: "16px 18px",
    borderRadius: 12,
    background: assignedNumber ? "linear-gradient(135deg,rgba(27,63,122,.07),rgba(42,91,168,.03))" : C.bg,
    border: `1.5px solid ${assignedNumber ? "rgba(42,91,168,.22)" : C.border}`,
    display: "flex",
    alignItems: "center",
    gap: 13,
    flexWrap: "wrap"
  }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: assignedNumber ? C.blueBg : C.border, display: "flex", alignItems: "center", justifyContent: "center", color: assignedNumber ? C.blueLight : C.textMuted }}>
              <Phone size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <p style={{ margin: 0, fontFamily: C.font, fontSize: "1.28rem", fontWeight: 800, color: assignedNumber ? C.text : C.textMuted, letterSpacing: ".04em" }}>
                {assignedNumber ?? "\u2014"}
              </p>
              <p style={{ margin: "2px 0 0", fontFamily: C.font, fontSize: ".71rem", color: C.textMuted }}>
                {assignedNumber ? "Assigned by Retell \xB7 Cannot be changed here" : "No number assigned \u2014 contact support"}
              </p>
            </div>
            {assignedNumber && <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: C.font, fontSize: ".7rem", fontWeight: 700, background: C.blueBg, color: C.blue, padding: "4px 11px", borderRadius: 100, border: `1px solid ${C.blueBdr}`, flexShrink: 0 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.blue, animation: "ldot 1.6s ease-in-out infinite" }} />
                Active
              </span>}
          </div>
          <InfoNote>All calls to this number are answered by Mitchell's AI automatically whenever your agent is active.</InfoNote>
        </CardBody>
      </Card>

      <Card delay={0.05} faded>
        <CardHeader title="Call Routing" subtitle="Automatic transfers when the AI needs human backup" icon={<PhoneCall size={14} />} badge={<PlannedBadge />} />
        <CardBody>
          <Field label="Human Fallback Number" hint='Calls transfer here after repeated failed intents or when the caller requests a human.'>
            <div className="vx-iw"><Phone size={12} /><input disabled type="tel" autoComplete="tel" placeholder="+1 (260) 555-0199" /></div>
          </Field>
          <SectionDivider label="Transfer Rules" />
          {[
    { label: "Transfer on confusion", desc: "Route after 3 failed intent matches" },
    { label: "Transfer on explicit request", desc: "Caller says 'human', 'manager', or 'help'" },
    { label: "Transfer after-hours", desc: "Route to voicemail when store is closed" }
  ].map((item, i, arr) => <div key={i} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.borderFaint}` : "none" }}>
              <ToggleRow label={item.label} desc={item.desc} checked={false} onChange={() => {
  }} />
            </div>)}
        </CardBody>
      </Card>

      <Card delay={0.1} faded>
        <CardHeader title="SMS Notifications" subtitle="Automatic texts sent to customers and your team" icon={<Bell size={14} />} badge={<PlannedBadge />} />
        <CardBody gap={0}>
          {SMS_ITEMS.map((item, i) => <div key={i} style={{ borderBottom: i < SMS_ITEMS.length - 1 ? `1px solid ${C.borderFaint}` : "none" }}>
              <ToggleRow label={item.label} desc={item.desc} checked={false} onChange={() => {
  }} />
            </div>)}
          <p style={{ margin: "12px 0 0", fontFamily: C.font, fontSize: ".71rem", color: C.textMuted, lineHeight: 1.5 }}>
            SMS alerts require a Twilio number to be configured. Carrier charges may apply.
          </p>
        </CardBody>
      </Card>
    </div>;
  const IntegrationsSection = () => <div className="vx-sec" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{
    padding: "14px 18px",
    borderRadius: 12,
    animation: "fadeUp .3s ease both",
    background: "linear-gradient(135deg,rgba(27,63,122,.07),rgba(42,91,168,.03))",
    border: `1px solid rgba(42,91,168,.16)`,
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
  }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: C.blueBg, color: C.blueLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Link2 size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 170 }}>
          <p style={{ margin: 0, fontFamily: C.font, fontSize: ".84rem", fontWeight: 800, color: C.text }}>Integrations are in development</p>
          <p style={{ margin: "2px 0 0", fontFamily: C.font, fontSize: ".72rem", color: C.textMuted, lineHeight: 1.5 }}>OAuth connections and API key management coming soon.</p>
        </div>
        <span style={{ fontFamily: C.font, fontSize: ".66rem", fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: C.blueBg, color: C.blueLight, flexShrink: 0 }}>Q3 2026</span>
      </div>

      <Card faded>
        <CardHeader title="Platform Connections" subtitle="Sync menus and orders automatically" icon={<Link2 size={14} />} badge={<PlannedBadge />} />
        <CardBody>
          {INTEGRATIONS.map((intg) => <div key={intg.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, flexWrap: "wrap" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: C.blueBg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.blueLight }}>
                <Link2 size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 110 }}>
                <p style={{ margin: 0, fontFamily: C.font, fontSize: ".81rem", fontWeight: 700, color: C.text }}>{intg.name}</p>
                <p style={{ margin: "2px 0 0", fontFamily: C.font, fontSize: ".7rem", color: C.textMuted }}>{intg.desc}</p>
              </div>
              <button className="vx-conn" style={{ fontFamily: C.font, fontSize: ".7rem", fontWeight: 700, padding: "6px 12px", borderRadius: 7, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMuted, cursor: "not-allowed", transition: "border-color .15s, color .15s", flexShrink: 0 }}>
                Connect
              </button>
            </div>)}
        </CardBody>
      </Card>

      <Card delay={0.06} faded>
        <CardHeader
    title="On the Roadmap"
    subtitle="More platforms coming soon based on customer demand"
    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>}
  />
        <CardBody>
          <div className="vx-g3">
            {[{ name: "Uber Eats", cat: "Delivery" }, { name: "Lightspeed", cat: "Retail" }, { name: "Grubhub", cat: "Delivery" }, { name: "Checkmate", cat: "Aggregator" }].map((item) => <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg }}>
                <p style={{ margin: 0, fontFamily: C.font, fontSize: ".78rem", fontWeight: 700, color: C.text, flex: 1 }}>{item.name}</p>
                <span style={{ fontFamily: C.font, fontSize: ".61rem", fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: C.blueBg, color: C.blueLight, whiteSpace: "nowrap" }}>{item.cat}</span>
              </div>)}
          </div>
        </CardBody>
      </Card>
    </div>;
  return <div className="vx-st" style={{ fontFamily: C.font, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: C.bg }}>
      <style>{CSS}</style>

      <div className="vx-topbar" style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 20px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#1B3F7A,#2A5BA8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Store size={14} style={{ color: "#fff" }} />
          </div>
          <span style={{ fontFamily: C.font, fontSize: ".88rem", fontWeight: 800, color: C.text, letterSpacing: "-.02em", whiteSpace: "nowrap" }}>Settings</span>
          {settings.restaurant_name && <span className="vx-topbar-meta" style={{ fontFamily: C.font, fontSize: ".74rem", color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              — {settings.restaurant_name}
            </span>}
          {dirty && <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: C.font, fontSize: ".65rem", fontWeight: 700, background: C.goldBg, color: C.gold, padding: "2px 8px", borderRadius: 100, border: `1px solid ${C.goldBdr}`, flexShrink: 0 }}>
              <AlertCircle size={8} /> Unsaved
            </span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 8, background: f.is_active ? C.blueBg : C.bg, border: `1px solid ${f.is_active ? C.blueBdr : C.border}` }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: f.is_active ? C.blue : C.textLight, flexShrink: 0, animation: f.is_active ? "ldot 1.8s ease-in-out infinite" : "none" }} />
            <span className="vx-topbar-meta" style={{ fontFamily: C.font, fontSize: ".71rem", fontWeight: 700, color: f.is_active ? C.blue : C.textMuted }}>
              {f.is_active ? "Agent live" : "Paused"}
            </span>
            <button onClick={() => upd("is_active", !f.is_active)} style={{
    position: "relative",
    width: 32,
    height: 18,
    borderRadius: 9,
    border: "none",
    cursor: "pointer",
    padding: 0,
    background: f.is_active ? C.blue : C.border,
    transition: "background .2s"
  }}>
              <span style={{ position: "absolute", top: 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)", left: f.is_active ? 16 : 2, transition: "left .2s" }} />
            </button>
          </div>
          
          <button
    className="vx-save"
    onClick={handleSave}
    disabled={saving || !dirty}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 5,
      fontFamily: C.font,
      fontSize: ".79rem",
      fontWeight: 700,
      background: dirty ? "linear-gradient(135deg,#1B3F7A,#2A5BA8)" : C.border,
      color: dirty ? "#fff" : C.textMuted,
      border: "none",
      borderRadius: 8,
      padding: "8px 15px",
      cursor: dirty ? "pointer" : "not-allowed",
      boxShadow: dirty ? "0 3px 14px rgba(27,63,122,.26)" : "none",
      transition: "filter .18s, transform .18s, box-shadow .18s",
      whiteSpace: "nowrap"
    }}
  >
            {saving ? <><div style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Saving…</> : <><Save size={12} /> Save</>}
          </button>
        </div>
      </div>

      <div className="vx-layout">

        
        <nav className="vx-sidebar">
          {SECTIONS.map((sec) => {
    const on = activeSection === sec.id;
    return <button key={sec.id} onClick={() => setActiveSection(sec.id)} className={`vx-nav-item${on ? " vx-nav-on" : ""}`}>
                <span className="vx-nav-icon">{sec.icon}</span>
                <span className="vx-nav-label-txt" style={{ fontFamily: C.font, fontSize: ".79rem", fontWeight: on ? 700 : 500, color: on ? C.blue : C.textSub, whiteSpace: "nowrap", letterSpacing: "-.01em" }}>
                  {sec.label}
                </span>
              </button>;
  })}
        </nav>

        
        <main className="vx-main">
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            {activeSection === "store" && StoreSection()}
            {activeSection === "hours" && HoursSection()}
            {activeSection === "voice" && VoiceSection()}
            {activeSection === "greetings" && GreetingsSection()}
            {activeSection === "prompts" && PromptsSection()}
            {activeSection === "phone" && PhoneSection()}
            {activeSection === "integrations" && IntegrationsSection()}
          </div>
        </main>

      </div>
    </div>;
}
export {
  SettingsPage as default
};

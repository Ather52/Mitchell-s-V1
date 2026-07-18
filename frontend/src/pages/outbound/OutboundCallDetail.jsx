import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Play, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { getOutboundCallApi } from "../../api/api";
import { C, StatusBadge, formatDuration } from "./outboundStyles";

export default function OutboundCallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOutboundCallApi(id)
      .then(setCall)
      .catch(() => toast.error("Failed to load call"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!call) {
    return <div style={{ padding: 40 }}>Call not found</div>;
  }

  const timeline = [
    { label: "Created", time: call.created_at },
    call.started_at && { label: "Started", time: call.started_at },
    call.ended_at && { label: "Ended", time: call.ended_at },
  ].filter(Boolean);

  return (
    <div style={{ background: C.pageBg, minHeight: "100vh", padding: "24px 28px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate("/dashboard/calling/outbound/calls")}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: C.text }}>
          Call Details
        </h1>
        <StatusBadge status={call.call_status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: ".85rem", fontWeight: 800, color: C.textMuted, textTransform: "uppercase" }}>
            Contact
          </h3>
          <p style={{ margin: "4px 0", fontWeight: 700 }}>{call.contact_name || "—"}</p>
          <p style={{ margin: "4px 0", color: C.textSub }}>{call.phone_number}</p>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: ".85rem", fontWeight: 800, color: C.textMuted, textTransform: "uppercase" }}>
            Campaign
          </h3>
          <p style={{ margin: "4px 0", fontWeight: 700 }}>{call.campaign_name || "—"}</p>
          <p style={{ margin: "4px 0", color: C.textMuted, fontSize: ".8rem" }}>
            Retell ID: {call.retell_call_id || "—"}
          </p>
          <p style={{ margin: "4px 0", color: C.textMuted, fontSize: ".8rem" }}>
            Duration: {formatDuration(call.duration)}
          </p>
        </div>
      </div>

      {call.recording_url && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: ".85rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
            <Play size={14} />
            Recording
          </h3>
          <audio controls src={call.recording_url} style={{ width: "100%" }} />
        </div>
      )}

      {call.summary && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: ".85rem", fontWeight: 800 }}>Summary</h3>
          <p style={{ margin: 0, lineHeight: 1.6, color: C.textSub, fontSize: ".85rem" }}>{call.summary}</p>
        </div>
      )}

      {call.transcript && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: ".85rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} />
            Transcript
          </h3>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              fontSize: ".82rem",
              lineHeight: 1.6,
              color: C.textSub,
              maxHeight: 400,
              overflow: "auto",
            }}
          >
            {call.transcript}
          </pre>
        </div>
      )}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: ".85rem", fontWeight: 800 }}>Timeline</h3>
        {timeline.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: C.blue,
                marginTop: 6,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: ".82rem" }}>{item.label}</div>
              <div style={{ fontSize: ".78rem", color: C.textMuted }}>
                {new Date(item.time).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

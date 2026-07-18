import React, { useEffect, useState } from "react";
import { getComplaintsApi } from "../../api/api";
import toast from "react-hot-toast";
import { AlertCircle, RefreshCw, Loader2, Package, Calendar } from "lucide-react";
import { C } from "../../theme/colors";

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await getComplaintsApi();
      setComplaints(data);
    } catch (error) {
      toast.error("Failed to load complaints");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const getSeverityBadge = (severity) => {
    const s = (severity || "").toLowerCase();
    if (s.includes("high") || s.includes("severe") || s.includes("critical")) {
      return { label: severity, color: C.blue, bg: C.blueBg, border: C.blueBdr };
    }
    return { label: severity || "Standard", color: C.gold, bg: C.goldBg, border: C.goldBdr };
  };

  return (
    <div style={{ padding: "30px 40px", height: "100%", overflowY: "auto", background: C.pageBg, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: "Sora,sans-serif", fontSize: "1.65rem", fontWeight: 800, color: C.text, margin: "0 0 6px", letterSpacing: "-.02em" }}>
            Complaints & Issues
          </h1>
          <p style={{ fontFamily: "Sora,sans-serif", fontSize: ".82rem", color: C.textSub, margin: 0 }}>
            Track and review customer product complaints logged by the AI agent.
          </p>
        </div>

        <button
          onClick={fetchComplaints}
          disabled={loading}
          style={{
            height: 38,
            padding: "0 18px",
            borderRadius: 10,
            background: "#fff",
            border: `1px solid ${C.border}`,
            color: C.text,
            fontFamily: "Sora,sans-serif",
            fontSize: ".75rem",
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 1px 3px rgba(0,0,0,.02)",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: C.blue }} /> : <RefreshCw size={14} style={{ color: C.textMuted }} />}
          Refresh
        </button>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ overflowX: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "#FAFBFD", borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontFamily: "Sora,sans-serif", fontSize: ".65rem", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", width: "18%" }}>Customer</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontFamily: "Sora,sans-serif", fontSize: ".65rem", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", width: "20%" }}>Product & Batch</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontFamily: "Sora,sans-serif", fontSize: ".65rem", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", width: "12%" }}>Severity</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontFamily: "Sora,sans-serif", fontSize: ".65rem", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", width: "35%" }}>Issue Details</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontFamily: "Sora,sans-serif", fontSize: ".65rem", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", width: "15%" }}>Date Logged</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ padding: "60px 20px", textAlign: "center" }}>
                    <AlertCircle size={32} style={{ color: C.border, margin: "0 auto 12px" }} />
                    <p style={{ fontFamily: "Sora,sans-serif", fontSize: ".85rem", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>No Complaints Found</p>
                    <p style={{ fontFamily: "Sora,sans-serif", fontSize: ".75rem", color: C.textMuted, margin: 0 }}>There are currently no logged complaints.</p>
                  </td>
                </tr>
              )}

              {loading && complaints.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: "60px 20px", textAlign: "center" }}>
                    <Loader2 size={24} style={{ color: C.blue, margin: "0 auto", animation: "spin 1s linear infinite" }} />
                  </td>
                </tr>
              )}

              {complaints.map((c) => {
                const badge = getSeverityBadge(c.severity);
                const d = new Date(c.created_at);
                const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(27,63,122,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "16px 20px", verticalAlign: "top" }}>
                      <p style={{ fontFamily: "Sora,sans-serif", fontSize: ".8rem", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{c.caller_name || "Unknown Customer"}</p>
                      <p style={{ fontFamily: "Sora,sans-serif", fontSize: ".7rem", color: C.textSub, margin: 0 }}>{c.caller_phone}</p>
                    </td>

                    <td style={{ padding: "16px 20px", verticalAlign: "top" }}>
                      <p style={{ fontFamily: "Sora,sans-serif", fontSize: ".8rem", fontWeight: 700, color: C.blue, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                        <Package size={12} /> {c.product_name}
                      </p>
                      {c.po_number && (
                        <p style={{ fontFamily: "Sora,sans-serif", fontSize: ".7rem", color: C.textSub, margin: "0 0 3px" }}>
                          PO: <span style={{ fontWeight: 600 }}>{c.po_number}</span>
                        </p>
                      )}
                      {c.batch_lot_number && (
                        <p style={{ fontFamily: "Sora,sans-serif", fontSize: ".7rem", color: C.textMuted, margin: 0 }}>
                          Batch: {c.batch_lot_number}
                        </p>
                      )}
                    </td>

                    <td style={{ padding: "16px 20px", verticalAlign: "top" }}>
                      <span style={{
                        display: "inline-block",
                        fontFamily: "Sora,sans-serif",
                        fontSize: ".65rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 100,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
                      </span>
                    </td>

                    <td style={{ padding: "16px 20px", verticalAlign: "top" }}>
                      <p style={{ fontFamily: "Sora,sans-serif", fontSize: ".75rem", color: C.textSub, lineHeight: 1.5, margin: "0 0 8px" }}>
                        {c.complaint_description}
                      </p>
                      {(c.purchase_location || c.purchase_date) && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          {c.purchase_location && (
                            <span style={{ fontFamily: "Sora,sans-serif", fontSize: ".65rem", color: C.textMuted, background: "#F4F4FA", padding: "3px 8px", borderRadius: 4 }}>
                              Location: {c.purchase_location}
                            </span>
                          )}
                          {c.purchase_date && (
                            <span style={{ fontFamily: "Sora,sans-serif", fontSize: ".65rem", color: C.textMuted, background: "#F4F4FA", padding: "3px 8px", borderRadius: 4 }}>
                              Purchased: {c.purchase_date}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "16px 20px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.textSub, marginBottom: 4 }}>
                        <Calendar size={12} style={{ color: C.textMuted }} />
                        <span style={{ fontFamily: "Sora,sans-serif", fontSize: ".75rem", fontWeight: 600 }}>{dateStr}</span>
                      </div>
                      <span style={{ fontFamily: "Sora,sans-serif", fontSize: ".7rem", color: C.textMuted, marginLeft: 18 }}>{timeStr}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Complaints;

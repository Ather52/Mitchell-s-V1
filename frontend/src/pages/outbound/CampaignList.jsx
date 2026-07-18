import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Trash2, Pencil, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import {
  getOutboundCampaignsApi,
  createOutboundCampaignApi,
  deleteOutboundCampaignApi,
  updateOutboundCampaignApi,
} from "../../api/api";
import { C, StatusBadge, Btn, spinStyle } from "./outboundStyles";

export default function CampaignList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fetchLock = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchCampaigns = useCallback(async (silent = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      setCampaigns(await getOutboundCampaignsApi(0, 100, search || undefined));
    } catch {
      if (!silent) toast.error("Failed to load campaigns");
    } finally {
      fetchLock.current = false;
      setInitialLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCampaigns(false);
  }, [fetchCampaigns]);

  const openCreate = () => {
    setForm({ name: "", description: "" });
    setModal("create");
  };

  const openEdit = (c, e) => {
    e.stopPropagation();
    setForm({ name: c.name, description: c.description || "" });
    setModal(c.id);
  };

  const save = async (e) => {
    e?.preventDefault?.();
    if (saving) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (modal === "create") {
        await createOutboundCampaignApi(form);
        toast.success("Campaign created");
      } else {
        await updateOutboundCampaignApi(modal, form);
        toast.success("Campaign updated");
      }
      setModal(null);
      await fetchCampaigns(true);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, e) => {
    e.stopPropagation();
    if (deletingId) return;
    if (!window.confirm("Delete this campaign?")) return;
    setDeletingId(id);
    try {
      await deleteOutboundCampaignApi(id);
      toast.success("Campaign deleted");
      await fetchCampaigns(true);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ background: C.pageBg, minHeight: "100vh", padding: "24px 28px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Btn variant="ghost" onClick={() => navigate("/dashboard/calling/outbound")}>
          <ArrowLeft size={18} />
        </Btn>
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: C.text }}>
          Campaigns
        </h1>
        <div style={{ flex: 1 }} />
        <Btn variant="primary" onClick={openCreate}>
          <Plus size={14} />
          Create
        </Btn>
      </div>

      <div style={{ marginBottom: 16, position: "relative", maxWidth: 320 }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: C.textMuted,
            pointerEvents: "none",
          }}
        />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search campaigns..."
          style={{
            width: "100%",
            padding: "9px 12px 9px 34px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            fontSize: ".82rem",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {initialLoading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Loader2 size={24} style={spinStyle} />
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
            No campaigns yet
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".82rem" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: "#FAFBFD" }}>
                {["Name", "Status", "Created", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontWeight: 700,
                      color: C.textMuted,
                      fontSize: ".72rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                  onClick={() => navigate(`/dashboard/calling/outbound/campaigns/${c.id}`)}
                >
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: C.text }}>
                    {c.name}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={c.status} />
                  </td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
                    <Btn
                      variant="ghost"
                      style={{ color: C.blue, marginRight: 4, padding: 4 }}
                      onClick={(e) => openEdit(c, e)}
                    >
                      <Pencil size={14} />
                    </Btn>
                    <Btn
                      variant="danger"
                      loading={deletingId === c.id}
                      disabled={!!deletingId}
                      onClick={(e) => remove(c.id, e)}
                    >
                      <Trash2 size={14} />
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,15,26,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) setModal(null);
          }}
        >
          <div
            style={{
              background: C.card,
              borderRadius: 14,
              padding: 24,
              width: 400,
              maxWidth: "90vw",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", fontWeight: 800 }}>
              {modal === "create" ? "New Campaign" : "Edit Campaign"}
            </h3>
            <form onSubmit={save}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Campaign name"
                disabled={saving}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  marginBottom: 10,
                  boxSizing: "border-box",
                }}
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                rows={3}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  marginBottom: 16,
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Btn variant="secondary" disabled={saving} onClick={() => setModal(null)}>
                  Cancel
                </Btn>
                <Btn type="submit" variant="primary" loading={saving}>
                  {saving ? "Saving…" : "Save"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

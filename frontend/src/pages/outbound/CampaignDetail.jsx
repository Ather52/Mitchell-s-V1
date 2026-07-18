import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Phone,
  Loader2,
  RefreshCw,
  Bell,
  BellOff,
  Timer,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getOutboundCampaignApi,
  getOutboundCampaignStatsApi,
  getOutboundContactsApi,
  addOutboundContactApi,
  deleteOutboundContactApi,
  updateOutboundContactApi,
  importOutboundContactsApi,
  startOutboundCallApi,
  setContactRecallApi,
} from "../../api/api";
import { C, StatusBadge, Btn, spinStyle } from "./outboundStyles";

// ── Callback countdown (local copy for this page) ─────────────────────────────
function useCountdown(recallAt) {
  const [secsLeft, setSecsLeft] = useState(() =>
    recallAt ? Math.floor((new Date(recallAt) - Date.now()) / 1000) : null
  );
  useEffect(() => {
    if (!recallAt) { setSecsLeft(null); return; }
    const tick = () => setSecsLeft(Math.floor((new Date(recallAt) - Date.now()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [recallAt]);
  return secsLeft;
}
function fmtCd(secs) {
  const abs = Math.abs(secs);
  const d = Math.floor(abs / 86400), h = Math.floor((abs % 86400) / 3600),
        m = Math.floor((abs % 3600) / 60), s = abs % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
function ContactCountdown({ recallAt, status }) {
  const secs = useCountdown(recallAt);
  if (status === "calling") return null;
  if (secs === null) return <span style={{ color: "#ccc" }}>—</span>;
  const overdue = secs <= 0, urgent = !overdue && secs < 3600;
  const color = overdue ? "#D97706" : urgent ? "#D97706" : "#16A34A";
  const bg    = overdue ? "#FFFBEB" : urgent ? "#FFFBEB" : "#F0FDF4";
  const bdr   = overdue ? "#FDE68A" : urgent ? "#FDE68A" : "#BBF7D0";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:".68rem", fontWeight:700,
      padding:"2px 8px", borderRadius:100, background:bg, color, border:`1px solid ${bdr}`, whiteSpace:"nowrap" }}>
      <Timer size={9}/>{overdue ? `⚠ ${fmtCd(secs)} ago` : fmtCd(secs)}
    </span>
  );
}

const PRESETS = [
  { label: "30m", ms: 30*60*1000 },
  { label: "1h",  ms: 60*60*1000 },
  { label: "2h",  ms: 2*60*60*1000 },
  { label: "4h",  ms: 4*60*60*1000 },
  { label: "Tomorrow", ms: 24*60*60*1000 },
];
function ContactCallbackModal({ contact, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [customDt, setCustomDt] = useState("");
  const go = async (iso) => {
    setSaving(true);
    try { await setContactRecallApi(contact.id, iso); toast.success("Reminder set!"); onSaved(iso); }
    catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,15,26,.45)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:9999 }}
      onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"20px 22px", width:320, maxWidth:"92vw",
        boxShadow:"0 12px 48px rgba(0,0,0,.18)" }} onMouseDown={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <span style={{ fontWeight:800, fontSize:".9rem" }}>Set Callback – {contact.name || contact.phone_number}</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",display:"flex" }}><X size={16}/></button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:12 }}>
          {PRESETS.map(p=><button key={p.label} disabled={saving} onClick={()=>go(new Date(Date.now()+p.ms).toISOString())}
            style={{ fontWeight:700,fontSize:".72rem",padding:"8px",borderRadius:9,
              background:"#EEF2FF",border:"1px solid #C7D2FE",color:"#4338CA",cursor:saving?"not-allowed":"pointer" }}>
            <Timer size={10} style={{marginRight:3}}/>{p.label}</button>)}
        </div>
        <form onSubmit={e=>{e.preventDefault();if(customDt)go(new Date(customDt).toISOString());}} style={{display:"flex",gap:6,marginBottom:10}}>
          <input type="datetime-local" value={customDt} onChange={e=>setCustomDt(e.target.value)} disabled={saving}
            style={{flex:1,padding:"7px 9px",borderRadius:8,border:"1px solid #E5E7EB",fontSize:".72rem"}}/>
          <button type="submit" disabled={!customDt||saving}
            style={{padding:"7px 12px",borderRadius:8,border:"none",background:customDt?"#6366F1":"#9CA3AF",color:"#fff",fontWeight:700,fontSize:".72rem",cursor:customDt&&!saving?"pointer":"not-allowed"}}>Set</button>
        </form>
        {contact.recall_at && (
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 9px",background:"#FEF2F2",borderRadius:8,marginBottom:8}}>
            <span style={{fontSize:".66rem",color:"#DC2626"}}>Set: {new Date(contact.recall_at).toLocaleString()}</span>
            <button onClick={()=>go(null)} disabled={saving}
              style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:".65rem",fontWeight:700,display:"flex",alignItems:"center",gap:3}}>
              <BellOff size={10}/>Clear</button>
          </div>
        )}
        <button onClick={onClose} style={{width:"100%",padding:"8px",borderRadius:9,border:"1px solid #E5E7EB",background:"#fff",fontWeight:700,fontSize:".72rem",cursor:"pointer"}}>Cancel</button>
      </div>
    </div>
  );
}

const CSV_IMPORT_FIELDS = [
  {
    column: "phone_number",
    required: true,
    aliases: "phone",
    example: "03475574848",
    note: "Required. E.164 or local PK format (auto-normalized to +92…)",
  },
  {
    column: "owner_name",
    required: false,
    aliases: "name",
    example: "Ali Khan",
    note: "Contact / owner name spoken by the agent",
  },
  {
    column: "shop_name",
    required: false,
    aliases: "company",
    example: "Fresh Mart",
    note: "Business or shop name",
  },
  {
    column: "language_preference",
    required: true,
    aliases: "language",
    example: "Urdu",
    note: "Required. Language for the call (Urdu or English)",
  },
  {
    column: "customer_city",
    required: false,
    aliases: "city",
    example: "Lahore",
    note: "City passed to the agent as dynamic variable",
  },
  {
    column: "last_order",
    required: false,
    aliases: null,
    example: "2x Mango Jam",
    note: "Previous order summary for returning customers",
  },
  {
    column: "customer_type",
    required: false,
    aliases: null,
    example: "existing",
    note: "new or existing",
  },
];

const CSV_SAMPLE = [
  "phone_number,owner_name,shop_name,language_preference,customer_city,last_order,customer_type",
  "03475574848,Ali Khan,Fresh Mart,Urdu,Lahore,2x Mango Jam,existing",
  "03001234567,Sara Ali,City Store,English,Karachi,,new",
].join("\n");

function downloadSampleCsv() {
  const blob = new Blob([CSV_SAMPLE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "outbound-contacts-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const fetchLock = useRef(false);
  const [campaign, setCampaign] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callingId, setCallingId] = useState(null);
  const [quickPhone, setQuickPhone] = useState("");
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [callbackModalContact, setCallbackModalContact] = useState(null);
  const [contactRecalls, setContactRecalls] = useState({});
  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    language_preference: "Urdu",
    company: "",
  });
  const [showEdit, setShowEdit] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone_number: "",
    language_preference: "Urdu",
    company: "",
  });
  const [inlineLang, setInlineLang] = useState({});
  const [changingLangId, setChangingLangId] = useState(null);

  const changeInlineLang = async (contact) => {
    const newLang = inlineLang[contact.id] || contact.language_preference || "Urdu";
    if (newLang === (contact.language_preference || "Urdu")) return;
    setChangingLangId(contact.id);
    try {
      await updateOutboundContactApi(contact.id, { language_preference: newLang });
      toast.success("Language updated");
      await fetchAll(true);
    } catch (err) {
      toast.error(apiError(err, "Failed to update language"));
    } finally {
      setChangingLangId(null);
    }
  };

  const fetchAll = useCallback(async (silent = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    if (!silent) setRefreshing(true);
    try {
      const c = await getOutboundCampaignApi(id);
      setCampaign(c);
      const [ct, st] = await Promise.all([
        getOutboundContactsApi(id).catch(() => []),
        getOutboundCampaignStatsApi(id).catch(() => null),
      ]);
      setContacts(Array.isArray(ct) ? ct : []);
      setStats(st);
    } catch {
      if (!silent) toast.error("Failed to load campaign");
    } finally {
      fetchLock.current = false;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll(false);
  }, [fetchAll]);

  const hasActiveCall = contacts.some(c => c.status === "calling" || c.status === "ongoing");
  useEffect(() => {
    if (showAdd || savingContact || callingId) return undefined;
    const interval = setInterval(() => fetchAll(true), hasActiveCall ? 4000 : 20000);
    return () => clearInterval(interval);
  }, [fetchAll, showAdd, savingContact, callingId, hasActiveCall]);

  const apiError = (err, fallback) => {
    const detail = err?.response?.data?.detail ?? err;
    if (typeof detail === "string") return detail;
    if (detail?.message) return detail.message;
    return fallback;
  };

  const callContact = async (contactId) => {
    if (callingId) return;
    setCallingId(contactId);
    try {
      const call = await startOutboundCallApi({ contact_id: contactId });
      toast.success(`Calling ${call.phone_number}`);
      await fetchAll(true);
    } catch (err) {
      toast.error(apiError(err, "Failed to start call"));
    } finally {
      setCallingId(null);
    }
  };

  const quickCall = async (e) => {
    e.preventDefault();
    if (callingId) return;
    if (!quickPhone.trim()) {
      toast.error("Enter a phone number");
      return;
    }
    setCallingId("quick");
    try {
      const call = await startOutboundCallApi({
        campaign_id: id,
        phone_number: quickPhone.trim(),
      });
      toast.success(`Calling ${call.phone_number}`);
      setQuickPhone("");
      await fetchAll(true);
    } catch (err) {
      toast.error(apiError(err, "Failed to start call"));
    } finally {
      setCallingId(null);
    }
  };

  const addContact = async (e) => {
    e.preventDefault();
    if (savingContact) return;
    if (!form.phone_number.trim()) {
      toast.error("Phone number is required");
      return;
    }
    setSavingContact(true);
    try {
      await addOutboundContactApi(id, form);
      toast.success("Contact added");
      setShowAdd(false);
      setForm({ name: "", phone_number: "", language_preference: "Urdu", company: "" });
      await fetchAll(true);
    } catch (err) {
      toast.error(apiError(err, "Failed to add contact"));
    } finally {
      setSavingContact(false);
    }
  };

  const updateContact = async (e) => {
    e.preventDefault();
    if (savingContact) return;
    if (!editForm.phone_number.trim()) {
      toast.error("Phone number is required");
      return;
    }
    setSavingContact(true);
    try {
      await updateOutboundContactApi(editingContact.id, editForm);
      toast.success("Contact updated");
      setShowEdit(false);
      setEditingContact(null);
      await fetchAll(true);
    } catch (err) {
      toast.error(apiError(err, "Failed to update contact"));
    } finally {
      setSavingContact(false);
    }
  };

  const removeContact = async (contactId) => {
    if (deletingId) return;
    if (!window.confirm("Delete contact?")) return;
    setDeletingId(contactId);
    try {
      await deleteOutboundContactApi(contactId);
      toast.success("Contact deleted");
      await fetchAll(true);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || importing) return;
    setImporting(true);
    try {
      const result = await importOutboundContactsApi(id, file);
      toast.success(`Imported ${result.imported} contacts`);
      await fetchAll(true);
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <Loader2 size={28} style={spinStyle} />
      </div>
    );
  }

  if (!campaign) {
    return <div style={{ padding: 40 }}>Campaign not found</div>;
  }

  return (
    <div style={{ background: C.pageBg, minHeight: "100vh", padding: "24px 28px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Btn variant="ghost" onClick={() => navigate("/dashboard/calling/outbound/campaigns")}>
          <ArrowLeft size={18} />
        </Btn>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: C.text }}>
            {campaign.name}
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: ".82rem", color: C.textMuted }}>
            {campaign.description || "No description"}
          </p>
        </div>
        <StatusBadge status={campaign.status} />
        <Btn variant="secondary" loading={refreshing} onClick={() => fetchAll(false)} style={{ padding: 8 }}>
          <RefreshCw size={14} />
        </Btn>
      </div>

      <form
        onSubmit={quickCall}
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        <Phone size={18} style={{ color: C.blue, flexShrink: 0 }} />
        <input
          value={quickPhone}
          onChange={(e) => setQuickPhone(e.target.value)}
          placeholder="Phone number to call now (e.g. 03475574848)"
          disabled={!!callingId}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            fontSize: ".85rem",
          }}
        />
        <Btn
          type="submit"
          variant="primary"
          loading={callingId === "quick"}
          disabled={!!callingId && callingId !== "quick"}
        >
          <Phone size={14} />
          {callingId === "quick" ? "Calling…" : "Call Now"}
        </Btn>
      </form>

      {stats && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Total", value: stats.total },
            { label: "Pending", value: stats.pending },
            { label: "Completed", value: stats.completed },
            { label: "Failed", value: stats.failed },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "12px 18px",
                minWidth: 100,
              }}
            >
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: C.text }}>{s.value}</div>
              <div style={{ fontSize: ".72rem", color: C.textMuted, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Btn variant="primary" onClick={() => setShowAdd(true)}>
          <Plus size={14} />
          Add Contact
        </Btn>
        <Btn variant="secondary" loading={importing} onClick={() => fileRef.current?.click()}>
          <Upload size={14} />
          {importing ? "Importing…" : "CSV / JSON Upload"}
        </Btn>
        <Btn variant="secondary" onClick={downloadSampleCsv}>
          Download sample CSV
        </Btn>
        <input ref={fileRef} type="file" accept=".csv,.json" hidden onChange={handleFile} />
      </div>

      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 16,
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            fontSize: ".82rem",
            fontWeight: 800,
            color: C.text,
          }}
        >
          CSV / JSON import format
        </p>
        <p style={{ margin: "0 0 12px", fontSize: ".75rem", color: C.textMuted, lineHeight: 1.5 }}>
          First row must be column headers. Only{" "}
          <strong style={{ color: C.text }}>phone_number</strong> is required; all other
          columns are optional but improve personalization on outbound calls.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: ".75rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Column", "Required", "Also accepts", "Example", "Notes"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      fontWeight: 700,
                      color: C.textMuted,
                      fontSize: ".68rem",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CSV_IMPORT_FIELDS.map((f) => (
                <tr key={f.column} style={{ borderBottom: `1px solid ${C.borderFaint}` }}>
                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: 700 }}>
                    {f.column}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    {f.required ? (
                      <span style={{ color: C.blue, fontWeight: 700 }}>Yes</span>
                    ) : (
                      <span style={{ color: C.textMuted }}>No</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      fontFamily: "monospace",
                      color: C.textMuted,
                    }}
                  >
                    {f.aliases || "—"}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      fontFamily: "monospace",
                      color: C.textSub,
                    }}
                  >
                    {f.example}
                  </td>
                  <td style={{ padding: "8px 10px", color: C.textMuted }}>{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: ".72rem",
            color: C.textMuted,
            fontFamily: "monospace",
            background: "#FAFBFD",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${C.borderFaint}`,
            overflowX: "auto",
          }}
        >
          {CSV_SAMPLE.split("\n")[0]}
        </p>
      </div>

      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".82rem" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, background: "#FAFBFD" }}>
              {["Name", "Phone", "Language", "Company", "Status", "Actions"].map((h) => (
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
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: "center", color: C.textMuted }}>
                  No contacts yet
                </td>
              </tr>
            ) : (
              contacts.map((ct) => (
                <tr key={ct.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{ct.name || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>{ct.phone_number}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <select
                        value={inlineLang[ct.id] || ct.language_preference || "Urdu"}
                        onChange={(e) => setInlineLang({ ...inlineLang, [ct.id]: e.target.value })}
                        disabled={changingLangId === ct.id}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: `1px solid ${C.border}`,
                          fontSize: ".75rem",
                          backgroundColor: "#fff",
                        }}
                      >
                        <option value="Urdu">Urdu</option>
                        <option value="English">English</option>
                      </select>
                      {(inlineLang[ct.id] && inlineLang[ct.id] !== (ct.language_preference || "Urdu")) && (
                        <Btn
                          variant="secondary"
                          loading={changingLangId === ct.id}
                          onClick={() => changeInlineLang(ct)}
                          style={{ padding: "4px 8px", fontSize: ".7rem" }}
                        >
                          Change
                        </Btn>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{ct.company || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={ct.status} />
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn
                        variant="primary"
                        loading={callingId === ct.id}
                        disabled={
                          ct.status === "calling" ||
                          (!!callingId && callingId !== ct.id)
                        }
                        onClick={() => callContact(ct.id)}
                        style={{ padding: "6px 10px" }}
                      >
                        <Phone size={14} />
                      </Btn>
                      <Btn
                        variant="secondary"
                        onClick={() => setCallbackModalContact(ct)}
                        style={{ padding: "6px 10px" }}
                        title="Set Callback"
                      >
                        <Bell size={14} />
                      </Btn>
                      <Btn
                        variant="secondary"
                        disabled={!!callingId || !!deletingId}
                        onClick={() => {
                          setEditingContact(ct);
                          setEditForm({
                            name: ct.name || "",
                            phone_number: ct.phone_number || "",
                            language_preference: ct.language_preference || "Urdu",
                            company: ct.company || "",
                          });
                          setShowEdit(true);
                        }}
                      >
                        Edit
                      </Btn>
                      <Btn
                        variant="danger"
                        loading={deletingId === ct.id}
                        disabled={!!deletingId || !!callingId}
                        onClick={() => removeContact(ct.id)}
                      >
                        <Trash2 size={14} />
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {callbackModalContact && (
        <ContactCallbackModal
          contact={{ ...callbackModalContact, recall_at: contactRecalls[callbackModalContact.id] ?? callbackModalContact.recall_at }}
          onClose={() => setCallbackModalContact(null)}
          onSaved={(iso) => {
            setContactRecalls(prev => ({ ...prev, [callbackModalContact.id]: iso }));
            setCallbackModalContact(null);
          }}
        />
      )}

      {showAdd && (
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
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <div
            style={{ background: C.card, borderRadius: 14, padding: 24, width: 400, maxWidth: "90vw" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", fontWeight: 800 }}>Add Contact</h3>
            <form onSubmit={addContact}>
              {["name", "phone_number", "company"].map((field) => (
                <input
                  key={field}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  placeholder={field.replace("_", " ")}
                  disabled={savingContact}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    marginBottom: 10,
                    boxSizing: "border-box",
                  }}
                />
              ))}
              <select
                value={form.language_preference}
                onChange={(e) => setForm({ ...form, language_preference: e.target.value })}
                disabled={savingContact}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  marginBottom: 10,
                  boxSizing: "border-box",
                  appearance: "none",
                  backgroundColor: "#fff"
                }}
              >
                <option value="Urdu">Urdu</option>
                <option value="English">English</option>
              </select>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Btn
                  variant="secondary"
                  disabled={savingContact}
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </Btn>
                <Btn type="submit" variant="primary" loading={savingContact}>
                  {savingContact ? "Adding…" : "Add"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && (
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
            if (e.target === e.currentTarget) setShowEdit(false);
          }}
        >
          <div
            style={{ background: C.card, borderRadius: 14, padding: 24, width: 400, maxWidth: "90vw" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", fontWeight: 800 }}>Edit Contact</h3>
            <form onSubmit={updateContact}>
              {["name", "phone_number", "company"].map((field) => (
                <input
                  key={field}
                  value={editForm[field]}
                  onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                  placeholder={field.replace("_", " ")}
                  disabled={savingContact}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    marginBottom: 10,
                    boxSizing: "border-box",
                  }}
                />
              ))}
              <select
                value={editForm.language_preference}
                onChange={(e) => setEditForm({ ...editForm, language_preference: e.target.value })}
                disabled={savingContact}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  marginBottom: 10,
                  boxSizing: "border-box",
                  appearance: "none",
                  backgroundColor: "#fff"
                }}
              >
                <option value="Urdu">Urdu</option>
                <option value="English">English</option>
              </select>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Btn
                  variant="secondary"
                  disabled={savingContact}
                  onClick={() => setShowEdit(false)}
                >
                  Cancel
                </Btn>
                <Btn type="submit" variant="primary" loading={savingContact}>
                  {savingContact ? "Saving…" : "Save"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

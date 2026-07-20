import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { formatPKR } from "../../utils/currency";
import {
  createCategoryApi,
  createItemApi,
  createSpecialApi,
  deleteCategoryApi,
  deleteItemApi,
  deleteSpecialApi,
  getCategoriesApi,
  getMenuPreviewApi,
  getSpecialsApi,
  updateCategoryApi,
  updateItemApi,
  updateSpecialApi
} from "../../api/api";
import { Copy, Eye, LayoutList, Pencil, RefreshCw, Search, Tag, Trash, ChevronRight } from "lucide-react";
import { C } from "../../theme/colors";
const Spinner = () => <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
    <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" style={{ opacity: 0.75 }} />
  </svg>;
function CategoryModal({
  initial,
  onClose,
  onSave
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [order, setOrder] = useState(initial?.sort_order ?? 1);
  const [loading, setL] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setL(true);
    try {
      await onSave({ name, description: desc, sort_order: order });
    } finally {
      setL(false);
    }
  };
  return <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)", padding: "0 16px" }}>
      <div style={{ background: C.card, borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,.18)", width: "100%", maxWidth: 440, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
            {initial ? "Edit Category" : "Add Category"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6 }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Name *">
            <input
    required
    value={name}
    onChange={(e) => setName(e.target.value)}
    style={inpStyle}
  />
          </Field>
          <Field label="Description">
            <textarea
    value={desc}
    onChange={(e) => setDesc(e.target.value)}
    rows={2}
    style={{ ...inpStyle, resize: "none" }}
  />
          </Field>
          <Field label="Sort Order">
            <input
    type="number"
    min={1}
    value={order}
    onChange={(e) => setOrder(+e.target.value)}
    style={{ ...inpStyle, width: 112 }}
  />
          </Field>
          <ModalActions
    onClose={onClose}
    loading={loading}
    label={initial ? "Save" : "Add"}
  />
        </form>
      </div>
    </div>;
}
function ItemModal({
  categoryId,
  categoryName,
  initial,
  onClose,
  onSave,
  title: titleProp
}) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    desc: initial?.description ?? "",
    price: initial?.price?.toString() ?? "",
    avail: initial?.is_available ?? true,
    allergens: initial?.allergens ?? "",
    prep: initial?.prep_time_minutes?.toString() ?? "",
    order: initial?.sort_order ?? 1
  });
  const [loading, setL] = useState(false);
  const upd = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    setL(true);
    try {
      await onSave({
        category_id: categoryId,
        name: f.name,
        description: f.desc,
        price: parseFloat(f.price),
        is_available: f.avail,
        allergens: f.allergens,
        prep_time_minutes: f.prep ? parseInt(f.prep) : 0,
        sort_order: f.order
      });
    } finally {
      setL(false);
    }
  };
  return <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)", padding: "0 16px" }}>
      <div style={{ background: C.card, borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,.18)", width: "100%", maxWidth: 520, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
              {titleProp ?? (initial ? "Edit Item" : "Add Item")}
            </h2>
            <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, color: C.textMuted, margin: "3px 0 0" }}>Category: {categoryName}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6 }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Name *">
              <input
    required
    value={f.name}
    onChange={(e) => upd("name", e.target.value)}
    style={inpStyle}
  />
            </Field>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Description">
              <textarea
    value={f.desc}
    onChange={(e) => upd("desc", e.target.value)}
    rows={2}
    style={{ ...inpStyle, resize: "none" }}
  />
            </Field>
          </div>
          <Field label="Price (PKR) *">
            <input
    required
    type="number"
    step="0.01"
    min="0"
    value={f.price}
    onChange={(e) => upd("price", e.target.value)}
    style={inpStyle}
  />
          </Field>
          <Field label="Prep Time (min)">
            <input
    type="number"
    min="0"
    value={f.prep}
    onChange={(e) => upd("prep", e.target.value)}
    style={inpStyle}
  />
          </Field>
          <Field label="Allergens">
            <input
    value={f.allergens}
    onChange={(e) => upd("allergens", e.target.value)}
    placeholder="e.g. gluten, dairy"
    style={inpStyle}
  />
          </Field>
          <Field label="Sort Order">
            <input
    type="number"
    min="1"
    value={f.order}
    onChange={(e) => upd("order", +e.target.value)}
    style={inpStyle}
  />
          </Field>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 600, color: C.textSub }}>Available</label>
            <Toggle value={f.avail} onChange={(v) => upd("avail", v)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <ModalActions
    onClose={onClose}
    loading={loading}
    label={initial ? "Save Changes" : "Add Item"}
  />
          </div>
        </form>
      </div>
    </div>;
}
function SpecialModal({
  initial,
  onClose,
  onSave
}) {
  const [f, setF] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    discount_type: initial?.discount_type ?? "percentage",
    discount_value: initial?.discount_value ?? 0,
    applicable_items: initial?.applicable_items ?? "",
    valid_from: initial?.valid_from?.slice(0, 16) ?? "",
    valid_until: initial?.valid_until?.slice(0, 16) ?? "",
    is_active: initial?.is_active ?? true
  });
  const [loading, setL] = useState(false);
  const upd = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    setL(true);
    try {
      await onSave({
        ...f,
        valid_from: f.valid_from ? new Date(f.valid_from).toISOString() : null,
        valid_until: f.valid_until ? new Date(f.valid_until).toISOString() : null
      });
    } finally {
      setL(false);
    }
  };
  return <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)", padding: "0 16px" }}>
      <div style={{ background: C.card, borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,.18)", width: "100%", maxWidth: 520, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
            {initial ? "Edit Special" : "Add Special"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6 }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Title *">
              <input
    required
    value={f.title}
    onChange={(e) => upd("title", e.target.value)}
    style={inpStyle}
  />
            </Field>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Description">
              <textarea
    value={f.description}
    onChange={(e) => upd("description", e.target.value)}
    rows={2}
    style={{ ...inpStyle, resize: "none" }}
  />
            </Field>
          </div>
          <Field label="Discount Type">
            <div style={{ display: "flex", gap: 6 }}>
              {[["percentage", "% Percentage"], ["fixed", "PKR Fixed Amount"]].map(([val, label]) => <button
    key={val}
    type="button"
    onClick={() => upd("discount_type", val)}
    style={{
      flex: 1,
      fontFamily: "'Sora',sans-serif",
      fontSize: 12,
      fontWeight: 700,
      padding: "8px 10px",
      borderRadius: 8,
      cursor: "pointer",
      background: f.discount_type === val ? C.blueBg : C.inputBg,
      color: f.discount_type === val ? C.blue : C.textSub,
      border: `1.5px solid ${f.discount_type === val ? C.blueBdr : C.inputBorder}`,
      transition: "all .15s"
    }}
  >{label}</button>)}
            </div>
          </Field>
          <Field label="Discount Value">
            <input
    type="number"
    min="0"
    step="0.01"
    value={f.discount_value}
    onChange={(e) => upd("discount_value", +e.target.value)}
    style={inpStyle}
  />
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Applicable Items">
              <input
    value={f.applicable_items}
    onChange={(e) => upd("applicable_items", e.target.value)}
    placeholder="e.g. Drinks, Burgers"
    style={inpStyle}
  />
            </Field>
          </div>
          <Field label="Valid From">
            <input
    type="datetime-local"
    value={f.valid_from}
    onChange={(e) => upd("valid_from", e.target.value)}
    style={inpStyle}
  />
          </Field>
          <Field label="Valid Until">
            <input
    type="datetime-local"
    value={f.valid_until}
    onChange={(e) => upd("valid_until", e.target.value)}
    style={inpStyle}
  />
          </Field>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 600, color: C.textSub }}>Active</label>
            <Toggle value={f.is_active} onChange={(v) => upd("is_active", v)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <ModalActions
    onClose={onClose}
    loading={loading}
    label={initial ? "Save" : "Add Special"}
  />
          </div>
        </form>
      </div>
    </div>;
}
function parseMenuText(text) {
  const sections = [];
  let current = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line === "PRODUCT CATALOG" || line.startsWith("TODAY'S SPECIALS"))
      continue;
    const sectionMatch = line.match(/^===\s*(.+?)\s*===$/);
    if (sectionMatch) {
      current = { title: sectionMatch[1], items: [] };
      sections.push(current);
      continue;
    }
    const itemMatch = line.match(
      /^-\s+(.+?)\s+[—–-]+\s+(?:(?:Rs\.?|PKR)\s*)?([\d,]+(?:\.\d+)?|\$[\d.]+)\s*\|?\s*(.*)?$/i
    );
    if (itemMatch && current) {
      current.items.push({
        name: itemMatch[1].trim(),
        price: itemMatch[2].replace(/,/g, "").replace(/^\$/, ""),
        description: itemMatch[3]?.trim() ?? ""
      });
    }
  }
  return sections;
}
function PreviewModal({
  preview,
  onClose
}) {
  const sections = parseMenuText(preview.menu_text);
  return <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.55)",
      padding: "16px",
      backdropFilter: "blur(6px)",
      animation: "fadeIn .2s both"
    }}
  >
      <div
    style={{
      background: C.card,
      borderRadius: 20,
      boxShadow: "0 32px 80px rgba(0,0,0,.28)",
      width: "100%",
      maxWidth: 760,
      display: "flex",
      flexDirection: "column",
      maxHeight: "92vh",
      overflow: "hidden",
      animation: "fadeUp .25s both"
    }}
  >
        <div
    style={{
      background: "linear-gradient(135deg, #6C65D0 0%, #4A43A8 100%)",
      padding: "22px 24px 20px",
      flexShrink: 0,
      position: "relative",
      overflow: "hidden"
    }}
  >
          
          <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.07)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 60, bottom: -60, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
            <div>
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.6)", letterSpacing: ".12em", textTransform: "uppercase", margin: "0 0 8px" }}>
                Live Product Catalog Preview
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
    { label: "Categories", val: preview.category_count, warn: false, highlight: false },
    { label: "Items", val: preview.item_count, warn: false, highlight: false },
    { label: "Active Specials", val: preview.active_specials_count, warn: false, highlight: preview.active_specials_count > 0 },
    { label: "Unavailable", val: preview.unavailable_items_count, warn: preview.unavailable_items_count > 0, highlight: false }
  ].map((s) => <div
    key={s.label}
    style={{
      display: "flex",
      alignItems: "baseline",
      gap: 5,
      background: "rgba(255,255,255,.12)",
      border: "1px solid rgba(255,255,255,.18)",
      borderRadius: 10,
      padding: "5px 12px"
    }}
  >
                    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 800, color: s.warn ? "#FCA5A5" : s.highlight ? "#FDE68A" : "#fff" }}>
                      {s.val}
                    </span>
                    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, color: "rgba(255,255,255,.65)", fontWeight: 500 }}>
                      {s.label}
                    </span>
                  </div>)}
              </div>
            </div>
            <button
    onClick={onClose}
    style={{
      background: "rgba(255,255,255,.15)",
      border: "1px solid rgba(255,255,255,.25)",
      cursor: "pointer",
      color: "#fff",
      fontSize: 15,
      lineHeight: 1,
      padding: "6px 9px",
      borderRadius: 8,
      transition: "background .15s",
      flexShrink: 0
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,.28)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,.15)";
    }}
  >
              ✕
            </button>
          </div>
        </div>

        <div
    style={{
      overflowY: "auto",
      flex: 1,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 28,
      background: C.pageBg
    }}
  >
          {sections.length === 0 ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 0", gap: 12 }}>
              <span style={{ fontSize: 40 }}>📦</span>
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, color: C.textMuted, margin: 0 }}>No products found in preview.</p>
            </div> : sections.map((section, si) => <div key={section.title} style={{ animation: `fadeUp .3s ${si * 0.07}s both` }}>
                
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 3, background: C.blue, flexShrink: 0 }} />
                  <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 800, color: C.text, textTransform: "uppercase", letterSpacing: ".08em", margin: 0 }}>
                    {section.title}
                  </h3>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, color: C.textMuted, fontWeight: 500, flexShrink: 0 }}>
                    {section.items.length} item{section.items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(255px, 1fr))", gap: 8 }}>
                  {section.items.map((item, i) => <div
    key={i}
    style={{
      background: C.card,
      borderRadius: 12,
      padding: "13px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      border: `1px solid ${C.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,.04)",
      transition: "box-shadow .15s, border-color .15s, transform .15s"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 6px 20px rgba(27,63,122,.14)";
      e.currentTarget.style.borderColor = C.blueBdr;
      e.currentTarget.style.transform = "translateY(-1px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.04)";
      e.currentTarget.style.borderColor = C.border;
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                        <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.4 }}>
                          {item.name}
                        </p>
                        <span
    style={{
      fontFamily: "'Sora',sans-serif",
      fontSize: 13,
      fontWeight: 800,
      color: C.blue,
      flexShrink: 0,
      background: C.blueBg,
      padding: "2px 9px",
      borderRadius: 8,
      border: `1px solid ${C.blueBdr}`
    }}
  >
                          {formatPKR(item.price)}
                        </span>
                      </div>
                      {item.description && <p
    style={{
      fontFamily: "'Sora',sans-serif",
      fontSize: 11,
      color: C.textMuted,
      margin: 0,
      lineHeight: 1.55,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    }}
  >
                          {item.description}
                        </p>}
                    </div>)}
                </div>
              </div>)}
        </div>

        <div
    style={{
      borderTop: `1px solid ${C.border}`,
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
      background: C.card
    }}
  >
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, color: C.textMuted }}>
            This is how your AI reads and references your product catalog
          </span>
          <button
    onClick={onClose}
    style={{
      fontFamily: "'Sora',sans-serif",
      fontSize: 12,
      fontWeight: 700,
      background: C.blue,
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "7px 20px",
      cursor: "pointer",
      transition: "opacity .15s"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = "0.85";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = "1";
    }}
  >
            Close
          </button>
        </div>
      </div>
    </div>;
}
function SpecialCard({
  special,
  onEdit,
  onDelete
}) {
  const [del, setDel] = useState(false);
  const handleDelete = async () => {
    if (!confirm(`Delete "${special.title}"?`)) return;
    setDel(true);
    try {
      await deleteSpecialApi(special.id);
      onDelete();
      toast.success("Special deleted");
    } catch {
      toast.error("Failed to delete special");
    } finally {
      setDel(false);
    }
  };
  return <div
    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, paddingLeft: 13, display: "flex", flexDirection: "column", gap: 12, transition: "box-shadow .15s, border-color .15s", position: "relative", borderLeft: `3px solid ${special.is_active ? C.blue : C.border}` }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)";
      e.currentTarget.style.borderColor = special.is_active ? C.blue : C.border;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = special.is_active ? C.blue : C.border;
    }}
  >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>
              {special.title}
            </p>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: special.is_active ? C.blueBg : C.borderFaint, color: special.is_active ? C.blue : C.textMuted, border: `1px solid ${special.is_active ? C.blueBdr : C.border}` }}>
              {special.is_active ? "\u25CF Active" : "\u25CB Inactive"}
            </span>
          </div>
          {special.description && <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, color: C.textMuted, margin: "3px 0 0" }}>
              {special.description}
            </p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
          <button className="mn-action-btn" onClick={onEdit}><Pencil size={13} /></button>
          <button className="mn-action-btn del" onClick={handleDelete} disabled={del} style={{ opacity: del ? 0.4 : 1 }}>
            {del ? <Spinner /> : <Trash size={13} />}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBdr}`, padding: "3px 10px", borderRadius: 7 }}>
          {special.discount_type === "percentage" ? `${special.discount_value}% off` : `${formatPKR(special.discount_value)} off`}
        </span>
        {special.applicable_items && <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBdr}`, padding: "3px 10px", borderRadius: 7 }}>
            📦 {special.applicable_items}
          </span>}
        {(special.valid_from || special.valid_until) && <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, color: C.textMuted }}>
            {special.valid_from && `From ${new Date(special.valid_from).toLocaleDateString()}`}
            {special.valid_from && special.valid_until && " \xB7 "}
            {special.valid_until && `Until ${new Date(special.valid_until).toLocaleDateString()}`}
          </span>}
      </div>
    </div>;
}
const inpStyle = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "'Sora',sans-serif",
  fontSize: 13,
  border: `1.5px solid ${C.inputBorder}`,
  borderRadius: 8,
  padding: "8px 12px",
  background: C.inputBg,
  color: C.text,
  outline: "none",
  transition: "border-color .15s, box-shadow .15s"
};
function Field({
  label,
  children
}) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 600, color: C.textSub }}>
        {label}
      </label>
      {children}
    </div>;
}
function Toggle({
  value,
  onChange
}) {
  return <button
    type="button"
    onClick={() => onChange(!value)}
    style={{
      position: "relative",
      width: 40,
      height: 20,
      borderRadius: 20,
      background: value ? C.blue : "rgba(0,0,0,.18)",
      border: "none",
      cursor: "pointer",
      transition: "background .2s",
      flexShrink: 0
    }}
  >
      <span
    style={{
      position: "absolute",
      top: 2,
      left: value ? 22 : 2,
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: "#fff",
      boxShadow: "0 1px 4px rgba(0,0,0,.2)",
      transition: "left .2s"
    }}
  />
    </button>;
}
function ModalActions({
  onClose,
  loading,
  label
}) {
  return <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
      <button
    type="button"
    onClick={onClose}
    style={{
      flex: 1,
      border: `1.5px solid ${C.border}`,
      borderRadius: 10,
      padding: "10px 0",
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "'Sora',sans-serif",
      color: C.textSub,
      background: "transparent",
      cursor: "pointer"
    }}
  >
        Cancel
      </button>
      <button
    type="submit"
    disabled={loading}
    style={{
      flex: 1,
      background: C.blue,
      color: "#fff",
      border: "none",
      borderRadius: 10,
      padding: "10px 0",
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "'Sora',sans-serif",
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.6 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }}
  >
        {loading ? <><Spinner /> Saving...</> : label}
      </button>
    </div>;
}
function Menu() {
  const [categories, setCategories] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingSpecials, setLoadingSpec] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [mainTab, setMainTab] = useState("menu");
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [showUnavailOnly, setShowUnavailOnly] = useState(false);
  const [catModal, setCatModal] = useState(null);
  const [editCat, setEditCat] = useState(null);
  const [itemModal, setItemModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [specialModal, setSpecialModal] = useState(null);
  const [editSpecial, setEditSpecial] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deletingCat, setDeletingCat] = useState(null);
  const [loadingPreview, setLoadingPrev] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [selectedItems, setSelectedItems] = useState(/* @__PURE__ */ new Set());
  const [isDuplicating, setIsDuplicating] = useState(false);
  const fetchCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const data = await getCategoriesApi();
      setCategories(data);
      setActiveTab((prev) => {
        if (data.length > 0 && !prev) return data[0].id;
        return prev;
      });
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setLoadingCats(false);
    }
  }, []);
  const fetchSpecials = useCallback(async () => {
    setLoadingSpec(true);
    try {
      setSpecials(await getSpecialsApi(activeOnly));
    } catch {
      toast.error("Failed to load specials");
    } finally {
      setLoadingSpec(false);
    }
  }, [activeOnly]);
  const fetchPreview = async () => {
    setLoadingPrev(true);
    try {
      const p = await getMenuPreviewApi();
      setPreview(p);
      setShowPreview(true);
    } catch {
      toast.error("Failed to load preview");
    } finally {
      setLoadingPrev(false);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  useEffect(() => {
    if (mainTab === "specials") fetchSpecials();
  }, [mainTab, fetchSpecials]);
  useEffect(() => {
    setSelectedItems(/* @__PURE__ */ new Set());
  }, [activeTab]);
  const handleSaveCat = async (d) => {
    try {
      if (catModal === "edit" && editCat) {
        const u = await updateCategoryApi(editCat.id, d);
        setCategories(
          (prev) => prev.map((c) => c.id === u.id ? { ...c, ...u } : c)
        );
        toast.success("Category updated");
      } else {
        await createCategoryApi(d);
        await fetchCategories();
        toast.success("Category added");
      }
      setCatModal(null);
      setEditCat(null);
    } catch {
      toast.error("Failed to save category");
      throw new Error();
    }
  };
  const handleDeleteCat = async (cat) => {
    if (!confirm(`Delete "${cat.name}" and all its items?`)) return;
    setDeletingCat(cat.id);
    try {
      await deleteCategoryApi(cat.id);
      const rest = categories.filter((c) => c.id !== cat.id);
      setCategories(rest);
      if (activeTab === cat.id) setActiveTab(rest[0]?.id ?? null);
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeletingCat(null);
    }
  };
  const handleAddItem = async (d) => {
    try {
      const item = await createItemApi(d);
      setCategories(
        (prev) => prev.map(
          (c) => c.id === item.category_id ? { ...c, items: [...c.items, item] } : c
        )
      );
      setItemModal(null);
      setEditItem(null);
      setIsDuplicating(false);
      toast.success("Item added");
    } catch {
      toast.error("Failed to add item");
      throw new Error();
    }
  };
  const handleUpdateItem = async (d) => {
    if (!editItem) return;
    try {
      const updated = await updateItemApi(editItem.id, d);
      setCategories(
        (prev) => prev.map(
          (c) => c.id === updated.category_id ? {
            ...c,
            items: c.items.map((i) => i.id === updated.id ? updated : i)
          } : c
        )
      );
      setItemModal(null);
      setEditItem(null);
      setIsDuplicating(false);
      toast.success("Item updated");
    } catch {
      toast.error("Failed to update item");
      throw new Error();
    }
  };
  const handleDeleteItem = (categoryId, itemId) => setCategories(
    (prev) => prev.map(
      (c) => c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
    )
  );
  const handleDuplicateItem = (item) => {
    const cat = categories.find((c) => c.id === activeTab);
    if (!cat) return;
    setIsDuplicating(true);
    setEditItem(item);
    setItemModal(cat);
  };
  const handleSaveSpecial = async (d) => {
    try {
      if (specialModal === "edit" && editSpecial) {
        const u = await updateSpecialApi(editSpecial.id, d);
        setSpecials((prev) => prev.map((s) => s.id === u.id ? u : s));
        toast.success("Special updated");
      } else {
        const s = await createSpecialApi(d);
        setSpecials((prev) => [...prev, s]);
        toast.success("Special added");
      }
      setSpecialModal(null);
      setEditSpecial(null);
    } catch {
      toast.error("Failed to save special");
      throw new Error();
    }
  };
  const handleDeleteSpecial = (id) => setSpecials((prev) => prev.filter((s) => s.id !== id));
  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);
  const allAvailItems = categories.reduce((sum, c) => sum + c.items.filter((i) => i.is_available).length, 0);
  const allOffItems = totalItems - allAvailItems;
  const activeCat = categories.find((c) => c.id === activeTab);
  const allCatItems = activeCat?.items ?? [];
  const availCount = allCatItems.filter((i) => i.is_available).length;
  const offCount = allCatItems.length - availCount;
  const avgPrice = allCatItems.length > 0 ? allCatItems.reduce((s, i) => s + (i.price ?? 0), 0) / allCatItems.length : 0;
  const filteredItems = allCatItems.filter(
    (i) => (!showUnavailOnly || !i.is_available) && (i.name.toLowerCase().includes(search.toLowerCase()) || (i.description ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "price_asc") return (a.price ?? 0) - (b.price ?? 0);
    if (sortBy === "price_desc") return (b.price ?? 0) - (a.price ?? 0);
    if (sortBy === "avail") return (b.is_available ? 1 : 0) - (a.is_available ? 1 : 0);
    return a.name.localeCompare(b.name);
  });
  const activeSpecialCount = specials.filter((s) => s.is_active).length;
  const allSelectedOnPage = sortedItems.length > 0 && sortedItems.every((i) => selectedItems.has(i.id));
  const [expandedItems, setExpandedItems] = useState(/* @__PURE__ */ new Set());
  const toggleExpand = (id) => setExpandedItems((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  return <div style={{ fontFamily: "'Sora',sans-serif", WebkitFontSmoothing: "antialiased", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: C.pageBg }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes expandDown { from { opacity:0; transform:translateY(-6px); max-height:0; } to { opacity:1; transform:translateY(0); max-height:300px; } }
        .mn-topbar-tab { background: none; border: none; cursor: pointer; font-family:'Sora',sans-serif; font-size:13px; font-weight:600; padding:10px 16px; color:${C.textMuted}; border-bottom:2px solid transparent; transition:color .15s, border-color .15s; display:flex; align-items:center; gap:6px; flex-shrink:0; }
        .mn-topbar-tab.active { color:${C.text}; border-bottom-color:${C.blue}; font-weight:700; }
        .mn-topbar-tab:hover:not(.active) { color:${C.textSub}; }
        .mn-stats-strip { display:flex; align-items:stretch; background:${C.card}; border-bottom:1px solid ${C.border}; flex-shrink:0; overflow-x:auto; animation:fadeIn .35s both; }
        .mn-stat-cell { display:flex; align-items:center; gap:10px; padding:11px 20px; border-right:1px solid ${C.borderFaint}; white-space:nowrap; }
        .mn-stat-cell:last-child { border-right:none; }
        .mn-cat-sidebar-group { position:relative; margin:2px 0; }
        .mn-cat-sidebar-btn { display:flex; align-items:flex-start; gap:8px; width:100%; padding:9px 10px; border:none; background:transparent; cursor:pointer; border-radius:8px; font-family:'Sora',sans-serif; font-size:13px; font-weight:600; color:${C.textSub}; transition:background .12s, color .12s; text-align:left; }
        .mn-cat-sidebar-btn:hover:not(.active) { background:${C.inputBg}; color:${C.text}; }
        .mn-cat-sidebar-btn.active { background:${C.blueBg}; color:${C.blue}; }
        .mn-cat-sidebar-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px; display:block; }
        .mn-cat-count { transition:opacity .12s; margin-top:1px; }
        .mn-cat-sidebar-group:hover .mn-cat-count { opacity:0; }
        .mn-cat-sidebar-group .cat-sidebar-actions { display:none; position:absolute; right:7px; top:50%; transform:translateY(-50%); background:${C.card}; border:1px solid ${C.border}; border-radius:7px; padding:2px 3px; z-index:5; box-shadow:0 2px 8px rgba(0,0,0,.08); }
        .mn-cat-sidebar-group:hover .cat-sidebar-actions { display:flex; align-items:center; gap:1px; }
        .mn-row { display:grid; grid-template-columns:28px 1fr 80px 90px 80px; align-items:center; gap:10px; padding:11px 16px; border-bottom:1px solid ${C.borderFaint}; cursor:pointer; transition:background .12s; }
        .mn-row:hover { background:${C.rowHover}; }
        .mn-row.mn-row-off { background:rgba(217,65,64,.018); }
        .mn-row.mn-row-off:hover { background:rgba(217,65,64,.036); }
        .mn-row.mn-row-sel { background:${C.blueBg}; }
        .mn-row.mn-row-sel:hover { background:rgba(27,63,122,.13); }
        .mn-cb { width:15px; height:15px; accent-color:${C.blue}; cursor:pointer; flex-shrink:0; margin:0; }
        .mn-action-btn { background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:5px; border-radius:6px; color:${C.textMuted}; transition:color .12s, background .12s; }
        .mn-action-btn:hover { color:${C.blue}; background:${C.blueBg}; }
        .mn-action-btn.del:hover { color:${C.blue}; background:${C.blueBg}; }
        .mn-search-wrap { display:flex; align-items:center; gap:8px; background:${C.card}; border:1.5px solid ${C.inputBorder}; border-radius:8px; padding:7px 12px; flex:1; min-width:0; max-width:280px; transition:border-color .15s, box-shadow .15s; }
        .mn-search-wrap:focus-within { border-color:${C.blue}; box-shadow:0 0 0 3px ${C.blueBdr}; }
        .mn-search-input { background:none; border:none; outline:none; font-family:'Sora',sans-serif; font-size:13px; color:${C.text}; flex:1; min-width:0; }
        .mn-search-input::placeholder { color:${C.textGhost}; }
        .mn-pill-btn { font-family:'Sora',sans-serif; font-size:12px; font-weight:600; border-radius:7px; padding:5px 12px; cursor:pointer; border:1.5px solid transparent; transition:all .15s; white-space:nowrap; }
        .mn-add-item-btn:hover { color:${C.blue} !important; background:${C.blueBg} !important; border-color:${C.blueBdr} !important; }
        .mn-modal-inp:focus { border-color:${C.blue} !important; box-shadow:0 0 0 3px ${C.blueBdr} !important; }
        .mn-expanded-panel { animation:expandDown .18s both; overflow:hidden; }
        .mn-special-card { animation:fadeUp .3s both; }
      `}</style>

      <div style={{ background: C.topBar, borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 8px rgba(0,0,0,.05)", flexShrink: 0 }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", gap: 12, flexWrap: "wrap" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Product Catalog</h1>
            <span style={{ fontSize: 11, fontWeight: 600, background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBdr}`, borderRadius: 20, padding: "2px 9px" }}>
              Catalog synced
            </span>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>
              Synced just now
            </span>
          </div>

          
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
    onClick={fetchCategories}
    disabled={loadingCats}
    style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, background: C.blueBg, color: C.blue, border: `1.5px solid ${C.blueBdr}`, borderRadius: 8, padding: "6px 14px", cursor: loadingCats ? "not-allowed" : "pointer", opacity: loadingCats ? 0.6 : 1 }}
  >
              <RefreshCw size={13} style={{ animation: loadingCats ? "spin 1s linear infinite" : "none" }} />
              Sync
            </button>
            <button
    onClick={fetchPreview}
    disabled={loadingPreview}
    style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, background: C.card, color: C.textSub, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", cursor: loadingPreview ? "not-allowed" : "pointer", opacity: loadingPreview ? 0.6 : 1 }}
  >
              {loadingPreview ? <Spinner /> : <Eye size={13} />}
              Preview
            </button>
            
            <span style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />
            {mainTab === "menu" && activeCat && <button
    onClick={() => setItemModal(activeCat)}
    style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}
  >
                + Item
              </button>}
            {mainTab === "specials" && <button
    onClick={() => {
      setSpecialModal("add");
      setEditSpecial(null);
    }}
    style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}
  >
                + Special
              </button>}
          </div>
        </div>

        
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px 0", borderTop: `1px solid ${C.borderFaint}`, flexWrap: "wrap" }}>
          
          {["menu", "specials"].map((t) => <button
    key={t}
    onClick={() => setMainTab(t)}
    className={`mn-topbar-tab${mainTab === t ? " active" : ""}`}
  >
              {t === "menu" ? <LayoutList size={14} /> : <Tag size={14} />}
              {t === "menu" ? "Products" : "Specials"}
              {t === "specials" && activeSpecialCount > 0 && <span style={{ fontSize: 10, background: C.blueBg, color: C.blue, fontWeight: 700, padding: "1px 7px", borderRadius: 20, lineHeight: 1.6 }}>
                  {activeSpecialCount}
                </span>}
            </button>)}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
            
            <div className="mn-search-wrap">
              <Search size={14} color={C.textMuted} />
              <input
    className="mn-search-input"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search items..."
  />
              {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 0, fontSize: 12 }}>✕</button>}
            </div>

            
            {mainTab === "menu" && <button
    onClick={() => setShowUnavailOnly((prev) => !prev)}
    className="mn-pill-btn"
    style={{
      background: showUnavailOnly ? C.blueBg : "transparent",
      color: showUnavailOnly ? C.blue : C.textSub,
      border: `1.5px solid ${showUnavailOnly ? C.blueBdr : C.border}`
    }}
  >
                Out of Stock
              </button>}

            
            {mainTab === "menu" && <div style={{ display: "flex", alignItems: "center", gap: 2, background: C.inputBg, borderRadius: 9, padding: "3px", border: `1px solid ${C.borderFaint}` }}>
                {["name", "price_asc", "price_desc", "avail"].map((v) => {
    const labels = { name: "A\u2013Z", price_asc: "Price \u2191", price_desc: "Price \u2193", avail: "Available" };
    return <button
      key={v}
      onClick={() => setSortBy(v)}
      style={{
        fontFamily: "'Sora',sans-serif",
        fontSize: 11,
        fontWeight: sortBy === v ? 700 : 500,
        padding: "4px 10px",
        borderRadius: 6,
        cursor: "pointer",
        whiteSpace: "nowrap",
        background: sortBy === v ? C.card : "transparent",
        color: sortBy === v ? C.text : C.textMuted,
        border: sortBy === v ? `1px solid ${C.border}` : "none",
        boxShadow: sortBy === v ? "0 1px 3px rgba(0,0,0,.08)" : "none",
        transition: "all .12s"
      }}
    >{labels[v]}</button>;
  })}
              </div>}

            
            {mainTab === "specials" && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textSub }}>Active only</span>
                <Toggle value={activeOnly} onChange={(v) => setActiveOnly(v)} />
              </div>}
          </div>
        </div>
      </div>

      {!loadingCats && categories.length > 0 && <div className="mn-stats-strip">
          {[
    { label: "Categories", value: categories.length, color: C.blue },
    { label: "Total Items", value: totalItems, color: C.text },
    { label: "Available", value: allAvailItems, color: C.blue },
    ...allOffItems > 0 ? [{ label: "86'd", value: allOffItems, color: C.blue }] : [],
    ...activeSpecialCount > 0 ? [{ label: "Active Specials", value: activeSpecialCount, color: C.gold }] : []
  ].map((s) => <div key={s.label} className="mn-stat-cell">
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value}
              </span>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, fontWeight: 600, color: C.textMuted }}>
                {s.label}
              </span>
            </div>)}
          <div style={{ flex: 1 }} />
          {allOffItems > 0 && <div className="mn-stat-cell" style={{ borderRight: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 120, height: 6, borderRadius: 3, background: C.blueBg, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${allAvailItems / totalItems * 100}%`, background: C.blue, borderRadius: 3, transition: "width .4s ease" }} />
                </div>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 11, color: C.textMuted, fontWeight: 500 }}>
                  {Math.round(allAvailItems / totalItems * 100)}% available
                </span>
              </div>
            </div>}
        </div>}

      {mainTab === "menu" && <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", background: C.card, borderRight: `1px solid ${C.border}` }}>
            <div style={{ padding: "14px 14px 8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".07em" }}>Categories</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: C.inputBg, color: C.textGhost, borderRadius: 6, padding: "1px 7px" }}>{categories.length}</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 4px" }}>
              {loadingCats ? [1, 2, 3].map((i) => <div key={i} style={{ height: 36, background: C.borderFaint, borderRadius: 8, margin: "4px 0", animation: "pulse 1.5s infinite" }} />) : categories.map((cat) => {
    const isActive = activeTab === cat.id;
    const catAvail = cat.items.filter((i) => i.is_available).length;
    const catTotal = cat.items.length;
    const availPct = catTotal > 0 ? catAvail / catTotal : 1;
    const barColor = availPct === 1 ? C.blue : availPct >= 0.5 ? C.gold : C.blue;
    return <div key={cat.id} className="mn-cat-sidebar-group">
                        <button
      onClick={() => setActiveTab(cat.id)}
      className={`mn-cat-sidebar-btn${isActive ? " active" : ""}`}
    >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span className="mn-cat-sidebar-name">{cat.name}</span>
                            {catTotal > 0 && <div style={{ height: 3, borderRadius: 2, background: isActive ? "rgba(27,63,122,.18)" : C.borderFaint, marginTop: 5, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${availPct * 100}%`, borderRadius: 2, background: isActive ? C.blue : barColor, transition: "width .35s ease" }} />
                              </div>}
                          </div>
                          <span className="mn-cat-count" style={{ fontSize: 10, background: isActive ? C.blueBg : C.inputBg, color: isActive ? C.blue : C.textMuted, padding: "1px 7px", borderRadius: 8, fontWeight: 700, flexShrink: 0 }}>
                            {catAvail}/{catTotal}
                          </span>
                        </button>
                        <div className="cat-sidebar-actions">
                          <button className="mn-action-btn" style={{ padding: 4 }} title="Edit" onClick={(e) => {
      e.stopPropagation();
      setEditCat(cat);
      setCatModal("edit");
    }}><Pencil size={11} /></button>
                          <button className="mn-action-btn del" style={{ padding: 4 }} title="Delete" disabled={deletingCat === cat.id} onClick={(e) => {
      e.stopPropagation();
      handleDeleteCat(cat);
    }}>
                            {deletingCat === cat.id ? <Spinner /> : <Trash size={11} />}
                          </button>
                        </div>
                      </div>;
  })}
            </div>

            
            <div style={{ padding: "8px", borderTop: `1px solid ${C.borderFaint}`, flexShrink: 0 }}>
              <button
    onClick={() => {
      setCatModal("add");
      setEditCat(null);
    }}
    className="mn-add-item-btn"
    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, color: C.textSub, background: "transparent", border: `1.5px dashed ${C.border}`, borderRadius: 8, cursor: "pointer", transition: "color .12s, background .12s, border-color .12s" }}
  >
                + New Category
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            {loadingCats ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3, 4].map((i) => <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, height: 52, animation: "pulse 1.5s infinite" }} />)}
              </div> : !activeCat ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, paddingTop: 80 }}>
                <span style={{ fontSize: 48 }}>📦</span>
                <p style={{ color: C.textMuted, fontSize: 13 }}>No categories yet.</p>
                <button onClick={() => setCatModal("add")} style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, background: C.blue, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer" }}>
                  + Add First Category
                </button>
              </div> : <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", animation: "fadeUp .28s both" }}>
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.borderFaint}`, background: C.filtersBar, gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: C.blue, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{activeCat.name}</span>
                    {activeCat.description && <span style={{ fontSize: 12, color: C.textMuted }}>{activeCat.description}</span>}
                    {(search || showUnavailOnly) && <span style={{ fontSize: 10, fontWeight: 700, background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBdr}`, borderRadius: 4, padding: "1px 6px" }}>filtered</span>}
                  </div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{allCatItems.length}</span>
                      <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>items</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: C.blue }}>{availCount}</span>
                      <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>on</span>
                    </div>
                    {offCount > 0 && <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: C.blue }}>{offCount}</span>
                        <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>86'd</span>
                      </div>}
                    {allCatItems.length > 0 && <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.textSub }}>{formatPKR(avgPrice)}</span>
                        <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>avg</span>
                      </div>}
                  </div>
                </div>

                {
    /* Column header row */
  }
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 90px 80px", gap: 10, padding: "7px 16px 7px 12px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <input
    type="checkbox"
    className="mn-cb"
    checked={allSelectedOnPage}
    onChange={(e) => {
      if (e.target.checked) setSelectedItems(new Set(sortedItems.map((i) => i.id)));
      else setSelectedItems(/* @__PURE__ */ new Set());
    }}
  />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Item · {filteredItems.length} shown
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", textAlign: "right" }}>Price</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", textAlign: "center" }}>Avail.</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", textAlign: "center" }}>Actions</span>
                </div>

                {
    /* Bulk action bar — visible when items are selected */
  }
                {selectedItems.size > 0 && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px 8px 12px", background: C.blueBg, borderBottom: `1px solid ${C.blueBdr}`, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, color: C.blue }}>{selectedItems.size} selected</span>
                    <button
    onClick={async () => {
      const ids = [...selectedItems];
      await Promise.all(ids.map((id) => updateItemApi(id, { is_available: true }).catch(() => {
      })));
      setCategories((prev) => prev.map((c) => ({ ...c, items: c.items.map((i) => selectedItems.has(i.id) ? { ...i, is_available: true } : i) })));
      setSelectedItems(/* @__PURE__ */ new Set());
      toast.success(`${ids.length} item${ids.length !== 1 ? "s" : ""} enabled`);
    }}
    style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBdr}`, borderRadius: 7, padding: "4px 11px", cursor: "pointer" }}
  >Enable all</button>
                    <button
    onClick={async () => {
      const ids = [...selectedItems];
      await Promise.all(ids.map((id) => updateItemApi(id, { is_available: false }).catch(() => {
      })));
      setCategories((prev) => prev.map((c) => ({ ...c, items: c.items.map((i) => selectedItems.has(i.id) ? { ...i, is_available: false } : i) })));
      setSelectedItems(/* @__PURE__ */ new Set());
      toast.success(`${ids.length} item${ids.length !== 1 ? "s" : ""} disabled`);
    }}
    style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBdr}`, borderRadius: 7, padding: "4px 11px", cursor: "pointer" }}
  >86 all</button>
                    <button
    onClick={async () => {
      if (!confirm(`Delete ${selectedItems.size} item${selectedItems.size !== 1 ? "s" : ""}?`)) return;
      const ids = [...selectedItems];
      await Promise.all(ids.map((id) => deleteItemApi(id).catch(() => {
      })));
      const catId = activeCat?.id;
      if (catId) setCategories((prev) => prev.map((c) => c.id === catId ? { ...c, items: c.items.filter((i) => !selectedItems.has(i.id)) } : c));
      setSelectedItems(/* @__PURE__ */ new Set());
      toast.success(`${ids.length} item${ids.length !== 1 ? "s" : ""} deleted`);
    }}
    style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, background: "transparent", color: C.blue, border: `1px solid ${C.blueBdr}`, borderRadius: 7, padding: "4px 11px", cursor: "pointer" }}
  >Delete</button>
                    <button onClick={() => setSelectedItems(/* @__PURE__ */ new Set())} style={{ marginLeft: "auto", fontFamily: "'Sora',sans-serif", fontSize: 12, color: C.textMuted, background: "transparent", border: "none", cursor: "pointer", padding: "4px 0" }}>✕ Clear</button>
                  </div>}

                {filteredItems.length === 0 ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 10 }}>
                    <span style={{ fontSize: 36 }}>📦</span>
                    <p style={{ color: C.textMuted, fontSize: 13 }}>{search ? "No items match your search." : "No items yet."}</p>
                    {!search && <button onClick={() => setItemModal(activeCat)} style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>
                        + Add First Item
                      </button>}
                  </div> : <>
                    {sortedItems.map((item) => {
    const expanded = expandedItems.has(item.id);
    const isSelected = selectedItems.has(item.id);
    return <div key={item.id}>
                          {
      /* Item row */
    }
                          <div
      className={`mn-row${!item.is_available ? " mn-row-off" : ""}${isSelected ? " mn-row-sel" : ""}`}
      onClick={() => toggleExpand(item.id)}
    >
                            {
      /* Select checkbox */
    }
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" className="mn-cb" checked={isSelected} onChange={(e) => {
      setSelectedItems((prev) => {
        const next = new Set(prev);
        if (e.target.checked) next.add(item.id);
        else next.delete(item.id);
        return next;
      });
    }} />
                            </div>
                            {
      /* Name + expand caret */
    }
                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                              <span style={{ color: expanded ? C.blue : C.textGhost, flexShrink: 0, transition: "transform .15s, color .15s", transform: expanded ? "rotate(90deg)" : "none", display: "flex" }}>
                                <ChevronRight size={14} />
                              </span>
                              <div style={{ minWidth: 0 }}>  
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: item.is_available ? C.text : C.textMuted, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: item.is_available ? "none" : "line-through" }}>{item.name}</p>
                                  {!item.is_available && <span style={{ fontSize: 10, fontWeight: 700, background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBdr}`, borderRadius: 4, padding: "1px 5px", flexShrink: 0, lineHeight: 1.4 }}>OFF</span>}
                                </div>
                                {item.description && <p style={{ fontSize: 11, color: C.textMuted, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.description}</p>}
                              </div>
                            </div>

                            {
      /* Price */
    }
                            <span style={{ fontSize: 13, fontWeight: 700, color: item.is_available ? C.text : C.textMuted, textAlign: "right" }}>
                              {formatPKR(item.price ?? 0)}
                            </span>

                            {
      /* Availability toggle (kill switch) */
    }
                            <div style={{ display: "flex", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
                              <Toggle
      value={item.is_available}
      onChange={async (v) => {
        try {
          const updated = await updateItemApi(item.id, { is_available: v });
          setCategories(
            (prev) => prev.map(
              (c) => c.id === updated.category_id ? { ...c, items: c.items.map((i) => i.id === updated.id ? updated : i) } : c
            )
          );
          toast.success(v ? "Item enabled" : "Item hidden from menu");
        } catch {
          toast.error("Failed to update availability");
        }
      }}
    />
                            </div>

                            {
      /* Actions */
    }
                            <div style={{ display: "flex", justifyContent: "center", gap: 2 }} onClick={(e) => e.stopPropagation()}>
                              <button className="mn-action-btn" title="Edit" onClick={() => {
      setIsDuplicating(false);
      setEditItem(item);
      setItemModal(activeCat);
    }}><Pencil size={13} /></button>
                              <button className="mn-action-btn" title="Duplicate" onClick={() => handleDuplicateItem(item)}><Copy size={13} /></button>
                              <button
      className="mn-action-btn del"
      title="Delete"
      onClick={async () => {
        if (!confirm(`Delete "${item.name}"?`)) return;
        try {
          await deleteItemApi(item.id);
          handleDeleteItem(activeCat.id, item.id);
          setSelectedItems((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          toast.success("Item deleted");
        } catch {
          toast.error("Failed to delete item");
        }
      }}
    >
                                <Trash size={13} />
                              </button>
                            </div>
                          </div>

                          {
      /* Expanded detail panel */
    }
                          {expanded && <div className="mn-expanded-panel" style={{ background: C.pageBg, borderBottom: `1px solid ${C.borderFaint}`, padding: "12px 16px 14px", borderLeft: `3px solid ${C.blue}` }}>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingLeft: 22 }}>
                                {item.description && <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", flex: "2 1 200px", minWidth: 0 }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 4px" }}>Description</p>
                                    <p style={{ fontSize: 12, color: C.textSub, margin: 0, lineHeight: 1.6 }}>{item.description}</p>
                                  </div>}
                                {item.allergens && <div style={{ background: C.goldBg, border: `1px solid ${C.goldBdr}`, borderRadius: 10, padding: "10px 14px", flex: "1 1 140px" }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 6px" }}>Allergens</p>
                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                      {item.allergens.split(/,\s*/).map((a) => <span key={a} style={{ fontSize: 11, fontWeight: 600, background: "rgba(184,131,42,.14)", color: C.gold, border: `1px solid ${C.goldBdr}`, borderRadius: 5, padding: "2px 8px" }}>{a.trim()}</span>)}
                                    </div>
                                  </div>}
                                {item.prep_time_minutes != null && item.prep_time_minutes > 0 && <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", flex: "0 0 auto" }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 4px" }}>Prep Time</p>
                                    <p style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>{item.prep_time_minutes}<span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginLeft: 3 }}>min</span></p>
                                  </div>}
                                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", flex: "0 0 auto" }}>
                                  <p style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 4px" }}>Product ID</p>
                                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 700, background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBdr}`, borderRadius: 6, padding: "3px 10px", display: "inline-block" }}>
                                    {item.id.slice(0, 8)}
                                  </span>
                                </div>
                              </div>
                            </div>}
                        </div>;
  })}

                    {
    /* Add item row */
  }
                    <button
    onClick={() => setItemModal(activeCat)}
    className="mn-add-item-btn"
    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, color: C.textMuted, background: "transparent", border: "none", borderTop: `1px dashed ${C.border}`, cursor: "pointer", transition: "color .12s, background .12s" }}
  >
                      + Add Item
                    </button>
                  </>}
              </div>}
          </div>
        </div>}

      {mainTab === "specials" && <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {loadingSpecials ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {[1, 2, 3].map((i) => <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, height: 120, animation: "pulse 1.5s infinite" }} />)}
            </div> : specials.length === 0 ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 }}>
              <span style={{ fontSize: 48 }}>🏷</span>
              <p style={{ color: C.textMuted, fontSize: 13 }}>No specials found.</p>
              <button onClick={() => {
    setSpecialModal("add");
    setEditSpecial(null);
  }} style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, background: C.blue, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer" }}>
                + Add First Special
              </button>
            </div> : <>
              {
    /* Specials summary bar */
  }
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap", animation: "fadeUp .25s both" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, background: C.blue, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: C.text }}>
                    {activeSpecialCount} active
                  </span>
                </div>
                {specials.length - activeSpecialCount > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: C.border, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 600, color: C.textMuted }}>
                      {specials.length - activeSpecialCount} inactive
                    </span>
                  </div>}
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, color: C.textMuted }}>
                  {specials.length} total special{specials.length !== 1 ? "s" : ""}
                </span>
              </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {specials.map((s, si) => <div key={s.id} className="mn-special-card" style={{ animationDelay: `${si * 0.06}s` }}>
                  <SpecialCard
    special={s}
    onEdit={() => {
      setEditSpecial(s);
      setSpecialModal("edit");
    }}
    onDelete={() => handleDeleteSpecial(s.id)}
  />
                </div>)}
            </div>
            </>}
        </div>}

      {catModal && <CategoryModal
    initial={catModal === "edit" ? editCat : null}
    onClose={() => {
      setCatModal(null);
      setEditCat(null);
    }}
    onSave={handleSaveCat}
  />}
      {itemModal && <ItemModal
    categoryId={itemModal.id}
    categoryName={itemModal.name}
    initial={editItem}
    onClose={() => {
      setItemModal(null);
      setEditItem(null);
      setIsDuplicating(false);
    }}
    onSave={editItem && !isDuplicating ? handleUpdateItem : handleAddItem}
    title={isDuplicating ? "Duplicate Item" : void 0}
  />}
      {specialModal && <SpecialModal
    initial={specialModal === "edit" ? editSpecial : null}
    onClose={() => {
      setSpecialModal(null);
      setEditSpecial(null);
    }}
    onSave={handleSaveSpecial}
  />}
      {showPreview && preview && <PreviewModal preview={preview} onClose={() => setShowPreview(false)} />}
    </div>;
}
export {
  Menu as default
};

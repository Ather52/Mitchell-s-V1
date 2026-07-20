import csv
import io
import json
import re

E164_PATTERN = re.compile(r"^\+[1-9]\d{1,14}$")

CAMPAIGN_STATUSES = {"draft", "active", "paused", "completed"}
CONTACT_STATUSES = {"pending", "calling", "completed", "failed"}
CUSTOMER_TYPES = {"new", "existing"}

OUTBOUND_CALL_STATUSES = frozenset({
    "registered", "ongoing", "ended", "completed", "failed",
})
RETELL_FAILED_STATUSES = frozenset({"error", "not_connected"})


def map_retell_call_status(call_data: dict, event_type: str = "") -> str | None:
    event = (event_type or "").strip().lower()
    retell = (call_data.get("call_status") or "").strip().lower()

    if event == "call_started":
        return "ongoing"

    if event in ("call_ended", "call_analyzed", "post_call_analysis"):
        if retell in RETELL_FAILED_STATUSES:
            return "failed"
        return "ended"

    if retell in RETELL_FAILED_STATUSES:
        return "failed"
    if retell == "ended" or call_data.get("end_timestamp"):
        return "ended"
    if retell == "ongoing":
        return "ongoing"
    if retell == "registered":
        return "registered"

    return None


def contact_status_for_call_status(call_status: str | None) -> str | None:
    if not call_status:
        return None
    if call_status in ("ended", "completed"):
        return "completed"
    if call_status == "failed":
        return "failed"
    if call_status == "ongoing":
        return "calling"
    return None

OUTBOUND_META_KEYS = (
    "shop_name",
    "owner_name",
    "customer_city",
    "last_order",
    "customer_type",
)

OWN_COMPANY_MARKERS = (
    "mitchell",
    "mitchells",
    "mitchell's",
    "fruit farms",
    "mitchell fruit",
)

INVALID_CONTACT_VALUES = {
    "unknown",
    "n/a",
    "na",
    "none",
    "null",
    "undefined",
    "the user",
    "the customer",
    "the client",
    "the distributor",
    "the retailer",
    "the agent",
}


def is_own_company_value(value: str | None) -> bool:
    if not value:
        return False
    # Remove apostrophes first, then replace non-alphanumerics with space
    normalized = re.sub(r"[^a-z0-9]+", " ", value.lower().replace("'", "")).strip()
    return any(marker.replace("'", "") in normalized for marker in OWN_COMPANY_MARKERS)


def clean_customer_value(value: str | None, *, allow_own_company: bool = False) -> str | None:
    if not value:
        return None
    cleaned = re.sub(r"\s+", " ", str(value)).strip(" \t\r\n.,;:-")
    # Strip common titles
    cleaned = re.sub(r"^(?:mr\.|mrs\.|ms\.|mr|mrs|ms)\s+", "", cleaned, flags=re.IGNORECASE).strip()
    
    if not cleaned:
        return None
    if cleaned.lower() in INVALID_CONTACT_VALUES:
        return None
    if not allow_own_company and is_own_company_value(cleaned):
        return None
    return cleaned


def format_last_order(order) -> str:
    if not order:
        return ""
    items = order.order_items
    if isinstance(items, list):
        parts = []
        for item in items:
            if isinstance(item, dict):
                name = (
                    item.get("name")
                    or item.get("item_name")
                    or str(item)
                )
                qty = item.get("quantity") or item.get("qty") or 1
                parts.append(f"{qty}x {name}")
            else:
                parts.append(str(item))
        return ", ".join(parts)
    if items:
        return str(items)
    return ""


def merge_contact_payload(
    name: str | None = None,
    company: str | None = None,
    metadata: dict | None = None,
    shop_name: str | None = None,
    owner_name: str | None = None,
    customer_city: str | None = None,
    last_order: str | None = None,
    customer_type: str | None = None,
) -> tuple[str | None, str | None, dict | None]:
    meta = dict(metadata or {})
    if shop_name:
        shop_name_clean = clean_customer_value(shop_name)
        if shop_name_clean:
            meta["shop_name"] = shop_name_clean
    if owner_name:
        owner_name_clean = clean_customer_value(owner_name)
        if owner_name_clean:
            meta["owner_name"] = owner_name_clean
    if customer_city:
        meta["customer_city"] = customer_city.strip()
    if last_order:
        meta["last_order"] = last_order.strip()
    if customer_type:
        ct = customer_type.strip().lower()
        if ct in CUSTOMER_TYPES:
            meta["customer_type"] = ct
    resolved_name = clean_customer_value(
        owner_name or name or meta.get("owner_name")
    )
    resolved_company = clean_customer_value(
        shop_name or company or meta.get("shop_name")
    )
    return resolved_name, resolved_company, meta or None


def normalize_phone_number(phone: str) -> str:
    cleaned = phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not cleaned.startswith("+"):
        if cleaned.startswith("00"):
            cleaned = "+" + cleaned[2:]
        elif cleaned.startswith("0"):
            cleaned = "+92" + cleaned[1:]
        elif len(cleaned) == 10:
            cleaned = "+1" + cleaned
        else:
            cleaned = "+" + cleaned
    return cleaned


def validate_phone_number(phone: str) -> str:
    normalized = normalize_phone_number(phone)
    if not E164_PATTERN.match(normalized):
        raise ValueError(f"Invalid phone number format: {phone}")
    return normalized


def parse_csv_contacts(content: str) -> list[dict]:
    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        raise ValueError("CSV must include a header row")
    field_map = {f.lower().strip(): f for f in reader.fieldnames}
    phone_key = field_map.get("phone_number") or field_map.get("phone")
    if not phone_key:
        raise ValueError("CSV must include phone_number or phone column")

    def col(*keys):
        for key in keys:
            if key in field_map:
                return field_map[key]
        return None

    name_key = col("owner_name", "name")
    company_key = col("shop_name", "company")
    language_key = col("language_preference", "language_pref", "language")
    city_key = col("customer_city", "city")
    last_order_key = col("last_order")
    type_key = col("customer_type")

    contacts = []
    for row in reader:
        phone = (row.get(phone_key) or "").strip()
        if not phone:
            continue
        meta = {}
        if city_key and row.get(city_key):
            meta["customer_city"] = row[city_key].strip()
        if last_order_key and row.get(last_order_key):
            meta["last_order"] = row[last_order_key].strip()
        if type_key and row.get(type_key):
            meta["customer_type"] = row[type_key].strip().lower()
        contacts.append({
            "name": (row.get(name_key) or "").strip() or None if name_key else None,
            "phone_number": phone,
            "language_preference": (row.get(language_key) or "").strip() or "Urdu" if language_key else "Urdu",
            "company": (row.get(company_key) or "").strip() or None if company_key else None,
            "metadata": meta or None,
            "shop_name": (row.get(company_key) or "").strip() or None if company_key else None,
            "owner_name": (row.get(name_key) or "").strip() or None if name_key else None,
            "customer_city": meta.get("customer_city"),
            "last_order": meta.get("last_order"),
            "customer_type": meta.get("customer_type"),
        })
    return contacts


def parse_json_contacts(content: str) -> list[dict]:
    data = json.loads(content)
    if isinstance(data, dict) and "contacts" in data:
        data = data["contacts"]
    if not isinstance(data, list):
        raise ValueError("JSON must be a list of contacts or {contacts: [...]}")
    contacts = []
    for item in data:
        if not isinstance(item, dict):
            raise ValueError("Each contact must be an object")
        phone = (item.get("phone_number") or item.get("phone") or "").strip()
        if not phone:
            raise ValueError("Each contact must include phone_number")
        contacts.append({
            "name": item.get("owner_name") or item.get("name"),
            "phone_number": phone,
            "language_preference": item.get("language_preference") or item.get("language") or "Urdu",
            "company": item.get("shop_name") or item.get("company"),
            "metadata": item.get("metadata"),
            "shop_name": item.get("shop_name"),
            "owner_name": item.get("owner_name") or item.get("name"),
            "customer_city": item.get("customer_city"),
            "last_order": item.get("last_order"),
            "customer_type": item.get("customer_type"),
        })
    return contacts

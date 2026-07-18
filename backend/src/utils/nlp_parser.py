import re
from datetime import datetime, timezone, timedelta
from src.api.outbound.utils import clean_customer_value

def _parse_callback_time(time_str: str) -> datetime | None:
    if not time_str:
        return None
    time_str = time_str.lower()
    now_utc = datetime.now(timezone.utc)
    
    # "in 5 minutes", "5 mins", "10 min", "after 5 minutes"
    m = re.search(r"(\d+)\s*(min|minute)", time_str)
    if m:
        return now_utc + timedelta(minutes=int(m.group(1)))
    
    # "in 2 hours", "1 hr", "2 hrs"
    m = re.search(r"(\d+)\s*(hour|hr)", time_str)
    if m:
        return now_utc + timedelta(hours=int(m.group(1)))
        
    # "in 2 days"
    m = re.search(r"(\d+)\s*(day)", time_str)
    if m:
        return now_utc + timedelta(days=int(m.group(1)))
        
    # Look for specific absolute times: "after 11:25 PM", "11 pm", "11:36 PM today"
    m = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", time_str)
    if m:
        hr = int(m.group(1))
        minute = int(m.group(2)) if m.group(2) else 0
        ampm = m.group(3)
        if ampm == "pm" and hr < 12:
            hr += 12
        elif ampm == "am" and hr == 12:
            hr = 0
            
        # Assume user is in PKT (UTC+5) based on phone numbers and usage
        pkt_now = now_utc + timedelta(hours=5)
        
        try:
            target_pkt = pkt_now.replace(hour=hr, minute=minute, second=0, microsecond=0)
            
            # If "tomorrow" is in the string, or if the time has already passed today, assume tomorrow
            if "tomorrow" in time_str or target_pkt <= pkt_now:
                target_pkt += timedelta(days=1)
                
            # Convert target back to UTC to store in the database properly
            return target_pkt - timedelta(hours=5)
        except ValueError:
            pass # Fall through if hour/minute are invalid (e.g., hr=25)
            
    # "tomorrow"
    if "tomorrow" in time_str:
        return now_utc + timedelta(days=1)
        
    return None

def _extract_callback_time_from_text(text: str) -> datetime | None:
    if not text:
        return None
    text = text.lower()
    now_utc = datetime.now(timezone.utc)
    
    if re.search(r"(?:call|contact|callback).{0,20}tomorrow", text) or "callback tomorrow" in text:
        return now_utc + timedelta(days=1)
        
    m = re.search(r"(?:call|contact|callback).{0,30}\b(\d+)\s*(min|minute|hour|hr|day)s?\b", text)
    if m:
        val = int(m.group(1))
        unit = m.group(2)
        if "min" in unit:
            return now_utc + timedelta(minutes=val)
        elif "h" in unit:
            return now_utc + timedelta(hours=val)
        elif "day" in unit:
            return now_utc + timedelta(days=val)
            
    return None

def _extract_caller_name(data: dict | None) -> str | None:
    if not data:
        return None
    for key in ("customer_name", "caller_name", "name", "owner_name", "user_name", "caller", "customer"):
        val = clean_customer_value(data.get(key))
        if val:
            return val
    return None

def _extract_company_from_data(*sources: dict | None) -> str | None:
    for data in sources:
        if not data:
            continue
        for key in (
            "company_name",
            "company",
            "customer_company",
            "business_name",
            "shop_name",
            "store_name",
            "organization",
        ):
            company = clean_customer_value(data.get(key))
            if company:
                return company
    return None

def _extract_name_from_summary(summary: str) -> str | None:
    if not summary:
        return None
    m = re.search(r"\b(?:contacted|spoke with|spoke to|called|talked to|conversing with)\s+([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)?)\s+(?:from|at|in|to|regarding|about|on)\b", summary)
    if m:
        name = m.group(1).strip()
        if name.lower() not in ("the user", "the customer", "the client", "the distributor", "the retailer", "the agent", "the store", "ahmad store"):
            return clean_customer_value(name)
    m = re.search(r"\b(?:contacted|spoke with|spoke to|called|talked to)\s+([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)?)\b", summary)
    if m:
        name = m.group(1).strip()
        if name.lower() not in ("the user", "the customer", "the client", "the distributor", "the retailer", "the agent", "the store", "ahmad store"):
            return clean_customer_value(name)
    return None

def _extract_company_from_summary(summary: str) -> str | None:
    if not summary:
        return None
    patterns = (
        r"\b(?:customer company is|company is|business is|shop is|store is)\s+([A-Z][a-zA-Z0-9'&.-]*(?:\s+[A-Z][a-zA-Z0-9'&.-]*){0,4})\b",
        r"\b(?:from|at|of)\s+([A-Z][a-zA-Z0-9']+(?:\s+[A-Z][a-zA-Z0-9']+){0,3}\s+(?:Store|Shop|Mart|Distributor|Ltd|Co|Incorporated|Inc|Enterprises|Traders|Supermarket))\b",
    )
    for pattern in patterns:
        m = re.search(pattern, summary, re.IGNORECASE)
        if m:
            return clean_customer_value(m.group(1))
    return None

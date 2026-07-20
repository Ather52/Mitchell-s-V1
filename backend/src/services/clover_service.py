# CLOVER POS INTEGRATION SERVICE
# This module implements the integration client with Clover POS Merchant APIs.
# It handles inventory downloads, atomic order creation, and physical
# ticket printing events for Mitchell's sales orders.

import logging
import os

# pyrefly: ignore [missing-import]
import httpx

_logger = logging.getLogger(__name__)


def _headers() -> dict:
    """
    Helper: Assembles standard headers for authenticated Clover cloud requests.
    Throws a ValueError if the CLOVER_API_TOKEN key is missing.
    """
    token = os.getenv("CLOVER_API_TOKEN", "").strip()
    if not token:
        raise ValueError("CLOVER_API_TOKEN is empty or not configured")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def _merchant_base() -> str:
    """
    Helper: Assembles the base URL endpoint for merchant-specific Clover API calls.
    Returns: e.g. https://api.clover.com/v3/merchants/<merchant_id>
    """
    merchant_id = os.getenv("CLOVER_MERCHANT_ID", "")
    base = os.getenv("CLOVER_BASE_URL", "https://api.clover.com/v3")
    return f"{base}/merchants/{merchant_id}"


async def push_order_to_clover(
    order_items: list[dict],
    customer_name: str,
    order_type_id: str | None = None,
) -> dict:
    """
    Submits a finalized order to Clover POS using the 'Atomic Orders' endpoint.
    
    Why Atomic Orders:
    The Atomic Orders API accepts a nested JSON structure (line items, customer name)
    and creates the complete order resource on Clover in a single round-trip,
    reducing API request volumes.
    """
    # 1. Fall back to default order type ID defined in env if not passed explicitly
    order_type_id = order_type_id or os.getenv("CLOVER_ORDER_TYPE_ID", "")

    # 2. Convert local items to Clover payload representation
    line_items = []
    for item in order_items:
        name = item.get("item", "Unknown Item")
        quantity = int(item.get("quantity", 1))
        price_dollars = float(item.get("price", 0))
        note = item.get("special_instructions", "")
        
        # Clover processes financial prices in integer Cents (e.g. $3.50 -> 350 cents)
        # UnitQty represents quantity * 1000 (e.g. 2 items -> 2000 unitQty)
        entry: dict = {
            "name": name,
            "price": int(price_dollars * 100),
            "unitQty": 1000 * quantity,
        }
        if note:
            entry["note"] = note
        line_items.append(entry)

    # 3. Formulate full atomic order request body
    payload: dict = {
        "orderCart": {
            "title": "Mitchell's",
            "state": "open",
            "lineItems": line_items,
        }
    }
    if order_type_id:
        payload["orderCart"]["orderType"] = {"id": order_type_id}

    # 4. Dispatch async POST request to Clover API
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{_merchant_base()}/atomic_order/orders",
            headers=_headers(),
            json=payload,
        )
        r.raise_for_status()  # raise exception for HTTP status codes >= 400
        data = r.json()
        
        # Extract Clover's generated Order ID from response keys
        order_id = data.get("id") or data.get("href", "").split("/")[-1]
        _logger.info("Clover order created: %s", order_id)

        # 5. Trigger a physical order printing event at the merchant's warehouse/kitchen
        if order_id:
            try:
                print_resp = await client.post(
                    f"{_merchant_base()}/print_event",
                    headers=_headers(),
                    json={"orderRef": {"id": order_id}},
                )
                _logger.info("Print event: %s %s", print_resp.status_code, print_resp.text[:100])
            except Exception as exc:
                # Log printing failures but do not crash the order booking flow
                _logger.error("Print event failed for order %s: %s", order_id, exc)

        return {"clover_order_id": order_id}


async def get_clover_inventory() -> list[dict]:
    """
    Retrieves the first 500 catalog items with attached category tags from Clover.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{_merchant_base()}/items",
            headers=_headers(),
            params={"expand": "categories", "limit": 500},
        )
        r.raise_for_status()
        return r.json().get("elements", [])


async def get_clover_order_types() -> list[dict]:
    """
    Retrieves the merchant's defined order type definitions (e.g. pickup, delivery).
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{_merchant_base()}/order_types", headers=_headers())
        r.raise_for_status()
        return r.json().get("elements", [])


async def fetch_clover_item(item_id: str) -> dict:
    """
    Retrieves a single product item details from Clover.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{_merchant_base()}/items/{item_id}",
            headers=_headers(),
            params={"expand": "categories"},
        )
        r.raise_for_status()
        return r.json()


async def fetch_all_clover_items() -> list[dict]:
    """
    Queries Clover for the complete item catalog.
    Uses a larger timeout (30 seconds) to handle large inventories safely.
    """
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            f"{_merchant_base()}/items",
            headers=_headers(),
            params={"expand": "categories", "limit": 500},
        )
        r.raise_for_status()
        return r.json().get("elements", [])

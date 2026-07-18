import logging

from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.outbound.service import outbound_service
from src.api.outbound.schemas import WebhookResponse

_logger = logging.getLogger("outbound_webhook")


async def handle_retell_webhook(
    request: Request,
    db: AsyncSession,
) -> WebhookResponse:
    try:
        event = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )
    try:
        await outbound_service.process_webhook(db, event)
    except Exception as exc:
        _logger.error("Outbound webhook processing failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed",
        )
    return WebhookResponse(received=True)

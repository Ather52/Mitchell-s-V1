# ROUTER: USER AUTHENTICATION & SESSIONS
# This module defines the REST API routes for authentication.
# It validates request payloads using Pydantic, calls the auth service layer,
# and returns structured login tokens or confirmation messages.

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordRequestForm
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, field_validator   
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession

from src.utils.db import get_db, User
from src.utils.dependencies import get_current_user
from src.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


# PYDANTIC SCHEMAS (Request & Response validation models)

class RegisterRequest(BaseModel):
    """Payload to create a new admin account."""
    email: EmailStr
    password: str
    full_name: str

    # Pydantic decorator to run custom validations on individual payload fields
    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        """Verifies that the password is at least 8 characters long."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class RegisterResponse(BaseModel):
    """Structured response on successful registration."""
    message: str
    user_id: str


class TokenResponse(BaseModel):
    """Structured response returning session tokens on login."""
    access_token: str
    refresh_token: str
    token_type: str
    is_admin: bool


class AccessTokenResponse(BaseModel):
    """Structured response returning a renewed access token."""
    access_token: str
    token_type: str


class RefreshRequest(BaseModel):
    """Payload to renew an expired access token."""
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Payload to initiate a password reset link."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Payload to complete a password reset."""
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class MessageResponse(BaseModel):
    """Standard message confirmation response model."""
    message: str


class MeResponse(BaseModel):
    """User profile details response model."""
    user_id: str
    email: str
    full_name: str | None
    is_admin: bool
    created_at: datetime


# API ENDPOINT ROUTE HANDLERS

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Endpoint: Registers a new admin account.
    """
    user = await auth_service.register(db, body.email, body.password, body.full_name)
    return RegisterResponse(message="Account created", user_id=user.id)


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """
    Endpoint: Logs in a user using OAuth2 username/password form parameters.
    Returns Access and Refresh tokens.
    """
    tokens = await auth_service.login(db, form.username, form.password)
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """
    Endpoint: Renews an expired access token using a refresh token.
    """
    result = await auth_service.refresh_access_token(db, body.refresh_token)
    return AccessTokenResponse(**result)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Endpoint: Requests a password reset link email.
    """
    await auth_service.forgot_password(db, body.email)
    return MessageResponse(message="If the email exists, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Endpoint: Updates user password using a valid reset token.
    """
    await auth_service.reset_password(db, body.token, body.new_password)
    return MessageResponse(message="Password updated successfully")


@router.get("/me", response_model=MeResponse)
async def me(current_user: User = Depends(get_current_user)):
    """
    Endpoint: Retrieves the profile details of the currently logged-in user.
    Uses 'get_current_user' dependency to extract the user from the JWT header.
    """
    return MeResponse(
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
    )

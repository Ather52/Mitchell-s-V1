from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.utils.db import get_db, User
from src.utils.jwt_handler import decode_token
from src.utils.db_functions import get_user_by_id

# OAuth2PasswordBearer defines the scheme where the frontend sends a JWT token
# in the 'Authorization: Bearer <token>' header of the request.
# - 'tokenUrl' points to the endpoint that yields the token upon login.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Security Dependency: Authenticates incoming HTTP requests.
    
    How this works:
      1. FastAPI intercepts the request and extracts the token from the header (via oauth2_scheme).
      2. It opens a database session (via get_db dependency).
      3. It decodes the JWT token and verifies signature & expiration.
      4. It queries the database to make sure the user exists and is active.
      5. Returns the User model, which is then made available inside the API endpoint logic.
    """
    # 1. Decode and check if token is valid and unexpired
    payload = decode_token(token)
    
    # 2. Extract the subject ('sub' usually stores the user ID)
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Retrieve user record from the database
    user = await get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 4. Success - returns the authenticated user object
    return user

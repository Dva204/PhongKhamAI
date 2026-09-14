import os
import datetime
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "healthcare_super_secret_jwt_key_2026_antigravity")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

import hashlib

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:

    if not hashed_password:
        return False
    # Support both sha256 and legacy plain comparison
    hashed = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    return hashed == hashed_password or plain_password == hashed_password

def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token không hợp lệ hoặc đã hết hạn.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Quyền truy cập bị từ chối. Bạn cần có quyền: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

# Mock OTP storage (in memory for mock service)
MOCK_OTP_STORAGE = {}

def send_mock_otp(phone: str) -> str:
    code = "123456"  # Standard test OTP code
    MOCK_OTP_STORAGE[phone] = code
    return code

def verify_mock_otp(phone: str, code: str) -> bool:
    if phone in MOCK_OTP_STORAGE and MOCK_OTP_STORAGE[phone] == code:
        return True
    # Allow 123456 for any test phone in mock mode
    return code == "123456"

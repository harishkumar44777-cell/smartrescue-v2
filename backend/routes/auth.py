from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os

from database import get_db
from models import User

router  = APIRouter(tags=["auth"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET  = os.getenv("SECRET_KEY", "smartrescue-secret")
ALGO    = os.getenv("ALGORITHM", "HS256")
EXPIRE  = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))

def make_token(username: str) -> str:
    return jwt.encode(
        {"sub": username, "exp": datetime.utcnow() + timedelta(minutes=EXPIRE)},
        SECRET, algorithm=ALGO
    )

class LoginIn(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not pwd_ctx.verify(data.password, user.password):
        raise HTTPException(401, "Invalid credentials")
    return {
        "access_token": make_token(user.username),
        "token_type": "bearer",
        "username": user.username
    }

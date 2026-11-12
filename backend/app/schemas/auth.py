from typing import Optional
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = "password"
    role: Optional[str] = "PEMILIK"

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    role: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


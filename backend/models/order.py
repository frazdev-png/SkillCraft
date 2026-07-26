from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrderCreate(BaseModel):
    course_id: str
    full_name: str
    email: str
    phone: str
    transaction_id: str
    screenshot_url: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    user_id: str
    course_id: str
    course_title: str
    full_name: str
    email: str
    phone: str
    transaction_id: str
    amount: float
    status: str
    created_at: str
    screenshot_url: Optional[str] = None

class OrderUpdate(BaseModel):
    status: str

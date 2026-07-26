from pydantic import BaseModel
from typing import Optional

class ApkCreate(BaseModel):
    title: str
    description: str
    icon_url: str = ""
    apk_url: str = ""
    price: float = 0
    featured: bool = False

class ApkResponse(BaseModel):
    id: str
    title: str
    description: str
    icon_url: str
    apk_url: str
    price: float
    featured: bool
    downloads: int
    created_at: str

class ApkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    icon_url: Optional[str] = None
    apk_url: Optional[str] = None
    price: Optional[float] = None
    featured: Optional[bool] = None

class ApkPurchaseCreate(BaseModel):
    apk_id: str
    full_name: str
    email: str
    phone: str
    transaction_id: str
    screenshot_url: Optional[str] = None

class ApkPurchaseResponse(BaseModel):
    id: str
    user_id: str
    apk_id: str
    apk_title: str
    full_name: str
    email: str
    phone: str
    transaction_id: str
    screenshot_url: str
    amount: float
    status: str
    created_at: str

class ApkPurchaseUpdate(BaseModel):
    status: str

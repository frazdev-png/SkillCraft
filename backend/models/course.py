from pydantic import BaseModel
from typing import Optional

class CourseCreate(BaseModel):
    title: str
    description: str
    category: str
    thumbnail_url: str
    banner_url: str
    duration: str
    difficulty: str
    rating: float
    original_price: float
    sale_price: float
    google_drive_link: str
    featured: bool = False
    best_seller: bool = False

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    thumbnail_url: Optional[str] = None
    banner_url: Optional[str] = None
    duration: Optional[str] = None
    difficulty: Optional[str] = None
    rating: Optional[float] = None
    original_price: Optional[float] = None
    sale_price: Optional[float] = None
    google_drive_link: Optional[str] = None
    featured: Optional[bool] = None
    best_seller: Optional[bool] = None

class CourseResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    thumbnail_url: str
    banner_url: str
    duration: str
    difficulty: str
    rating: float
    original_price: float
    sale_price: float
    google_drive_link: str
    featured: bool
    best_seller: bool

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/contact", tags=["contact"])

class ContactMessage(BaseModel):
    name: str
    email: str
    message: str

messages = []

@router.post("/")
def submit_contact(msg: ContactMessage):
    messages.append({
        "name": msg.name,
        "email": msg.email,
        "message": msg.message,
        "created_at": datetime.utcnow().isoformat()
    })
    return {"message": "Your message has been received. We will get back to you soon!"}

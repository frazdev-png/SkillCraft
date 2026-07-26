from fastapi import APIRouter, HTTPException
from models.user import UserCreate, UserLogin
from database import users_collection
import bcrypt as _bcrypt
from jose import jwt
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRY_HOURS, ADMIN_EMAIL, ADMIN_PASSWORD
from datetime import datetime, timedelta
from middleware.auth_middleware import get_current_user, get_admin_user
from fastapi import Request
from pydantic import BaseModel

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

router = APIRouter(prefix="/api/auth", tags=["auth"])

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return _bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

@router.post("/register")
def register(user: UserCreate):
    existing = users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(user.password)
    role = "admin" if user.email == ADMIN_EMAIL and user.password == ADMIN_PASSWORD else "user"

    result = users_collection.insert_one({
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed,
        "role": role
    })

    token = jwt.encode({
        "user_id": str(result.inserted_id),
        "name": user.name,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "name": user.name,
            "email": user.email,
            "role": role
        }
    }

@router.post("/login")
def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode({
        "user_id": str(db_user["_id"]),
        "name": db_user["name"],
        "role": db_user["role"],
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return {
        "token": token,
        "user": {
            "id": str(db_user["_id"]),
            "name": db_user["name"],
            "email": db_user["email"],
            "role": db_user["role"]
        }
    }

@router.get("/me")
def get_me(request: Request):
    user = get_current_user(request)
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }

@router.put("/change-password")
def change_password(req: ChangePasswordRequest, request: Request):
    user = get_current_user(request)
    if not verify_password(req.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    new_hashed = hash_password(req.new_password)
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"hashed_password": new_hashed}})
    return {"message": "Password changed successfully"}

@router.post("/seed-admin")
def seed_admin():
    existing = users_collection.find_one({"email": ADMIN_EMAIL})
    if existing:
        return {"message": "Admin already exists"}

    hashed = hash_password(ADMIN_PASSWORD)
    users_collection.insert_one({
        "name": "Admin",
        "email": ADMIN_EMAIL,
        "hashed_password": hashed,
        "role": "admin"
    })
    return {"message": "Admin created successfully"}

@router.get("/users")
def get_users(request: Request):
    get_admin_user(request)
    users = list(users_collection.find({}, {"hashed_password": 0}).sort("_id", -1))
    return [{"id": str(u["_id"]), "name": u["name"], "email": u["email"], "role": u["role"]} for u in users]

@router.delete("/users/{user_id}")
def delete_user(user_id: str, request: Request):
    from bson import ObjectId
    admin = get_admin_user(request)
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    users_collection.delete_one({"_id": ObjectId(user_id)})
    return {"message": "User deleted successfully"}

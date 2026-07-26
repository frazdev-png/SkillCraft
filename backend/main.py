from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.courses import router as courses_router
from routes.orders import router as orders_router
from routes.upload import router as upload_router
from routes.apks import router as apks_router
from contextlib import asynccontextmanager
from database import users_collection
from config import ADMIN_EMAIL, ADMIN_PASSWORD
import bcrypt as _bcrypt

@asynccontextmanager
async def lifespan(app: FastAPI):
    existing = users_collection.find_one({"email": ADMIN_EMAIL})
    if not existing:
        hashed = _bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")
        users_collection.insert_one({
            "name": "Admin",
            "email": ADMIN_EMAIL,
            "hashed_password": hashed,
            "role": "admin"
        })
        print(f"Admin created: {ADMIN_EMAIL}")
    else:
        print(f"Admin already exists: {ADMIN_EMAIL}")
    yield

app = FastAPI(title="SkillCraft API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(courses_router)
app.include_router(orders_router)
app.include_router(upload_router)
app.include_router(apks_router)

@app.get("/")
def root():
    return {"message": "SkillCraft API is running"}

@app.get("/api/health")
def health():
    return {"status": "ok"}

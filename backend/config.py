import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://<username>:<password>@cluster.mongodb.net/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "courseweb")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@skillcraft.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

JAZZCASH_NUMBER = os.getenv("JAZZCASH_NUMBER", "0300-1234567")
EASYPAISA_NUMBER = os.getenv("EASYPAISA_NUMBER", "0300-7654321")

from pymongo import MongoClient
from config import MONGODB_URI, DATABASE_NAME

client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
db = client[DATABASE_NAME]

def get_users_collection():
    return db["users"]

def get_courses_collection():
    return db["courses"]

def get_orders_collection():
    return db["orders"]

users_collection = db["users"]
courses_collection = db["courses"]
orders_collection = db["orders"]
categories_collection = db["categories"]
apks_collection = db["apks"]
apk_purchases_collection = db["apk_purchases"]

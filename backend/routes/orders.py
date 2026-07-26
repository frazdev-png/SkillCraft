from fastapi import APIRouter, HTTPException, Request
from models.order import OrderCreate, OrderUpdate
from database import orders_collection, courses_collection
from middleware.auth_middleware import get_current_user, get_admin_user
from bson import ObjectId
from datetime import datetime
import os
import cloudinary
import cloudinary.uploader
from config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

router = APIRouter(prefix="/api/orders", tags=["orders"])

def order_to_dict(order):
    return {
        "id": str(order["_id"]),
        "user_id": str(order["user_id"]),
        "course_id": str(order["course_id"]),
        "course_title": order.get("course_title", ""),
        "full_name": order.get("full_name", ""),
        "email": order.get("email", ""),
        "phone": order.get("phone", ""),
        "transaction_id": order["transaction_id"],
        "amount": order["amount"],
        "status": order["status"],
        "created_at": order["created_at"],
        "screenshot_url": order.get("screenshot_url", "")
    }

@router.post("/")
def create_order(order: OrderCreate, request: Request):
    user = get_current_user(request)
    course = courses_collection.find_one({"_id": ObjectId(order.course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = orders_collection.find_one({
        "user_id": user["_id"],
        "course_id": ObjectId(order.course_id),
        "status": {"$in": ["pending", "approved"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already ordered this course")

    order_dict = {
        "user_id": user["_id"],
        "course_id": ObjectId(order.course_id),
        "course_title": course["title"],
        "full_name": order.full_name,
        "email": order.email,
        "phone": order.phone,
        "transaction_id": order.transaction_id,
        "amount": course["sale_price"],
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "screenshot_url": order.screenshot_url or ""
    }

    result = orders_collection.insert_one(order_dict)
    created = orders_collection.find_one({"_id": result.inserted_id})
    return order_to_dict(created)

@router.get("/my-orders")
def get_my_orders(request: Request):
    user = get_current_user(request)
    orders = list(orders_collection.find({"user_id": user["_id"]}).sort("created_at", -1))
    return [order_to_dict(o) for o in orders]

@router.get("/my-purchases")
def get_my_purchases(request: Request):
    user = get_current_user(request)
    approved_orders = list(orders_collection.find({
        "user_id": user["_id"],
        "status": "approved"
    }))

    purchases = []
    for order in approved_orders:
        course = courses_collection.find_one({"_id": order["course_id"]})
        if course:
            purchases.append({
                "order_id": str(order["_id"]),
                "course_id": str(course["_id"]),
                "course_title": course["title"],
                "thumbnail_url": course["thumbnail_url"],
                "duration": course["duration"],
                "difficulty": course["difficulty"],
                "google_drive_link": course["google_drive_link"],
                "purchased_at": order["created_at"]
            })

    return purchases

@router.get("/pending-orders")
def get_pending_orders(request: Request):
    user = get_current_user(request)
    pending = list(orders_collection.find({
        "user_id": user["_id"],
        "status": "pending"
    }))
    return [order_to_dict(o) for o in pending]

@router.get("/rejected-orders")
def get_rejected_orders(request: Request):
    user = get_current_user(request)
    rejected = list(orders_collection.find({
        "user_id": user["_id"],
        "status": "rejected"
    }))
    return [order_to_dict(o) for o in rejected]

@router.get("/all")
def get_all_orders(request: Request):
    get_admin_user(request)
    orders = list(orders_collection.find().sort("created_at", -1))
    return [order_to_dict(o) for o in orders]

@router.put("/{order_id}/status")
def update_order_status(order_id: str, update: OrderUpdate, request: Request):
    get_admin_user(request)

    if update.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": update.status}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    updated = orders_collection.find_one({"_id": ObjectId(order_id)})
    return order_to_dict(updated)

@router.delete("/{order_id}/screenshot")
def delete_order_screenshot(order_id: str, request: Request):
    get_admin_user(request)

    order = orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    screenshot_url = order.get("screenshot_url", "")
    if not screenshot_url:
        raise HTTPException(status_code=400, detail="No screenshot on this order")

    public_id = None
    parts = screenshot_url.split("/")
    for i, part in enumerate(parts):
        if part == "screenshots" and i + 1 < len(parts):
            filename = parts[-1]
            public_id = f"screenshots/{os.path.splitext(filename)[0]}"
            break

    if public_id:
        try:
            cloudinary.uploader.destroy(public_id)
        except Exception:
            pass

    orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"screenshot_url": ""}}
    )

    return {"message": "Screenshot deleted"}

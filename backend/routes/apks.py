from fastapi import APIRouter, HTTPException, Request, Query
from models.apk import ApkCreate, ApkUpdate, ApkPurchaseCreate, ApkPurchaseUpdate
from database import apks_collection, apk_purchases_collection
from middleware.auth_middleware import get_current_user, get_admin_user
from bson import ObjectId
from datetime import datetime
import cloudinary
import cloudinary.uploader
from config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
import os

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

router = APIRouter(prefix="/api/apks", tags=["apks"])

def apk_to_dict(apk):
    return {
        "id": str(apk["_id"]),
        "title": apk["title"],
        "description": apk.get("description", ""),
        "icon_url": apk.get("icon_url", ""),
        "apk_url": apk.get("apk_url", ""),
        "price": apk.get("price", 0),
        "featured": apk.get("featured", False),
        "downloads": apk.get("downloads", 0),
        "created_at": apk.get("created_at", "")
    }

def purchase_to_dict(p):
    return {
        "id": str(p["_id"]),
        "user_id": str(p["user_id"]),
        "apk_id": str(p["apk_id"]),
        "apk_title": p.get("apk_title", ""),
        "full_name": p.get("full_name", ""),
        "email": p.get("email", ""),
        "phone": p.get("phone", ""),
        "transaction_id": p["transaction_id"],
        "screenshot_url": p.get("screenshot_url", ""),
        "amount": p["amount"],
        "status": p["status"],
        "created_at": p["created_at"]
    }

@router.get("/")
def list_apks(page: int = Query(1, ge=1), per_page: int = Query(12, ge=1, le=200), featured: bool = None):
    query = {}
    if featured is True:
        query["featured"] = True

    total = apks_collection.count_documents(query)
    pages = max(1, (total + per_page - 1) // per_page)
    skip = (page - 1) * per_page

    apks = list(apks_collection.find(query).sort("created_at", -1).skip(skip).limit(per_page))
    return {"apks": [apk_to_dict(a) for a in apks], "total": total, "page": page, "pages": pages}

@router.get("/featured")
def get_featured_apks():
    apks = list(apks_collection.find({"featured": True}).sort("created_at", -1).limit(6))
    return [apk_to_dict(a) for a in apks]

@router.get("/{apk_id}")
def get_apk(apk_id: str):
    apk = apks_collection.find_one({"_id": ObjectId(apk_id)})
    if not apk:
        raise HTTPException(status_code=404, detail="APK not found")
    return apk_to_dict(apk)

@router.post("/")
def create_apk(apk: ApkCreate, request: Request):
    get_admin_user(request)

    apk_dict = {
        "title": apk.title,
        "description": apk.description,
        "icon_url": apk.icon_url,
        "apk_url": apk.apk_url,
        "price": apk.price,
        "featured": apk.featured,
        "downloads": 0,
        "created_at": datetime.utcnow().isoformat()
    }

    result = apks_collection.insert_one(apk_dict)
    created = apks_collection.find_one({"_id": result.inserted_id})
    return apk_to_dict(created)

@router.put("/{apk_id}")
def update_apk(apk_id: str, apk: ApkUpdate, request: Request):
    get_admin_user(request)

    update = {k: v for k, v in apk.dict(exclude_none=True).items() if v is not None}
    result = apks_collection.update_one(
        {"_id": ObjectId(apk_id)},
        {"$set": update}
    )
    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=404, detail="APK not found")

    updated = apks_collection.find_one({"_id": ObjectId(apk_id)})
    return apk_to_dict(updated)

@router.delete("/{apk_id}")
def delete_apk(apk_id: str, request: Request):
    get_admin_user(request)

    apk = apks_collection.find_one({"_id": ObjectId(apk_id)})
    if not apk:
        raise HTTPException(status_code=404, detail="APK not found")

    if apk.get("icon_url"):
        parts = apk["icon_url"].split("/")
        for i, part in enumerate(parts):
            if part == "upload" and i + 1 < len(parts):
                public_id = f"courseweb/{os.path.splitext(parts[-1])[0]}"
                try:
                    cloudinary.uploader.destroy(public_id)
                except Exception:
                    pass
                break

    apks_collection.delete_one({"_id": ObjectId(apk_id)})
    return {"message": "APK deleted"}

@router.post("/purchase")
def create_apk_purchase(purchase: ApkPurchaseCreate, request: Request):
    user = get_current_user(request)

    apk = apks_collection.find_one({"_id": ObjectId(purchase.apk_id)})
    if not apk:
        raise HTTPException(status_code=404, detail="APK not found")

    existing = apk_purchases_collection.find_one({
        "user_id": user["_id"],
        "apk_id": ObjectId(purchase.apk_id),
        "status": {"$in": ["pending", "approved"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already purchased this APK")

    purchase_dict = {
        "user_id": user["_id"],
        "apk_id": ObjectId(purchase.apk_id),
        "apk_title": apk["title"],
        "full_name": purchase.full_name,
        "email": purchase.email,
        "phone": purchase.phone,
        "transaction_id": purchase.transaction_id,
        "screenshot_url": purchase.screenshot_url or "",
        "amount": apk["price"],
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }

    result = apk_purchases_collection.insert_one(purchase_dict)
    created = apk_purchases_collection.find_one({"_id": result.inserted_id})
    return purchase_to_dict(created)

@router.get("/purchases/my")
def get_my_apk_purchases(request: Request):
    user = get_current_user(request)
    purchases = list(apk_purchases_collection.find({"user_id": user["_id"]}).sort("created_at", -1))
    return [purchase_to_dict(p) for p in purchases]

@router.get("/purchases/my-approved")
def get_my_approved_apks(request: Request):
    user = get_current_user(request)
    approved = list(apk_purchases_collection.find({
        "user_id": user["_id"],
        "status": "approved"
    }))

    result = []
    for p in approved:
        apk = apks_collection.find_one({"_id": p["apk_id"]})
        if apk:
            result.append({
                "purchase_id": str(p["_id"]),
                "apk_id": str(apk["_id"]),
                "apk_title": apk["title"],
                "icon_url": apk.get("icon_url", ""),
                "description": apk.get("description", ""),
                "apk_url": apk.get("apk_url", ""),
                "purchased_at": p["created_at"]
            })
    return result

@router.get("/purchases/all")
def get_all_apk_purchases(request: Request):
    get_admin_user(request)
    purchases = list(apk_purchases_collection.find().sort("created_at", -1))
    return [purchase_to_dict(p) for p in purchases]

@router.put("/purchases/{purchase_id}/status")
def update_apk_purchase_status(purchase_id: str, update: ApkPurchaseUpdate, request: Request):
    get_admin_user(request)

    if update.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = apk_purchases_collection.update_one(
        {"_id": ObjectId(purchase_id)},
        {"$set": {"status": update.status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Purchase not found")

    updated = apk_purchases_collection.find_one({"_id": ObjectId(purchase_id)})
    return purchase_to_dict(updated)

@router.delete("/purchases/{purchase_id}/screenshot")
def delete_apk_screenshot(purchase_id: str, request: Request):
    get_admin_user(request)

    purchase = apk_purchases_collection.find_one({"_id": ObjectId(purchase_id)})
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    screenshot_url = purchase.get("screenshot_url", "")
    if not screenshot_url:
        raise HTTPException(status_code=400, detail="No screenshot on this purchase")

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

    apk_purchases_collection.update_one(
        {"_id": ObjectId(purchase_id)},
        {"$set": {"screenshot_url": ""}}
    )
    return {"message": "Screenshot deleted"}

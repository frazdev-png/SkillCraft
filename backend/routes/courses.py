from fastapi import APIRouter, HTTPException, Request
from models.course import CourseCreate, CourseUpdate
from database import courses_collection, categories_collection
from middleware.auth_middleware import get_admin_user
from bson import ObjectId
from typing import Optional

router = APIRouter(prefix="/api/courses", tags=["courses"])

def course_to_dict(course):
    return {
        "id": str(course["_id"]),
        "title": course["title"],
        "description": course["description"],
        "category": course["category"],
        "thumbnail_url": course["thumbnail_url"],
        "banner_url": course["banner_url"],
        "duration": course["duration"],
        "difficulty": course["difficulty"],
        "rating": course["rating"],
        "original_price": course["original_price"],
        "sale_price": course["sale_price"],
        "google_drive_link": course.get("google_drive_link", ""),
        "featured": course.get("featured", False),
        "best_seller": course.get("best_seller", False)
    }

@router.get("/")
def get_courses(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    page: int = 1,
    per_page: int = 12
):
    query = {}

    if category:
        query["category"] = category
    if difficulty:
        query["difficulty"] = difficulty
    if featured is not None:
        query["featured"] = featured
    if search:
        query["title"] = {"$regex": search, "$options": "i"}

    total = courses_collection.count_documents(query)
    skip = (page - 1) * per_page
    courses = list(courses_collection.find(query).sort("_id", -1).skip(skip).limit(per_page))
    return {
        "courses": [course_to_dict(c) for c in courses],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }

@router.get("/featured")
def get_featured_courses():
    courses = list(courses_collection.find({"featured": True}).sort("_id", -1).limit(6))
    return [course_to_dict(c) for c in courses]

@router.get("/best-seller")
def get_best_seller_courses():
    courses = list(courses_collection.find({"best_seller": True}).sort("_id", -1).limit(6))
    return [course_to_dict(c) for c in courses]

@router.get("/categories")
def get_categories():
    course_cats = courses_collection.distinct("category")
    saved_cats = [c["name"] for c in categories_collection.find()]
    all_cats = list(set(course_cats + saved_cats))
    all_cats.sort()
    return all_cats

@router.post("/categories")
def add_category(data: dict, request: Request):
    get_admin_user(request)
    name = data.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required")
    existing = categories_collection.find_one({"name": name})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    categories_collection.insert_one({"name": name})
    return {"message": f"Category '{name}' added"}

@router.put("/categories/{name}")
def update_category(name: str, data: dict, request: Request):
    get_admin_user(request)
    new_name = data.get("name", "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="New name is required")
    existing = categories_collection.find_one({"name": new_name})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    result = categories_collection.update_one(
        {"name": name},
        {"$set": {"name": new_name}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": f"Category renamed to '{new_name}'"}

@router.delete("/categories/{name}")
def delete_category(name: str, request: Request):
    get_admin_user(request)
    result = categories_collection.delete_one({"name": name})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": f"Category '{name}' deleted"}

@router.get("/{course_id}")
def get_course(course_id: str):
    course = courses_collection.find_one({"_id": ObjectId(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course_to_dict(course)

@router.post("/")
def create_course(course: CourseCreate, request: Request):
    get_admin_user(request)
    result = courses_collection.insert_one(course.model_dump())
    return {**course_to_dict(courses_collection.find_one({"_id": result.inserted_id}))}

@router.put("/{course_id}")
def update_course(course_id: str, course: CourseUpdate, request: Request):
    get_admin_user(request)
    update_data = {k: v for k, v in course.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = courses_collection.update_one(
        {"_id": ObjectId(course_id)},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Course not found or no changes made")

    updated = courses_collection.find_one({"_id": ObjectId(course_id)})
    return course_to_dict(updated)

@router.delete("/{course_id}")
def delete_course(course_id: str, request: Request):
    get_admin_user(request)
    result = courses_collection.delete_one({"_id": ObjectId(course_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted successfully"}

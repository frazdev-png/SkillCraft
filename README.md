# CourseWeb - Premium Course Selling Website

A complete premium course selling platform built with FastAPI backend and HTML/CSS/JS frontend.

## Features

- **Public Pages**: Home, Courses, Course Details, About, Contact, Privacy Policy, Terms
- **Authentication**: JWT-based registration, login, logout
- **User Dashboard**: View purchased courses, pending approvals, rejected payments
- **Admin Panel**: Manage courses (CRUD), manage orders (approve/reject)
- **Payment**: Manual JazzCash/EasyPaisa payment with TID verification
- **Cloudinary**: Course image storage
- **Google Drive**: Course content delivery (single folder per course)

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: MongoDB Atlas
- **Authentication**: JWT (python-jose)
- **Image Storage**: Cloudinary
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
```

Edit `.env` file with your credentials:
- MongoDB Atlas connection string
- Cloudinary API credentials
- Admin email/password
- JazzCash/EasyPaisa numbers

Start the server:
```bash
uvicorn main:app --reload
```

The API will run at `http://localhost:8000`

### 2. Seed Admin (First Time)

```bash
curl -X POST http://localhost:8000/api/auth/seed-admin
```

Default admin:
- Email: admin@courseweb.com
- Password: admin123

### 3. Frontend Setup

Simply open the HTML files in a browser or serve with any static server:

```bash
# Using Python
python -m http.server 3000 -d frontend
```

Or use VS Code Live Server extension.

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses/` - List all courses (with filters)
- `GET /api/courses/featured` - Featured courses
- `GET /api/courses/best-seller` - Best seller courses
- `GET /api/courses/categories` - Get categories
- `GET /api/courses/{id}` - Get course detail
- `POST /api/courses/` - Create course (admin)
- `PUT /api/courses/{id}` - Update course (admin)
- `DELETE /api/courses/{id}` - Delete course (admin)

### Orders
- `POST /api/orders/` - Create order
- `GET /api/orders/my-orders` - User's orders
- `GET /api/orders/my-purchases` - User's approved purchases
- `GET /api/orders/pending-orders` - User's pending orders
- `GET /api/orders/rejected-orders` - User's rejected orders
- `GET /api/orders/all` - All orders (admin)
- `PUT /api/orders/{id}/status` - Approve/reject order (admin)

### Upload
- `POST /api/upload/image` - Upload image to Cloudinary (admin)

## Project Structure

```
courseweb/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration & environment
│   ├── database.py          # MongoDB connection
│   ├── models/              # Pydantic models
│   ├── routes/              # API routes
│   ├── middleware/           # Auth middleware
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── index.html           # Home page
│   ├── courses.html         # Courses listing
│   ├── course-detail.html   # Course detail + payment
│   ├── login.html           # Login page
│   ├── register.html        # Register page
│   ├── dashboard.html       # User dashboard
│   ├── admin.html           # Admin panel
│   ├── contact.html         # Contact page
│   ├── about.html           # About page
│   ├── privacy.html         # Privacy policy
│   ├── terms.html           # Terms & conditions
│   ├── css/style.css        # Complete stylesheet
│   └── js/
│       ├── api.js           # API client
│       ├── auth.js          # Authentication logic
│       ├── main.js          # Main site logic
│       ├── dashboard.js     # Dashboard logic
│       └── admin.js         # Admin panel logic
└── .gitignore
```

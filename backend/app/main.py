from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routes import auth, partner, entries, photos, users

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CoupleApp API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(partner.router, prefix="/partner", tags=["partner"])
app.include_router(entries.router, prefix="/entries", tags=["entries"])
app.include_router(photos.router, prefix="/photos", tags=["photos"])
app.include_router(users.router, prefix="/users", tags=["users"])

# Static files for photos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

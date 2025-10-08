from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.api import auth
from app.api.routes import router as api_router  # <-- single API router
from app.core.database import init_db

app = FastAPI(
    title="Health Trail API",
    description="RAG-based Health Report Analyzer",
    version="1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://192.168.29.75:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure tables exist
init_db()

# Register routes (only one /api prefix)
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(api_router, prefix="/api", tags=["API"])

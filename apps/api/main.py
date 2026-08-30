"""
TraceFuse API Main Application
FastAPI Modular Monolith backend for Financial Crime Investigation Cockpit.
"""
import sys
import os

# Ensure both workspace root and apps/api are in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
API_DIR = os.path.abspath(os.path.dirname(__file__))
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from apps.api.database import init_db
from apps.api.routers import dashboard, investigations, accounts, transactions

app = FastAPI(
    title="TraceFuse API",
    description=(
        "Financial Crime Investigation Cockpit API — Build Bank Hackathon Track 2.\n"
        "Provides graph topology, rule-based pattern detection, explainable risk scoring, "
        "FIFO Follow-the-Money provenance, and grounded AI assistant capabilities."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[GlobalError] Unhandled exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "An internal server error occurred.", "detail": str(exc)},
    )


# Include Feature Routers
app.include_router(dashboard.router)
app.include_router(investigations.router)
app.include_router(accounts.router)
app.include_router(transactions.router)


@app.get("/")
def read_root():
    return {
        "status": "ok",
        "app": "TraceFuse API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "GET /dashboard/summary",
            "GET /investigations",
            "GET /investigations/{id}",
            "GET /investigations/{id}/graph",
            "GET /investigations/{id}/timeline",
            "GET /investigations/{id}/evidence",
            "POST /investigations/{id}/follow-money",
            "POST /investigations/{id}/ask",
            "PATCH /investigations/{id}/status",
            "POST /investigations/{id}/notes",
            "GET /investigations/{id}/report",
            "GET /accounts/{id}",
            "GET /transactions/{id}",
        ],
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

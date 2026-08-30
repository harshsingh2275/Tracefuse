from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="TraceFuse API",
    description="Financial Crime Investigation Cockpit API — Build Bank Hackathon",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "status": "ok",
        "app": "TraceFuse API",
        "version": "1.0.0",
        "message": "Financial crime investigation cockpit API is operational",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

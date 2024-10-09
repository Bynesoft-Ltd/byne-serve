from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db.database import engine, get_db
from .db import models
from .api import auth, model_routes, reports
from .config import settings

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Model Reporting API")


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(model_routes.router, prefix="/models", tags=["Models"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])


@app.options("/{full_path:path}")
async def options_route(full_path: str):
    return {"message": "OK"}


@app.get("/")
def read_root():
    return {"message": "Welcome to the Model Reporting API"}


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Try to make a simple query to check database connection
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True
    )
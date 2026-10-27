from fastapi import APIRouter
from app.database import db

router = APIRouter(prefix="/api", tags=["Demo Seeder"])

@router.post("/seed")
def seed_demo_data():
    """Seeds or resets realistic sample companies and call records for evaluation."""
    return db.reset_and_seed()

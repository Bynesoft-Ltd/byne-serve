from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..config import settings  # Updated import

def correct_postgres_url(url):
    if url.startswith('postgres://'):
        url = 'postgresql://' + url[len('postgres://'):]
    return url

DB_URL = correct_postgres_url(settings.DATABASE_URL)

# Create the SQLAlchemy engine
engine = create_engine(DB_URL)

# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for declarative models
Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
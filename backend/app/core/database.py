from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Configure SQLite or MySQL engine parameters
connect_args = {}
if settings.DB_TYPE.lower() == "sqlite":
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides an isolated database session per request.
    Automatically rolls back on exceptions and closes the session upon completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initializes all database tables defined in SQLAlchemy models and safely migrates new columns.
    """
    import app.models  # Ensures all models are registered with Base metadata
    Base.metadata.create_all(bind=engine)

    # Safely migrate new columns into existing SQLite tables if they do not exist
    if settings.DB_TYPE.lower() == "sqlite":
        with engine.connect() as conn:
            try:
                # Inspect existing columns in grievances table
                cursor = conn.execute(text("PRAGMA table_info(grievances)"))
                existing_cols = [row[1] for row in cursor.fetchall()]
                
                new_columns = [
                    ("attachment_url", "VARCHAR(500)"),
                    ("ward_number", "VARCHAR(50)"),
                    ("latitude", "FLOAT"),
                    ("longitude", "FLOAT"),
                ]
                
                for col_name, col_type in new_columns:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE grievances ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception as e:
                # Ignore if table doesn't exist yet (create_all will handle it)
                pass

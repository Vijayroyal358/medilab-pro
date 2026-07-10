from sqlmodel import SQLModel, create_engine, Session, text
from app.core.config import settings

# Configure database engine. If SQLite, configure it for multithreading
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)

def init_db() -> None:
    # This creates all tables in SQLModel metadata
    SQLModel.metadata.create_all(engine)
    with Session(engine) as db:
        try:
            db.execute(text('UPDATE "user" SET email = LOWER(email)'))
            db.commit()
        except Exception as e:
            print("Failed to run email lowercasing migration:", e)

def get_db():
    with Session(engine) as session:
        yield session

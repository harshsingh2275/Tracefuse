import os
import re
import urllib.parse
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./tracefuse.db")


def format_db_url(url: str) -> str:
    """Correctly encode passwords containing brackets or @ characters."""
    if not url or url.startswith("sqlite"):
        return url or "sqlite:///./tracefuse.db"
    
    # Handle postgres:// -> postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
        
    # Match scheme://user:pass@host:port/db with potential brackets or special characters in pass
    match = re.match(r"^(postgresql://)([^:]+):(?:\[(.*)\]|(.*))@([^@/]+(?::\d+)?)(/.*)?$", url)
    if match:
        prefix, user, pass1, pass2, host, rest = match.groups()
        pwd = pass1 if pass1 is not None else (pass2 or "")
        rest = rest or ""
        return f"{prefix}{user}:{urllib.parse.quote_plus(pwd)}@{host}{rest}"
    return url


DATABASE_URL = format_db_url(raw_db_url)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {"connect_timeout": 5}

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
    # Test connection if not SQLite
    if not DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            pass
    print(f"[Database] Connected successfully to {engine.url.render_as_string(hide_password=True)}")
except Exception as e:
    print(f"[Database] Warning: Could not connect to configured DB ({e}). Falling back to sqlite:///./tracefuse.db")
    DATABASE_URL = "sqlite:///./tracefuse.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Enable foreign keys for SQLite
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)

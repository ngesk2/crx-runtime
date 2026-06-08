from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import engine, SessionLocal
from models import Base, Event

# -------------------------
# APP INIT
# -------------------------
app = FastAPI(title="CRX Memory Engine")

# -------------------------
# DB INIT (DEV ONLY)
# -------------------------
Base.metadata.create_all(bind=engine)

# -------------------------
# DB SESSION DEPENDENCY
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# SCHEMAS
# -------------------------
class EventIn(BaseModel):
    source: str
    event_type: str
    payload: str


class EventOut(BaseModel):
    id: int
    source: str
    event_type: str
    payload: str
    created_at: str

# -------------------------
# HEALTH CHECK
# -------------------------
@app.get("/")
def root():
    return {"status": "CRX online"}

# -------------------------
# WRITE MEMORY
# -------------------------
@app.post("/event")
def create_event(event: EventIn, db: Session = Depends(get_db)):

    new_event = Event(
        source=event.source,
        event_type=event.event_type,
        payload=event.payload
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return {
        "status": "stored",
        "id": new_event.id
    }

# -------------------------
# READ MEMORY
# -------------------------
@app.get("/events")
def get_events(db: Session = Depends(get_db)):

    events = (
        db.query(Event)
        .order_by(Event.id.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": e.id,
            "source": e.source,
            "event_type": e.event_type,
            "payload": e.payload,
            "created_at": e.created_at.isoformat()
        }
        for e in events
    ]
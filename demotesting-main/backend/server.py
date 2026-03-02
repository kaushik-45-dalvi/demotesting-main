from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import qrcode
import io
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"  # student, coordinator, admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class EventCreate(BaseModel):
    title: str
    description: str
    date: str
    time: str
    venue: str
    capacity: int
    category: str
    image_url: Optional[str] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    capacity: Optional[int] = None
    category: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None

class EventResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    date: str
    time: str
    venue: str
    capacity: int
    category: str
    status: str
    coordinator_id: str
    coordinator_name: str
    registered_count: int
    created_at: str
    image_url: Optional[str] = None

class RegistrationCreate(BaseModel):
    event_id: str

class RegistrationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    event_id: str
    user_id: str
    qr_code: str
    attendance_status: str
    registration_date: str
    event_title: Optional[str] = None

class AttendanceUpdate(BaseModel):
    registration_id: str

class VolunteerCreate(BaseModel):
    event_id: str
    user_email: str
    role: str
    responsibilities: str

class VolunteerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    event_id: str
    user_id: str
    user_name: str
    user_email: str
    role: str
    responsibilities: str

class FeedbackCreate(BaseModel):
    event_id: str
    rating: int
    comment: str

class FeedbackResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    event_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    timestamp: str

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

# ============= HELPER FUNCTIONS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def generate_qr_code(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

# ============= AUTH ROUTES =============

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(user.password)
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hashed_pw,
        "name": user.name,
        "role": user.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Generate token
    token = create_token(user_id, user.email, user.role)
    
    user_response = UserResponse(
        id=user_id,
        email=user.email,
        name=user.name,
        role=user.role
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"]
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"]
    )

# ============= EVENT ROUTES =============

@api_router.post("/events", response_model=EventResponse)
async def create_event(event: EventCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["coordinator", "admin"]:
        raise HTTPException(status_code=403, detail="Only coordinators and admins can create events")
    
    event_id = str(uuid.uuid4())
    
    event_doc = {
        "id": event_id,
        "title": event.title,
        "description": event.description,
        "date": event.date,
        "time": event.time,
        "venue": event.venue,
        "capacity": event.capacity,
        "category": event.category,
        "status": "upcoming",
        "coordinator_id": current_user["user_id"],
        "coordinator_name": current_user.get("email", ""),
        "image_url": event.image_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.events.insert_one(event_doc)
    
    # Get coordinator name
    coordinator = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    event_doc["coordinator_name"] = coordinator["name"] if coordinator else ""
    
    return EventResponse(**event_doc, registered_count=0)

@api_router.get("/events", response_model=List[EventResponse])
async def get_events(status: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    events = await db.events.find(query, {"_id": 0}).to_list(1000)
    
    # Add registered count for each event
    result = []
    for event in events:
        count = await db.registrations.count_documents({"event_id": event["id"]})
        result.append(EventResponse(**event, registered_count=count))
    
    return result

@api_router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    count = await db.registrations.count_documents({"event_id": event_id})
    return EventResponse(**event, registered_count=count)

@api_router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, event_update: EventUpdate, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user["role"] not in ["coordinator", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if current_user["role"] == "coordinator" and event["coordinator_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only update your own events")
    
    update_data = {k: v for k, v in event_update.model_dump().items() if v is not None}
    
    if update_data:
        await db.events.update_one({"id": event_id}, {"$set": update_data})
        event.update(update_data)
    
    count = await db.registrations.count_documents({"event_id": event_id})
    return EventResponse(**event, registered_count=count)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user["role"] not in ["coordinator", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if current_user["role"] == "coordinator" and event["coordinator_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own events")
    
    await db.events.delete_one({"id": event_id})
    return {"message": "Event deleted successfully"}

# ============= REGISTRATION ROUTES =============

@api_router.post("/registrations", response_model=RegistrationResponse)
async def register_for_event(registration: RegistrationCreate, current_user: dict = Depends(get_current_user)):
    # Check if event exists
    event = await db.events.find_one({"id": registration.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already registered
    existing = await db.registrations.find_one({
        "event_id": registration.event_id,
        "user_id": current_user["user_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this event")
    
    # Check capacity
    count = await db.registrations.count_documents({"event_id": registration.event_id})
    if count >= event["capacity"]:
        raise HTTPException(status_code=400, detail="Event is full")
    
    registration_id = str(uuid.uuid4())
    
    # Generate QR code
    qr_data = f"eventflow:{registration.event_id}:{current_user['user_id']}:{registration_id}"
    qr_code_img = generate_qr_code(qr_data)
    
    reg_doc = {
        "id": registration_id,
        "event_id": registration.event_id,
        "user_id": current_user["user_id"],
        "qr_code": qr_code_img,
        "attendance_status": "registered",
        "registration_date": datetime.now(timezone.utc).isoformat()
    }
    
    await db.registrations.insert_one(reg_doc)
    
    return RegistrationResponse(**reg_doc, event_title=event["title"])

@api_router.get("/registrations/my", response_model=List[RegistrationResponse])
async def get_my_registrations(current_user: dict = Depends(get_current_user)):
    registrations = await db.registrations.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    # Add event titles
    result = []
    for reg in registrations:
        event = await db.events.find_one({"id": reg["event_id"]}, {"_id": 0})
        reg["event_title"] = event["title"] if event else "Unknown Event"
        result.append(RegistrationResponse(**reg))
    
    return result

@api_router.get("/registrations/event/{event_id}", response_model=List[dict])
async def get_event_registrations(event_id: str, current_user: dict = Depends(get_current_user)):
    # Check if user is coordinator or admin
    if current_user["role"] not in ["coordinator", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    registrations = await db.registrations.find({"event_id": event_id}, {"_id": 0}).to_list(1000)
    
    # Add user details
    result = []
    for reg in registrations:
        user = await db.users.find_one({"id": reg["user_id"]}, {"_id": 0})
        if user:
            result.append({
                **reg,
                "user_name": user["name"],
                "user_email": user["email"]
            })
    
    return result

@api_router.post("/attendance/mark")
async def mark_attendance(attendance: AttendanceUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["coordinator", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    result = await db.registrations.update_one(
        {"id": attendance.registration_id},
        {"$set": {"attendance_status": "attended"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    return {"message": "Attendance marked successfully"}

# ============= VOLUNTEER ROUTES =============

@api_router.post("/volunteers", response_model=VolunteerResponse)
async def add_volunteer(volunteer: VolunteerCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["coordinator", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Find user by email
    user = await db.users.find_one({"email": volunteer.user_email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already volunteer
    existing = await db.volunteers.find_one({
        "event_id": volunteer.event_id,
        "user_id": user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="User is already a volunteer for this event")
    
    volunteer_id = str(uuid.uuid4())
    
    vol_doc = {
        "id": volunteer_id,
        "event_id": volunteer.event_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_email": user["email"],
        "role": volunteer.role,
        "responsibilities": volunteer.responsibilities,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.volunteers.insert_one(vol_doc)
    
    return VolunteerResponse(**vol_doc)

@api_router.get("/volunteers/event/{event_id}", response_model=List[VolunteerResponse])
async def get_event_volunteers(event_id: str, current_user: dict = Depends(get_current_user)):
    volunteers = await db.volunteers.find({"event_id": event_id}, {"_id": 0}).to_list(1000)
    return [VolunteerResponse(**vol) for vol in volunteers]

# ============= FEEDBACK ROUTES =============

@api_router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(feedback: FeedbackCreate, current_user: dict = Depends(get_current_user)):
    # Check if user attended the event
    registration = await db.registrations.find_one({
        "event_id": feedback.event_id,
        "user_id": current_user["user_id"]
    })
    
    if not registration:
        raise HTTPException(status_code=400, detail="You must register for the event to give feedback")
    
    # Check if already submitted feedback
    existing = await db.feedback.find_one({
        "event_id": feedback.event_id,
        "user_id": current_user["user_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Feedback already submitted")
    
    feedback_id = str(uuid.uuid4())
    
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    
    feedback_doc = {
        "id": feedback_id,
        "event_id": feedback.event_id,
        "user_id": current_user["user_id"],
        "user_name": user["name"] if user else "",
        "rating": feedback.rating,
        "comment": feedback.comment,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.feedback.insert_one(feedback_doc)
    
    return FeedbackResponse(**feedback_doc)

@api_router.get("/feedback/event/{event_id}", response_model=List[FeedbackResponse])
async def get_event_feedback(event_id: str):
    feedback_list = await db.feedback.find({"event_id": event_id}, {"_id": 0}).to_list(1000)
    return [FeedbackResponse(**fb) for fb in feedback_list]

# ============= CHATBOT ROUTES =============

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(chat_msg: ChatMessage, current_user: dict = Depends(get_current_user)):
    try:
        # Get event data for context
        events = await db.events.find({}, {"_id": 0}).to_list(100)
        
        # Build context
        today = datetime.now(timezone.utc).date()
        upcoming_events = [e for e in events if e.get("status") == "upcoming"]
        
        context = f"You are EventFlow Assistant, a helpful chatbot for college event management.\\n\\n"
        context += f"Current Date: {today}\\n\\n"
        context += f"Upcoming Events:\\n"
        
        for event in upcoming_events[:5]:
            context += f"- {event['title']} on {event['date']} at {event['time']}, Venue: {event['venue']}, Category: {event['category']}\\n"
        
        context += "\\nAnswer questions about events, registration, feedback, and general queries."
        
        # Initialize chat
        session_id = chat_msg.session_id or str(uuid.uuid4())
        
        llm_chat = LlmChat(
            session_id=session_id,
            system_message=context
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=chat_msg.message)
        response = await llm_chat.send_message(user_message)
        
        return ChatResponse(response=response, session_id=session_id)
        
    except Exception as e:
        logging.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# ============= STATS ROUTES =============

@api_router.get("/stats/coordinator")
async def get_coordinator_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["coordinator", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Get coordinator events
    query = {} if current_user["role"] == "admin" else {"coordinator_id": current_user["user_id"]}
    events = await db.events.find(query, {"_id": 0}).to_list(1000)
    
    total_events = len(events)
    total_registrations = 0
    total_attendance = 0
    
    for event in events:
        regs = await db.registrations.find({"event_id": event["id"]}, {"_id": 0}).to_list(1000)
        total_registrations += len(regs)
        total_attendance += sum(1 for r in regs if r.get("attendance_status") == "attended")
    
    return {
        "total_events": total_events,
        "total_registrations": total_registrations,
        "total_attendance": total_attendance,
        "events": events
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import bcrypt
import requests as http_requests
from datetime import datetime, timezone, timedelta
from calendar import monthrange
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ============ MODELS ============

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleCallbackRequest(BaseModel):
    session_id: str

class SubscriptionCreate(BaseModel):
    name: str
    category: str = "Other"
    amount: float
    billing_cycle: str = "monthly"
    next_renewal: str
    last_used_date: Optional[str] = None
    cancel_url: Optional[str] = None
    payment_method: str = "card"
    payment_last4: Optional[str] = None
    is_trial: bool = False
    trial_end_date: Optional[str] = None
    notes: Optional[str] = None
    logo_color: str = "#42593E"

class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    billing_cycle: Optional[str] = None
    next_renewal: Optional[str] = None
    last_used_date: Optional[str] = None
    status: Optional[str] = None
    cancel_url: Optional[str] = None
    payment_method: Optional[str] = None
    payment_last4: Optional[str] = None
    is_trial: Optional[bool] = None
    trial_end_date: Optional[str] = None
    notes: Optional[str] = None
    logo_color: Optional[str] = None

class FamilyCreate(BaseModel):
    name: str

class FamilyMemberAdd(BaseModel):
    email: str
    name: str

class FamilySubscriptionCreate(BaseModel):
    name: str
    category: str = "Streaming"
    amount: float
    billing_cycle: str = "monthly"
    next_renewal: str
    num_members: int = 2


# ============ HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def calculate_health_score(sub: dict) -> int:
    score = 100
    now = datetime.now(timezone.utc)
    last_used = sub.get("last_used_date")
    if last_used:
        try:
            ld = datetime.fromisoformat(last_used)
            if ld.tzinfo is None:
                ld = ld.replace(tzinfo=timezone.utc)
            days = (now - ld).days
            if days > 90:
                score -= 60
            elif days > 60:
                score -= 40
            elif days > 30:
                score -= 20
            elif days > 14:
                score -= 10
        except Exception:
            pass
    else:
        score -= 15

    monthly = sub.get("amount", 0)
    bc = sub.get("billing_cycle", "monthly")
    if bc == "yearly":
        monthly /= 12
    elif bc == "quarterly":
        monthly /= 3
    if monthly > 2000:
        score -= 10
    elif monthly > 1000:
        score -= 5
    return max(0, min(100, score))

def get_health_label(score: int) -> str:
    if score >= 80:
        return "Excellent"
    elif score >= 60:
        return "Good"
    elif score >= 40:
        return "At Risk"
    return "Cancel?"

def get_monthly_cost(sub: dict) -> float:
    amount = sub.get("amount", 0)
    bc = sub.get("billing_cycle", "monthly")
    if bc == "yearly":
        return amount / 12
    elif bc == "quarterly":
        return amount / 3
    return amount

CANCEL_DB = {
    "netflix": {"url": "https://www.netflix.com/cancelplan", "steps": ["Go to netflix.com → Account", "Memberships & Billing → Cancel Membership", "Confirm cancellation"]},
    "spotify": {"url": "https://www.spotify.com/account/subscription/", "steps": ["Log in to spotify.com", "Account → Subscription → Cancel Premium", "Confirm at end of billing period"]},
    "amazon": {"url": "https://www.amazon.in/prime", "steps": ["Amazon.in → Account & Lists → Prime", "Manage Membership → End Membership", "Confirm cancellation"]},
    "youtube": {"url": "https://www.youtube.com/paid_memberships", "steps": ["youtube.com/paid_memberships", "YouTube Premium → Manage → Cancel", "Confirm cancellation"]},
    "adobe": {"url": "https://account.adobe.com/plans", "steps": ["account.adobe.com → Plans", "Manage Plan → Cancel Plan", "Follow prompts (early fee may apply)"]},
    "hotstar": {"url": "https://www.hotstar.com/in/account/subscription", "steps": ["Log in to Hotstar", "Account → Subscription → Cancel", "Confirm cancellation"]},
    "apple": {"url": "https://appleid.apple.com/account/manage/section/subscriptions", "steps": ["appleid.apple.com → Subscriptions", "Select service → Cancel", "Confirm cancellation"]},
    "microsoft": {"url": "https://account.microsoft.com/services", "steps": ["account.microsoft.com/services", "Find subscription → Manage → Cancel", "Confirm"]},
    "google": {"url": "https://play.google.com/store/account/subscriptions", "steps": ["play.google.com/subscriptions", "Find Google service → Cancel", "Confirm cancellation"]},
    "zee5": {"url": "https://www.zee5.com/subscription", "steps": ["Log in to Zee5", "Subscription → Cancel", "Confirm"]},
    "sonyliv": {"url": "https://www.sonyliv.com/settings", "steps": ["Log in to SonyLIV", "Settings → Subscription → Cancel", "Confirm"]},
    "linkedin": {"url": "https://www.linkedin.com/premium/cancel-subscription", "steps": ["LinkedIn → Me → Premium → Manage Premium", "Cancel Subscription", "Follow cancellation steps"]},
}

def get_cancel_info(name: str, cancel_url: Optional[str]) -> dict:
    nl = name.lower()
    matched = None
    for k, v in CANCEL_DB.items():
        if k in nl:
            matched = v
            break
    final_url = cancel_url or (matched["url"] if matched else f"https://www.google.com/search?q=cancel+{name.replace(' ', '+')}+subscription+india")
    steps = matched["steps"] if matched else [
        f"Visit {name}'s official website and log in",
        "Go to Account Settings or Profile",
        "Find Subscription, Billing or Membership section",
        "Click Cancel Subscription / Unsubscribe",
        "Confirm cancellation and note the effective date"
    ]
    email = f"""Subject: Request to Cancel {name} Subscription

Dear {name} Support Team,

I am writing to request the immediate cancellation of my subscription, effective today.

Please confirm:
1. Subscription has been successfully cancelled
2. No further charges will be made to my payment method
3. Any applicable refund for unused period

Thank you for your assistance.

Best regards"""
    return {"cancel_url": final_url, "steps": steps, "email_template": email}


async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            session_token = auth.split(" ")[1]
    if not session_token:
        raise HTTPException(401, "Not authenticated")

    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(401, "Invalid session")

    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(401, "Session expired")

    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(body: RegisterRequest, response: Response):
    existing = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(400, "Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed = hash_password(body.password)
    user = {
        "user_id": user_id,
        "email": body.email.lower(),
        "name": body.name,
        "picture": None,
        "auth_type": "email",
        "hashed_password": hashed,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)

    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat()
    })

    response.set_cookie("session_token", session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 3600)
    return {"message": "Registered", "user": {k: v for k, v in user.items() if k != "hashed_password"}}


@api_router.post("/auth/login")
async def login(body: LoginRequest, response: Response):
    user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if not user or not user.get("hashed_password"):
        raise HTTPException(401, "Invalid credentials")
    if not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(401, "Invalid credentials")

    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat()
    })

    response.set_cookie("session_token", session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 3600)
    return {"message": "Login successful", "user": {k: v for k, v in user.items() if k != "hashed_password"}}


@api_router.post("/auth/google/callback")
async def google_callback(body: GoogleCallbackRequest, response: Response):
    try:
        resp = http_requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": body.session_id},
            timeout=10
        )
        if resp.status_code != 200:
            raise HTTPException(400, "Failed to verify Google session")
        data = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Google auth error: {str(e)}")

    email = data.get("email", "").lower()
    name = data.get("name", email)
    picture = data.get("picture")
    session_token = data.get("session_token")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "auth_type": "google",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat()
    })

    response.set_cookie("session_token", session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 3600)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"message": "Google auth successful", "user": {k: v for k, v in user.items() if k != "hashed_password"}}


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "hashed_password"}


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out"}


# ============ SUBSCRIPTION ROUTES ============

@api_router.get("/subscriptions")
async def list_subscriptions(current_user: dict = Depends(get_current_user)):
    subs = await db.subscriptions.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    for sub in subs:
        sub["health_score"] = calculate_health_score(sub)
        sub["monthly_cost"] = round(get_monthly_cost(sub), 2)
    return subs


@api_router.post("/subscriptions")
async def create_subscription(body: SubscriptionCreate, current_user: dict = Depends(get_current_user)):
    sub_id = f"sub_{uuid.uuid4().hex[:12]}"
    sub = {
        "subscription_id": sub_id,
        "user_id": current_user["user_id"],
        "name": body.name,
        "category": body.category,
        "amount": body.amount,
        "billing_cycle": body.billing_cycle,
        "next_renewal": body.next_renewal,
        "last_used_date": body.last_used_date,
        "status": "active",
        "cancel_url": body.cancel_url,
        "payment_method": body.payment_method,
        "payment_last4": body.payment_last4,
        "is_trial": body.is_trial,
        "trial_end_date": body.trial_end_date,
        "notes": body.notes,
        "logo_color": body.logo_color,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.subscriptions.insert_one(sub)
    sub["health_score"] = calculate_health_score(sub)
    sub["monthly_cost"] = round(get_monthly_cost(sub), 2)
    return sub


@api_router.get("/subscriptions/{subscription_id}")
async def get_subscription(subscription_id: str, current_user: dict = Depends(get_current_user)):
    sub = await db.subscriptions.find_one({"subscription_id": subscription_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not sub:
        raise HTTPException(404, "Subscription not found")
    sub["health_score"] = calculate_health_score(sub)
    sub["monthly_cost"] = round(get_monthly_cost(sub), 2)
    return sub


@api_router.put("/subscriptions/{subscription_id}")
async def update_subscription(subscription_id: str, body: SubscriptionUpdate, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No updates provided")
    await db.subscriptions.update_one(
        {"subscription_id": subscription_id, "user_id": current_user["user_id"]},
        {"$set": updates}
    )
    sub = await db.subscriptions.find_one({"subscription_id": subscription_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not sub:
        raise HTTPException(404, "Subscription not found")
    sub["health_score"] = calculate_health_score(sub)
    sub["monthly_cost"] = round(get_monthly_cost(sub), 2)
    return sub


@api_router.delete("/subscriptions/{subscription_id}")
async def delete_subscription(subscription_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.subscriptions.delete_one({"subscription_id": subscription_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(404, "Subscription not found")
    await db.notifications.delete_many({"subscription_id": subscription_id, "user_id": current_user["user_id"]})
    return {"message": "Deleted"}


@api_router.post("/subscriptions/{subscription_id}/mark-used")
async def mark_used(subscription_id: str, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    result = await db.subscriptions.update_one(
        {"subscription_id": subscription_id, "user_id": current_user["user_id"]},
        {"$set": {"last_used_date": now}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Subscription not found")
    await db.notifications.delete_many({"user_id": current_user["user_id"], "subscription_id": subscription_id, "type": "unused_alert"})
    return {"message": "Marked as used", "last_used_date": now}


@api_router.get("/subscriptions/{subscription_id}/cancel-assist")
async def cancel_assist_info(subscription_id: str, current_user: dict = Depends(get_current_user)):
    sub = await db.subscriptions.find_one({"subscription_id": subscription_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not sub:
        raise HTTPException(404, "Subscription not found")
    sub["health_score"] = calculate_health_score(sub)
    sub["monthly_cost"] = round(get_monthly_cost(sub), 2)
    info = get_cancel_info(sub["name"], sub.get("cancel_url"))
    return {**info, "subscription": sub}


@api_router.get("/subscriptions/{subscription_id}/cancel-simulator")
async def cancel_simulator(subscription_id: str, current_user: dict = Depends(get_current_user)):
    sub = await db.subscriptions.find_one({"subscription_id": subscription_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not sub:
        raise HTTPException(404, "Subscription not found")
    monthly = get_monthly_cost(sub)
    return {
        "subscription_name": sub["name"],
        "monthly_savings": round(monthly, 2),
        "yearly_savings": round(monthly * 12, 2),
        "five_year_savings": round(monthly * 60, 2),
        "current_amount": sub["amount"],
        "billing_cycle": sub["billing_cycle"],
        "next_renewal": sub.get("next_renewal"),
    }


# ============ NOTIFICATION ROUTES ============

async def generate_notifications_for_user(user_id: str):
    subs = await db.subscriptions.find({"user_id": user_id, "status": "active"}, {"_id": 0}).to_list(1000)
    now = datetime.now(timezone.utc)

    for sub in subs:
        sid = sub["subscription_id"]

        # Renewal reminder (0-3 days)
        next_r = sub.get("next_renewal")
        if next_r:
            try:
                rd = datetime.fromisoformat(next_r)
                if rd.tzinfo is None:
                    rd = rd.replace(tzinfo=timezone.utc)
                days_until = (rd - now).days
                if 0 <= days_until <= 3:
                    ex = await db.notifications.find_one({"user_id": user_id, "subscription_id": sid, "type": "renewal_reminder", "is_read": False})
                    if not ex:
                        await db.notifications.insert_one({
                            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                            "user_id": user_id,
                            "type": "renewal_reminder",
                            "message": f"'{sub['name']}' renews in {days_until} day(s). ₹{sub['amount']:,.0f} will be charged.",
                            "subscription_id": sid,
                            "subscription_name": sub["name"],
                            "is_read": False,
                            "created_at": now.isoformat()
                        })
            except Exception:
                pass

        # Unused alert (21+ days)
        lu = sub.get("last_used_date")
        if lu:
            try:
                ld = datetime.fromisoformat(lu)
                if ld.tzinfo is None:
                    ld = ld.replace(tzinfo=timezone.utc)
                days_since = (now - ld).days
                if days_since >= 21:
                    ex = await db.notifications.find_one({"user_id": user_id, "subscription_id": sid, "type": "unused_alert", "is_read": False})
                    if not ex:
                        monthly = round(get_monthly_cost(sub))
                        await db.notifications.insert_one({
                            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                            "user_id": user_id,
                            "type": "unused_alert",
                            "message": f"You haven't used '{sub['name']}' in {days_since} days. Costing ₹{monthly:,}/month. Worth keeping?",
                            "subscription_id": sid,
                            "subscription_name": sub["name"],
                            "is_read": False,
                            "created_at": now.isoformat()
                        })
            except Exception:
                pass

        # Trial ending (0-3 days)
        if sub.get("is_trial") and sub.get("trial_end_date"):
            try:
                td = datetime.fromisoformat(sub["trial_end_date"])
                if td.tzinfo is None:
                    td = td.replace(tzinfo=timezone.utc)
                days_until = (td - now).days
                if 0 <= days_until <= 3:
                    ex = await db.notifications.find_one({"user_id": user_id, "subscription_id": sid, "type": "trial_ending"})
                    if not ex:
                        await db.notifications.insert_one({
                            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                            "user_id": user_id,
                            "type": "trial_ending",
                            "message": f"Free trial for '{sub['name']}' ends in {days_until} day(s)! Cancel now to avoid charges.",
                            "subscription_id": sid,
                            "subscription_name": sub["name"],
                            "is_read": False,
                            "created_at": now.isoformat()
                        })
            except Exception:
                pass


@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    await generate_notifications_for_user(current_user["user_id"])
    notifs = await db.notifications.find({"user_id": current_user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifs


@api_router.put("/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": current_user["user_id"]}, {"$set": {"is_read": True}})
    return {"message": "All marked as read"}


@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"notification_id": notification_id, "user_id": current_user["user_id"]}, {"$set": {"is_read": True}})
    return {"message": "Marked as read"}


@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.delete_one({"notification_id": notification_id, "user_id": current_user["user_id"]})
    return {"message": "Deleted"}


# ============ ANALYTICS ROUTES ============

@api_router.get("/analytics/dashboard")
async def analytics_dashboard(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    subs = await db.subscriptions.find({"user_id": user_id, "status": "active"}, {"_id": 0}).to_list(1000)

    monthly_spend = 0.0
    wasted_spend = 0.0
    category_breakdown = {}
    now = datetime.now(timezone.utc)

    for sub in subs:
        monthly = get_monthly_cost(sub)
        monthly_spend += monthly
        cat = sub.get("category", "Other")
        category_breakdown[cat] = category_breakdown.get(cat, 0) + monthly

        lu = sub.get("last_used_date")
        if lu:
            try:
                ld = datetime.fromisoformat(lu)
                if ld.tzinfo is None:
                    ld = ld.replace(tzinfo=timezone.utc)
                if (now - ld).days > 30:
                    wasted_spend += monthly
            except Exception:
                pass

    scores = [calculate_health_score(s) for s in subs]
    avg_health = sum(scores) / len(scores) if scores else 100

    return {
        "monthly_spend": round(monthly_spend, 2),
        "yearly_spend": round(monthly_spend * 12, 2),
        "wasted_spend": round(wasted_spend, 2),
        "subscription_count": len(subs),
        "category_breakdown": [{"name": k, "value": round(v, 2)} for k, v in sorted(category_breakdown.items(), key=lambda x: -x[1])],
        "health_average": round(avg_health, 1),
        "top_subscriptions": sorted(
            [{**s, "monthly_cost": round(get_monthly_cost(s), 2), "health_score": calculate_health_score(s)} for s in subs],
            key=lambda x: -x["monthly_cost"]
        )[:5]
    }


@api_router.get("/analytics/spending-trend")
async def spending_trend(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    subs = await db.subscriptions.find({"user_id": user_id, "status": "active"}, {"_id": 0}).to_list(1000)
    now = datetime.now(timezone.utc)
    months = []

    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        _, last_day = monthrange(y, m)
        month_end = datetime(y, m, last_day, 23, 59, 59, tzinfo=timezone.utc)

        month_spend = 0.0
        for sub in subs:
            created_str = sub.get("created_at", "")
            try:
                created = datetime.fromisoformat(created_str)
                if created.tzinfo is None:
                    created = created.replace(tzinfo=timezone.utc)
                if created <= month_end:
                    month_spend += get_monthly_cost(sub)
            except Exception:
                month_spend += get_monthly_cost(sub)

        months.append({"month": datetime(y, m, 1).strftime("%b"), "spend": round(month_spend, 2)})

    return months


# ============ FAMILY ROUTES ============

@api_router.get("/family")
async def get_family(current_user: dict = Depends(get_current_user)):
    family = await db.family_groups.find_one({"owner_id": current_user["user_id"]}, {"_id": 0})
    if not family:
        return None
    shared_subs = await db.family_subscriptions.find({"family_id": family["family_id"]}, {"_id": 0}).to_list(100)
    return {**family, "shared_subscriptions": shared_subs}


@api_router.post("/family")
async def create_family(body: FamilyCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.family_groups.find_one({"owner_id": current_user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(400, "Family group already exists")

    family = {
        "family_id": f"fam_{uuid.uuid4().hex[:12]}",
        "owner_id": current_user["user_id"],
        "name": body.name,
        "members": [{"user_id": current_user["user_id"], "email": current_user["email"], "name": current_user["name"], "role": "owner"}],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.family_groups.insert_one(family)
    return {**family, "shared_subscriptions": []}


@api_router.post("/family/members")
async def add_family_member(body: FamilyMemberAdd, current_user: dict = Depends(get_current_user)):
    family = await db.family_groups.find_one({"owner_id": current_user["user_id"]}, {"_id": 0})
    if not family:
        raise HTTPException(404, "No family group found. Create one first.")

    member = {"user_id": f"member_{uuid.uuid4().hex[:8]}", "email": body.email, "name": body.name, "role": "member"}
    await db.family_groups.update_one({"family_id": family["family_id"]}, {"$push": {"members": member}})
    return {"message": "Member added", "member": member}


@api_router.post("/family/subscriptions")
async def add_family_subscription(body: FamilySubscriptionCreate, current_user: dict = Depends(get_current_user)):
    family = await db.family_groups.find_one({"owner_id": current_user["user_id"]}, {"_id": 0})
    if not family:
        raise HTTPException(404, "No family group found. Create one first.")

    num_m = max(1, body.num_members)
    monthly_total = get_monthly_cost({"amount": body.amount, "billing_cycle": body.billing_cycle})
    monthly_per = round(monthly_total / num_m, 2)

    shared_sub = {
        "shared_sub_id": f"fsub_{uuid.uuid4().hex[:12]}",
        "family_id": family["family_id"],
        "name": body.name,
        "category": body.category,
        "amount": body.amount,
        "billing_cycle": body.billing_cycle,
        "next_renewal": body.next_renewal,
        "num_members": num_m,
        "share_per_member": round(body.amount / num_m, 2),
        "monthly_per_member": monthly_per,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.family_subscriptions.insert_one(shared_sub)
    return shared_sub


@api_router.delete("/family/subscriptions/{shared_sub_id}")
async def delete_family_subscription(shared_sub_id: str, current_user: dict = Depends(get_current_user)):
    family = await db.family_groups.find_one({"owner_id": current_user["user_id"]}, {"_id": 0})
    if not family:
        raise HTTPException(404, "No family group found")
    await db.family_subscriptions.delete_one({"shared_sub_id": shared_sub_id, "family_id": family["family_id"]})
    return {"message": "Deleted"}


@api_router.delete("/family/members/{member_user_id}")
async def remove_family_member(member_user_id: str, current_user: dict = Depends(get_current_user)):
    family = await db.family_groups.find_one({"owner_id": current_user["user_id"]}, {"_id": 0})
    if not family:
        raise HTTPException(404, "No family group found")
    await db.family_groups.update_one(
        {"family_id": family["family_id"]},
        {"$pull": {"members": {"user_id": member_user_id}}}
    )
    return {"message": "Member removed"}


# ============ APP SETUP ============

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()

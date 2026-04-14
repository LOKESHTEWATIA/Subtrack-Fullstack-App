# SubTrack 🌿

Your Subscription Command Centre. Track spending, get smart alerts, and cancel subscriptions you no longer need — all in one place. Built for India, tracks in ₹.

## Features

- **Dashboard** — Monthly/yearly spend, health scores, 6-month trend chart, smart alerts
- **Subscriptions** — Add, edit, delete, filter, search all your subscriptions
- **Analytics** — Category breakdown, health distribution, cancel candidates
- **Cancel Assist** — Step-by-step guides + email templates to cancel any service
- **Family Mode** — Share subscriptions and split costs between family members
- **Smart Notifications** — Renewal reminders, unused alerts, trial ending warnings
- **Auth** — Email/password + Google OAuth

---

## Tech Stack

| Layer    | Tech                                    |
|----------|-----------------------------------------|
| Frontend | React 18, Tailwind CSS, Recharts, shadcn/ui, Radix UI |
| Backend  | FastAPI, Motor (async MongoDB), bcrypt  |
| Database | MongoDB                                 |

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **MongoDB** — local instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

## Setup

### 1. MongoDB

**Option A — Local:**
```bash
# Install MongoDB Community Edition, then:
mongod --dbpath /data/db
```

**Option B — Atlas (recommended, free tier):**
1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net`

---

### 2. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set MONGO_URL, DB_NAME, CORS_ORIGINS, SECRET_KEY

# Start the server
uvicorn server:app --reload --port 8001
```

The API will be running at `http://localhost:8001`.

---

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# .env should contain:  REACT_APP_BACKEND_URL=http://localhost:8001

# Start the dev server
npm start
```

The app will open at `http://localhost:3000`.

---

## Project Structure

```
subtrack/
├── backend/
│   ├── server.py           # FastAPI app — all routes and business logic
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── index.js
    │   ├── App.js           # Routes + auth guard
    │   ├── constants.js     # Categories, colors, formatters
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── AuthCallback.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Subscriptions.jsx
    │   │   ├── Analytics.jsx
    │   │   ├── CancelAssist.jsx
    │   │   ├── FamilyMode.jsx
    │   │   └── Settings.jsx
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── AddSubscriptionModal.jsx
    │   │   └── ui/          # shadcn/ui components
    │   └── lib/
    │       └── utils.js     # cn() helper
    ├── package.json
    ├── craco.config.js      # Webpack alias for @/
    ├── tailwind.config.js
    └── .env.example
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/subscriptions` | List all subscriptions |
| POST | `/api/subscriptions` | Add subscription |
| PUT | `/api/subscriptions/:id` | Update subscription |
| DELETE | `/api/subscriptions/:id` | Delete subscription |
| POST | `/api/subscriptions/:id/mark-used` | Mark as used today |
| GET | `/api/subscriptions/:id/cancel-assist` | Get cancel guide |
| GET | `/api/subscriptions/:id/cancel-simulator` | Savings calculator |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/spending-trend` | 6-month trend |
| GET | `/api/notifications` | All notifications |
| PUT | `/api/notifications/read-all` | Mark all read |
| DELETE | `/api/notifications/:id` | Delete notification |
| GET | `/api/family` | Get family group |
| POST | `/api/family` | Create family group |
| POST | `/api/family/members` | Add member |
| POST | `/api/family/subscriptions` | Add shared subscription |

---

## Notes on Google OAuth

The app uses `auth.emergentagent.com` for Google OAuth — this was the OAuth provider on the original Emergent Agent platform. To use Google login locally you'll need to either:

- Set up your own Google OAuth app and update `LandingPage.jsx` + the callback handler in `server.py`
- Or just use email/password auth, which works out of the box

Email/password registration and login work fully without any OAuth setup.

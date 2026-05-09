# 📦 SubTrack — Subscription Management App

> Never lose track of what you're paying for again.

SubTrack is a full-stack subscription management application that helps users track, manage, and analyze all their recurring subscriptions in one place — with smart insights, reminders, and a clean dashboard.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, shadcn/ui, Tailwind CSS, Recharts |
| **Backend** | FastAPI (Python) |
| **Database** | MongoDB Atlas |
| **Auth** | JWT-based Authentication |

---

## ✨ Features

- 🔐 **User Authentication** — Secure signup/login with JWT tokens
- ➕ **Add Subscriptions** — Track any subscription with name, cost, billing cycle, and category
- 📊 **Dashboard Analytics** — Visual breakdown of monthly/annual spending
- 🗂️ **Category Management** — Organize subscriptions (Streaming, SaaS, Gaming, etc.)
- 🔔 **Renewal Reminders** — Get notified before a subscription renews
- 💰 **Spending Insights** — Charts showing spend trends and category breakdowns
- 🗑️ **Subscription CRUD** — Full create, read, update, delete support
- 📱 **Responsive UI** — Works seamlessly on desktop and mobile

---

## 🗂️ Project Structure

```
subtrack/
├── frontend/                  # React 18 application
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable UI components (shadcn/ui)
│   │   │   ├── ui/            # Base shadcn components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SubscriptionCard.jsx
│   │   │   ├── AddSubscriptionModal.jsx
│   │   │   └── SpendingChart.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Home.jsx
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities & API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/                   # FastAPI application
│   ├── main.py                # App entry point & route registration
│   ├── models/
│   │   ├── user.py            # User model (Pydantic)
│   │   └── subscription.py    # Subscription model (Pydantic)
│   ├── routes/
│   │   ├── auth.py            # /api/auth — Login, Register
│   │   └── subscriptions.py   # /api/subscriptions — CRUD
│   ├── database.py            # MongoDB Atlas connection (Motor)
│   ├── auth.py                # JWT helpers
│   └── requirements.txt
│
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+
- MongoDB Atlas account (or local MongoDB instance)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/subtrack.git
cd subtrack
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/subtrack
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Start the backend server:

```bash
uvicorn main:app --reload --port 8000
```

API will be available at: `http://localhost:8000`  
Swagger docs at: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## 🔌 API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login & receive JWT token |

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subscriptions` | Get all subscriptions for user |
| `POST` | `/api/subscriptions` | Add a new subscription |
| `PUT` | `/api/subscriptions/{id}` | Update a subscription |
| `DELETE` | `/api/subscriptions/{id}` | Delete a subscription |

> All subscription endpoints require a valid `Authorization: Bearer <token>` header.

---

## 📊 Data Model

### Subscription

```json
{
  "id": "ObjectId",
  "user_id": "ObjectId",
  "name": "Netflix",
  "cost": 649.00,
  "currency": "INR",
  "billing_cycle": "monthly",
  "category": "Streaming",
  "start_date": "2024-01-15",
  "next_renewal": "2025-06-15",
  "status": "active",
  "notes": "Family plan"
}
```

---

## 🛠️ Environment Variables

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `MONGODB_URL` | MongoDB Atlas connection string |
| `SECRET_KEY` | JWT signing secret |
| `ALGORITHM` | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry time |

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

---

## 📦 Build for Production

```bash
# Frontend production build
cd frontend
npm run build
```

```bash
# Backend production (with Gunicorn)
cd backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

---

## 🙌 Author

**Lokesh Tewatia**  
B.Tech Computer Engineering (AI & ML) — Shri Vishwakarma Skill University  
📎 [Portfolio](https://lokesh-tewatia.lovable.app)  
💼 [LinkedIn](https://linkedin.com/in/lokesh-tewatia)  
🐙 [GitHub](https://github.com/lokesh-tewatia)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> Built with ❤️ to stop forgetting about subscriptions I never use.

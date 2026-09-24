# ServiceDesk Pro — IT Helpdesk & Asset Management

A complete, AI-enabled MERN capstone: employees raise support tickets, technicians
resolve them under SLA timers, IT managers oversee performance, and asset managers
track hardware/software through its full lifecycle. Tickets are automatically
classified (category, priority, probable issue) and matched to knowledge base
solutions by a built-in AI engine — no external API key required.

---

## 1. Tech Stack

- **Frontend:** React 18 (Vite), React Router, Tailwind CSS, Axios, Recharts, Lucide Icons
- **Backend:** Node.js, Express.js, MongoDB + Mongoose, JWT auth, bcrypt
- **AI:** Local heuristic classification engine (`backend/utils/aiService.js`) — works
  fully offline; uses Google Gemini when `GEMINI_API_KEY` is set in `backend/.env`, otherwise falls back to the local engine.

## 2. Project Structure

```
servicedesk-pro/
├── backend/                 # Express REST API
│   ├── config/db.js
│   ├── controllers/         # Route handler logic (auth, tickets, assets, kb, dashboard...)
│   ├── models/              # Mongoose schemas
│   ├── routes/               
│   ├── middleware/          # JWT auth, RBAC, error handling
│   ├── utils/                # AI classification engine, token generation
│   ├── jobs/                 # SLA escalation cron job
│   ├── seed/seed.js         # Demo/test data generator
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/                # React (Vite) SPA
    ├── src/
    │   ├── api/              # Axios instance + endpoint functions
    │   ├── components/       # Sidebar, Topbar, Modal, Badge, StatCard...
    │   ├── context/          # AuthContext (JWT session state)
    │   ├── pages/            # Login, Dashboard, Tickets, Assets, KB, Admin screens
    │   └── styles/index.css  # Tailwind + custom design tokens
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env.example
```

## 3. Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) **or** a free MongoDB Atlas cluster

## 4. Setup Instructions

### Step 1 — Backend

```bash
cd backend
npm install
cp .env.example .env       # then edit .env with your own values (see below)
npm run seed                # populates DB with departments, categories, SLAs, users, assets, KB articles & sample tickets
npm run dev                  # starts the API with nodemon → http://localhost:5000
```

**`.env` values to fill in:**
```
MONGO_URI=mongodb://127.0.0.1:27017/servicedesk_pro
PORT=5000
NODE_ENV=development
JWT_SECRET=<generate a long random string>
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=            # Google AI Studio key (https://aistudio.google.com/apikey); blank = local AI engine
```

### Step 2 — Frontend

Open a **second terminal**:

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm run dev                  # → http://localhost:5173
```

That's it — visit **http://localhost:5173** in your browser.

## 5. Demo Login Credentials (created by `npm run seed`)

| Role           | Email                        | Password       |
|----------------|-------------------------------|----------------|
| System Admin   | admin@servicedesk.com        | Admin@123      |
| IT Manager     | manager@servicedesk.com      | Manager@123    |
| Technician     | tech1@servicedesk.com        | Tech@123       |
| Technician     | tech2@servicedesk.com        | Tech@123       |
| Asset Manager  | assets@servicedesk.com       | Asset@123      |
| Employee       | employee@servicedesk.com     | Employee@123   |

New public sign-ups (via the **Register** page) always default to the **Employee**
role. An Admin can promote any account to a different role from **Users → Edit**.
Admin/staff data and Employee data are kept fully separate at the database level
via a `role` field and role-based authorization middleware — employees can only
ever see and act on their own tickets, while staff roles see the full queue
according to their permissions.

## 6. Feature Coverage

- **Auth & RBAC:** JWT-based login/register, 5 distinct roles, protected routes on
  both frontend (route guards) and backend (middleware `protect` + `authorize`).
- **Ticket Lifecycle:** Create → AI classification → SLA timer assignment →
  assignment to technician → comments/internal notes → work logs → resolution →
  reopening, with a full audit trail (`ticket.history`).
- **SLA Engine:** Each priority maps to a configurable SLA policy (response &
  resolution hours). A cron job (`node-cron`, every 5 minutes) auto-escalates any
  ticket that breaches its resolution deadline and notifies IT Managers/Admins.
- **AI Integration:** `POST /api/tickets` runs the ticket text through a
  keyword-weighted classifier that assigns category, priority, and a "probable
  issue" label, and runs a MongoDB full-text search across the Knowledge Base to
  attach the most relevant articles — visible in the ticket detail's "AI Insights"
  panel.
- **Asset Management:** Full CRUD with lifecycle log (procurement → assignment →
  repair → retirement), vendor linkage, warranty tracking.
- **Knowledge Base:** Full-text searchable articles, tagging, view/helpful counters.
- **Dashboards:** Role-tailored stats — ticket funnels, SLA compliance %, average
  resolution time, technician workload bars, asset status/type breakdowns
  (Recharts pie/bar charts).
- **Notifications:** In-app notification center (assignment, comments, SLA
  breaches, status changes) with unread counts, polled every 30s.
- **Validation & Error Handling:** Mongoose schema validation, centralized Express
  error handler, consistent `{ success, data/message }` JSON envelope.
- **Responsive, distinctive UI:** Custom indigo/teal/coral palette (no default dark
  theme), rounded-2xl cards, soft shadows, gradient accents, mobile-friendly
  collapsible sidebar.

## 7. Available Scripts

**Backend** (`/backend`)
- `npm run dev` — start with nodemon (auto-restart)
- `npm start` — start in production mode
- `npm run seed` — reset & seed demo data

**Frontend** (`/frontend`)
- `npm run dev` — start Vite dev server
- `npm run build` — production build (outputs to `dist/`)
- `npm run preview` — preview the production build locally

## 8. Notes on Deployment-Readiness

- CORS is restricted to `CLIENT_URL` from `.env` — update this when deploying.
- Helmet + basic rate-limiting are enabled on all `/api` routes.
- The frontend reads its API base URL from `VITE_API_URL` — set this to your
  deployed backend URL (e.g. Render/Railway) when building for production.
- No hardcoded secrets — everything sensitive lives in `.env` files (excluded via
  `.gitignore`), so cloning this project into a fresh environment and supplying
  your own `MONGO_URI` / `JWT_SECRET` is all that's required to run it anywhere.

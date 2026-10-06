# ServiceDesk Pro — Frontend

React + Vite + Tailwind frontend for the ServiceDesk Pro helpdesk system.

## Setup
```bash
cd frontend
npm install
cp .env.example .env   # fill in value below
npm run dev            # http://localhost:5173
```

## Env Variables (.env)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL, including `/api` (e.g. `https://your-backend.onrender.com/api`) |

## Scripts
```bash
npm run dev       # dev server
npm run build     # production build -> /dist
npm run preview   # preview production build
```

## Deployment (Vercel)
- Root directory: `frontend`
- Set `VITE_API_URL` in Environment Variables, then **redeploy** (env changes need a fresh build).
- Backend's `CLIENT_URL` must match this app's deployed URL exactly, or you'll get a CORS error.

## File Structure
```
frontend/
  src/
    api/          # axios instance + API calls
    components/   # Sidebar, Topbar, Layout, shared UI
    context/      # AuthContext
    pages/        # Dashboard, Tickets, Admin, Profile, etc.
    styles/       # Tailwind entry + global CSS
```

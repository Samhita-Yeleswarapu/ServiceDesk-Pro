# ServiceDesk Pro — Backend

Node.js / Express / MongoDB API for the ServiceDesk Pro helpdesk system.

## Setup
```bash
cd backend
npm install
cp .env.example .env   # fill in values below
npm run dev            # http://localhost:5000/api
```

## Env Variables (.env)
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `PORT` | API port (default 5000) |
| `NODE_ENV` | development / production |
| `JWT_SECRET` | Random string for signing auth tokens |
| `JWT_EXPIRE` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Deployed frontend URL (for CORS) |
| `GEMINI_API_KEY` | Google AI Studio key — blank = local AI fallback |
| `GEMINI_MODEL` | Optional model override |

## Scripts
```bash
npm run dev     # dev server (nodemon)
npm start       # production start
npm run seed    # reset + seed demo data (don't run on live data)
```

## Deployment (Render)
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Add the env variables above; set `CLIENT_URL` to your exact Vercel URL.

## File Structure
```
backend/
  config/        # DB connection
  controllers/    # route logic
  jobs/           # SLA escalation cron job
  middleware/     # auth, error handling
  models/         # Mongoose schemas
  routes/         # API routes
  seed/           # demo data seeder
  utils/          # aiService (Gemini), helpers
  server.js
```

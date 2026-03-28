# ChatApp — 3-Part Architecture

```
chat-app/
├── frontend/    → Deploy to Vercel
├── backend/     → Deploy to Render
└── database/    → MongoDB Atlas (models + seed)
```

---

## 1. Database (MongoDB Atlas)
- Already configured. Connection string lives in `backend/.env`
- To seed the default "general" room:
  ```bash
  cd database
  npm install
  npm run seed
  ```

---

## 2. Backend (Render)
1. Push the `backend/` folder to its own GitHub repo
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set these environment variables in the Render dashboard:
   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | your Atlas connection string |
   | `JWT_SECRET` | a long random secret |
   | `CLIENT_ORIGIN` | your Vercel frontend URL |
4. Build command: `npm install` · Start command: `npm start`
5. Note your Render URL: `https://chatapp-backend.onrender.com`

### Local dev
```bash
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev
```

---

## 3. Frontend (Vercel)
1. Update `frontend/.env.production` with your Render backend URL
2. Push the `frontend/` folder to its own GitHub repo
3. Import into [vercel.com](https://vercel.com) — it auto-detects React
4. Add environment variables in Vercel dashboard:
   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | `https://your-backend.onrender.com/api` |
   | `REACT_APP_SERVER_URL` | `https://your-backend.onrender.com` |

### Local dev
```bash
cd frontend
npm install
npm start        # connects to localhost:5000 via .env.development
```

---

## Quick local dev (both together)
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

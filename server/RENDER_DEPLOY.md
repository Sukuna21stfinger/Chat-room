Render deployment guide for Chat App Server

Overview
- Render supports long-lived Node processes and WebSockets, so it's a good fit for this realtime chat server (socket.io).

Steps to deploy the server to Render
1. Push the `server` folder (or the repository root) to GitHub and make sure Render can access the repo.

2. On Render dashboard, create a new "Web Service" and connect the repository/branch.
   - Environment: Node
   - Name: chat-app-server (choose as you like)
   - Region/Plan: choose according to traffic (Starter is fine for testing)
   - Build Command: leave blank or use `npm install` (Render runs `npm install` automatically)
   - Start Command: `npm start`
   - Health Check Path: `/` (the server exposes a small health endpoint)

3. Set environment variables (in Render dashboard - "Environment" section):
   - `MONGODB_URI` = your MongoDB connection string (Atlas recommended)
   - `JWT_SECRET` = a strong secret for signing tokens
   - `CLIENT_ORIGIN` = the deployed client URL (e.g. `https://your-client-domain.com`) or a comma-separated list of allowed origins. For local testing use `http://localhost:3000`.

4. Important: make sure your MongoDB Atlas IP access list allows connections from Render (use 0.0.0.0/0 temporarily or add Render static IP ranges if needed).

5. Deploy and monitor logs. The server prints `Connected to MongoDB` and `Server running on port ...` on success.

Notes & Recommendations
- Socket.io and WebSockets work reliably on Render. Avoid serverless platforms (like Vercel) for socket.io.
- Use a managed MongoDB (Atlas) for production. Keep `JWT_SECRET` secret.
- If you prefer IaC, you can add `render.yaml` (sample included) and configure repo-based deployment.

Troubleshooting
- DNS or `querySrv ENOTFOUND` errors usually indicate an incorrect `MONGODB_URI` (check cluster name and credentials).
- If CORS errors occur, set `CLIENT_ORIGIN` to your client URL.
- If login/register fails, check server logs for DB connection and auth errors.

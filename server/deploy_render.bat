@echo off
setlocal enabledelayedexpansion
echo Render deployment helper - creates local server .env and optionally pushes to GitHub.

rem Prompt for required values
set /p MONGO="Enter MongoDB Atlas connection string (mongodb+srv://...): "
set /p JWT="Enter JWT_SECRET (keep secret): "
set /p CLIENT_ORIGIN="Enter CLIENT_ORIGIN (e.g. http://localhost:3000): "

if not exist server mkdir server

rem Write environment file (local only - do NOT commit secrets)
(
  echo MONGODB_URI=%MONGO%
  echo JWT_SECRET=%JWT%
  echo CLIENT_ORIGIN=%CLIENT_ORIGIN%
) > server\.env

echo.
echo Created server\.env (local only). Contents:
type server\.env
echo.

rem Optionally push to GitHub
set /p PUSH="Push repository to GitHub now? (y/n): "
if /I "%PUSH%"=="y" (
  echo Preparing to push. Make sure your git remote origin is set to your GitHub repo.
  set /p COMMSG="Commit message (leave empty for default): "
  if "%COMMSG%"=="" set COMMSG=Prepare server for Render deploy
  git add .
  git commit -m "%COMMSG%"
  git push origin main
) else (
  echo Skipping git push. You can push manually when ready.
)

echo.
echo NEXT STEPS:
echo 1) Create a MongoDB Atlas cluster and database user, then verify the connection string above.
echo 2) On Render (https://dashboard.render.com) create a new Web Service and connect your GitHub repo: Sukuna21stfinger/Chat-room
echo    - Name: chat-app-server
echo    - Region: choose nearest
echo    - Branch: main
echo    - Root Directory: server
echo    - Build Command: npm install
echo    - Start Command: npm start
echo    - Instance: Free
echo 3) Add Environment Variables in Render (Advanced -> Environment Variables):
echo    MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN
echo 4) Create the service and wait for Render to build and deploy. The service URL will be shown after deployment.

echo Opening Render dashboard and your GitHub repo in your browser...
start "" "https://dashboard.render.com/"
start "" "https://github.com/Sukuna21stfinger/Chat-Room"

echo.
echo Done. Press any key to close.
pause >nul

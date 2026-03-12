@echo off
REM Stop ChatApp Server by killing the window titled "ChatApp Server"
REM Usage: run from anywhere









exit /b 0)  echo No server window found or failed to stop.) else (  echo Server stopped.if %ERRORLEVEL%==0 (taskkill /FI "WINDOWTITLE eq ChatApp Server" /F /T >nul 2>&1necho Stopping ChatApp Server...
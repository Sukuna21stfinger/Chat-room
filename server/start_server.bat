@echo off
REM Start ChatApp Server in a new command window titled "ChatApp Server"
REM Usage: double-click or run from anywhere































exit /b 0start "ChatApp Server" cmd /k "cd /d "%~dp0" && npm start"
necho Starting ChatApp Server in a new window...)  echo No .env file found in %~dp0 — skipping env load) else (  )    )      )        )          set "%key%=%value%"          )            if "%value:~0,1%"=="\"" set "value=%value:~1,-1%"            set value=%%B          if defined value (          rem remove surrounding quotes (basic)          set "value=%%B"          set "key=%%A"        for /f "tokens=1* delims==" %%A in ("%%L") do (      if errorlevel 1 (      echo %%L| findstr /b "#" >nul    if defined line (    rem skip comments and empty lines    set "line=%%L"  for /f "usebackq tokens=* delims=" %%L in ("%~dp0\.env") do (  echo Loading environment variables from .envif exist "%~dp0\.env" (
:: If .env exists, load variables into environment for this processcd /d "%~dp0":: Move to script directory (server folder)
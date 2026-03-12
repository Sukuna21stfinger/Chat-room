@echo off
REM Generate a 512x512 favicon.ico from a simple placeholder using Node script.
cd /d "%~dp0"
cd ..

















exit /b 0pauseecho Icon generated at client\public\favicon.ico)  exit /b 1  pause  echo Icon generation failed.if %ERRORLEVEL% neq 0 (node scripts\generate_icon.jsecho Running icon generator...)  exit /b 1  pause  echo npm install failed. Please run the command manually and ensure internet access.if %ERRORLEVEL% neq 0 (npm install --no-audit --no-fund --save-dev jimp png-to-iconecho Installing generation dependencies (jimp, png-to-ico)...
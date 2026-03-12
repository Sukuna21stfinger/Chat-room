@echo off
REM Run ChatBox desktop app. If chatbox.exe not present in repo root, attempt to copy
REM the built electron executable from client/dist/win-unpacked/ to repo root as chatbox.exe










































exit /b 0
:EOFgoto :EOFecho Please build the client first: cd client && npm run distecho No built electron executable found.)  )    goto :EOF    echo Failed to copy the exe. Please check permissions.  ) else (    goto :EOF    start "ChatBox" "%EXE_TARGET%"    echo Copy succeeded. Launching chatbox.exe...  if %ERRORLEVEL%==0 (  copy /Y "%EXE_ALT%" "%EXE_TARGET%" >nul  echo Copying alternate electron.exe to project root as chatbox.exe...if exist "%EXE_ALT%" ()  )    goto :EOF    echo Failed to copy the exe. Please check permissions.  ) else (    goto :EOF    start "ChatBox" "%EXE_TARGET%"    echo Copy succeeded. Launching chatbox.exe...  if %ERRORLEVEL%==0 (  copy /Y "%EXE_SOURCE%" "%EXE_TARGET%" >nul  echo Copying built ChatApp.exe to project root as chatbox.exe...if exist "%EXE_SOURCE%" (
:copyIfBuilt)  goto :EOF  start "ChatBox" "%EXE_TARGET%"  echo Found %EXE_TARGET%, launching...if exist "%EXE_TARGET%" (
:checkset EXE_TARGET=%ROOT%chatbox.exeset EXE_ALT=%ROOT%client\dist\win-unpacked\electron.exeset EXE_SOURCE=%ROOT%client\dist\win-unpacked\ChatApp.exeset ROOT=%~dp0:: Paths
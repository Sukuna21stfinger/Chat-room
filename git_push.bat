@echo off
REM Usage: git_push.bat "Commit message"
SETLOCAL ENABLEDELAYEDEXPANSION
IF "%~1"=="" (
  set "MSG=Auto commit from script"
) ELSE (
  set "MSG=%~1"
)
echo Staging all changes...
git add --all
echo Committing with message: %MSG%
git commit -m "%MSG%"




pauseENDLOCALgit push origin HEADnecho Pushing to origin...
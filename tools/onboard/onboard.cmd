@echo off
REM Convenience launcher for Onboard on Windows.
REM Lets you run the tool without activating the venv or touching PATH.
REM Usage (from anywhere):
REM   C:\Users\charl\Downloads\onboard\onboard.cmd start
REM Or, when you're in the repo folder:
REM   onboard.cmd start
REM   onboard.cmd build --name "Charlie" --role analyst --account acme-retail --seniority junior --start-date 2026-07-01
REM   onboard.cmd check

REM Always run from the repo root (where config/ and docs/ live).
cd /d "%~dp0"

REM Put the GTK runtime on PATH so WeasyPrint can render the PDF.
set "PATH=C:\Program Files\GTK3-Runtime Win64\bin;%PATH%"

REM Call the tool installed in the project's virtual environment, passing all args.
"%~dp0.venv\Scripts\onboard.exe" %*

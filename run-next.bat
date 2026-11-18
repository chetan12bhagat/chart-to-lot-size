@echo off
cd /d "%~dp0"
echo Starting Chart to Lot Size Next.js server on http://localhost:3000 ...
start http://localhost:3000
npm run dev
pause

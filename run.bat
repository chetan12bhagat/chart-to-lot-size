@echo off
cd /d "%~dp0"
echo Starting Chart to Lot Size server...
start http://localhost:5000
python app.py
pause

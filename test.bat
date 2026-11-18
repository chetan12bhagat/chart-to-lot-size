@echo off
cd /d "%~dp0"
echo Running tests...
python -m pytest test_app.py -v
pause

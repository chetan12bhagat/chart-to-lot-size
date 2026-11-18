import os
import sys

# Add project root to sys.path so it can find app.py and dependencies
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Expose app for Vercel Serverless WSGI handler
if __name__ == "__main__":
    app.run()

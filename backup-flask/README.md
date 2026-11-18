# Chart to Lot Size

Paste a trading chart screenshot, read entry / stop loss / take profit
with Claude, and get your lot size. You can also type prices by hand —
the calculator works fully offline in that mode (no API key required).

Supported instruments:
- Forex pairs (EURUSD, GBPUSD, etc. — pip 0.0001)
- JPY pairs (USDJPY, GBPJPY, etc. — pip 0.01)
- Gold (XAUUSD — pip 0.1)
- Crypto (BTCUSD, ETHUSD — point 1.0)
- Indices (US30, NAS100, SPX500 — point 1.0)

Features:
- **Instant AI Chart Reading**: Claude reads Entry Price (EP), Stop Loss (SL), and Take Profit (TP).
- **Trade Direction Detection**: Visual Buy/Long vs Sell/Short indicator and validation.
- **Smart Clipboard Pasting**: Paste screenshots directly with Ctrl+V / Cmd+V.
- **Robust Price Parsing**: Handles comma-formatted prices (`2,350.50`), currency signs, and various image formats (PNG, JPEG, WebP, GIF).
- **Offline & Privacy First**: Offline manual mode works with zero credentials. The Anthropic API key lives only on the server in `ANTHROPIC_API_KEY` and is never exposed to the client.

## Run locally

```bash
pip install -r requirements.txt
```

### Start the server

Offline mode (manual price entry) starts without any environment variables:
```bash
python app.py
```

To enable AI chart screenshot reading, set your API key:

**Mac / Linux**:
```bash
export ANTHROPIC_API_KEY="your-key-here"
# optional, recommended if you share the link:
export APP_PASSWORD="choose-a-password"
python app.py
```

**Windows (Command Prompt)**:
```cmd
set ANTHROPIC_API_KEY=your-key-here
set APP_PASSWORD=choose-a-password
python app.py
```

**Windows (PowerShell)**:
```powershell
$env:ANTHROPIC_API_KEY="your-key-here"
python app.py
```

Open http://localhost:5000

## Run tests

```bash
pytest
```

## Open from a phone on the same Wi-Fi

Find your computer's local IP (for example `192.168.1.10`), then on your
phone open `http://192.168.1.10:5000` while both devices are on the same
Wi-Fi network.

## Deploy on Render

1. Push this folder to a Git repo and create a new Web Service on Render.
2. Build command: `pip install -r requirements.txt`
3. Start command: `gunicorn app:app`
4. In the Render dashboard, set these environment variables:
   - `ANTHROPIC_API_KEY` — your Anthropic key
   - `APP_PASSWORD` — a password for the app (recommended)
   - `CLAUDE_MODEL` — optional, defaults to `claude-sonnet-5-5`
   - `MAX_READS_PER_HOUR` — optional rate limit per IP, defaults to `20`

## Security & Usage Warning

Anyone with the link can use the app and spend your Anthropic API
credit. Set `APP_PASSWORD` before you share the link, and keep your
API key private — never put it in the HTML, in a screenshot, or in
a public repo.

# Chart to Lot Size

AI-powered trading position size and risk calculator. Paste or upload a trading chart screenshot to extract Entry Price (EP), Stop Loss (SL), and Take Profit (TP) with Claude Vision AI, or calculate lot sizes manually offline.

Available in both **Next.js (App Router + TypeScript + Tailwind CSS)** and original **Flask (Python)** implementations.

---

## Supported Instruments

- **Forex Majors & Minors** (EURUSD, GBPUSD, etc. — pip 0.0001, $10/pip per standard lot)
- **JPY Pairs** (USDJPY, GBPJPY, etc. — pip 0.01, $10/pip per standard lot)
- **Gold (XAUUSD)** (pip 0.10 / $0.10 move, $10/pip per 100 oz standard lot)
- **Crypto** (BTCUSD, ETHUSD — point 1.0, $1/point)
- **Indices** (US30, NAS100, SPX500 — point 1.0, $1/point)

---

## Features

- **Instant AI Chart Reading**: Claude Vision reads Entry, Stop Loss, and Take Profit levels from screenshots.
- **Trade Direction Detection**: Visual BUY / LONG vs. SELL / SHORT indicator with trade boundary validation.
- **Smart Clipboard Pasting**: Paste screenshots directly with `Ctrl+V` / `Cmd+V`, or drag-and-drop.
- **Position Sizing Formula**: Calculates exact lot sizes via $D = A \div B \div C$ ($\text{Risk} \div \text{Stop Pips} \div \text{Pip Value}$).
- **Micro Lot Alert**: Highlights positions below broker minimum 0.01 micro lot.
- **Risk : Reward Visualizer**: Dynamic visual ratio bar and PnL win/loss projection.
- **Offline & Privacy First**: Manual calculator operates 100% client-side with zero external API calls.
- **Server Security**: API key lives strictly on the server; timing-safe password protection and IP-based rate limiting built in.

---

## 1. Next.js Version (Recommended)

### Prerequisites
- Node.js 18+ (tested on Node 20 & 22)

### Install & Configure
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
```

### Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

*(On Windows, you can double-click `run-next.bat`)*

### Run Tests
```bash
npm test
```

### Production Build
```bash
npm run build
npm start
```

---

## 2. Python Flask Version

### Prerequisites
- Python 3.9+

### Install & Configure
```bash
pip install -r requirements.txt
```

### Run Locally
```bash
# Offline mode (no API key needed):
python app.py

# With AI chart reading:
export ANTHROPIC_API_KEY="your-key-here"
python app.py
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

*(On Windows, you can double-click `run.bat`)*

### Run Tests
```bash
pytest
```

---

## Security & Usage

Anyone with the link can use the app and consume Anthropic API credit. Set `APP_PASSWORD` in your environment before sharing publicly, and keep your API key private.

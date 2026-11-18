"""Chart to Lot Size - Flask backend.

Serves index.html and reads entry / stop loss / take profit prices
from a chart screenshot using the Anthropic Messages API.

The Anthropic API key lives only on the server, in the
ANTHROPIC_API_KEY environment variable. It is never sent to the browser.
"""

import base64
import hmac
import json
import os
import re
import time
from collections import defaultdict

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import anthropic
import httpx
from flask import Flask, jsonify, request, send_from_directory

ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}
MIME_ALIASES = {
    "image/jpg": "image/jpeg",
    "image/pjpeg": "image/jpeg",
    "image/x-png": "image/png",
}
MAX_BYTES = 5 * 1024 * 1024
MAX_READS_PER_HOUR = int(os.environ.get("MAX_READS_PER_HOUR", 20))

PROMPT = (
    "This image is a trading chart screenshot with a trade idea drawn on it "
    "(entry, take profit and stop loss levels). Read the price numbers from "
    "the image. Return ONLY JSON, no other text: "
    '{"instrument":"gold"|"jpy"|"forex"|"crypto"|"indices","direction":"buy"|"sell",'
    '"entry":number,"sl":number,"tp":number}. '
    "Use the exact numbers shown for the entry price (EP), stop loss (SL) "
    "and take profit (TP) levels. Format prices as plain numbers without commas "
    "or currency symbols (e.g. 2350.5, not 2,350.5). "
    "If a value is unreadable, use null for it."
)

app = Flask(__name__)

# Initialize client if key is available; otherwise client is initialized lazily
# or flagged with an informative error if ANTHROPIC_API_KEY is not set.
_api_key = os.environ.get("ANTHROPIC_API_KEY")
client = None
if _api_key:
    # trust_env=False: do not let stray HTTP(S)_PROXY / NO_PROXY values in the
    # host environment break the Anthropic client (e.g. bracketed IPv6 entries).
    client = anthropic.Anthropic(
        api_key=_api_key,
        http_client=httpx.Client(timeout=60.0, trust_env=False)
    )

# ip -> [timestamps of chart reads in the last hour]
_RATE_LIMITS = defaultdict(list)


def _get_client_ip():
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def _rate_limited(ip):
    now = time.time()
    # Periodic pruning to prevent memory growth
    if len(_RATE_LIMITS) > 500:
        stale_ips = [k for k, v in _RATE_LIMITS.items() if not v or (now - v[-1] >= 3600)]
        for k in stale_ips:
            del _RATE_LIMITS[k]

    recent = [t for t in _RATE_LIMITS[ip] if now - t < 3600]
    if len(recent) >= MAX_READS_PER_HOUR:
        _RATE_LIMITS[ip] = recent
        return True
    recent.append(now)
    _RATE_LIMITS[ip] = recent
    return False


def _to_float(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = re.sub(r"[^\d.-]", "", value.strip())
        if not cleaned or cleaned in ("-", ".", "-."):
            return None
        try:
            return float(cleaned)
        except (TypeError, ValueError):
            return None
    return None


def _extract_text(response):
    content = getattr(response, "content", None)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            text = getattr(block, "text", None)
            if text:
                parts.append(text)
            elif isinstance(block, dict) and block.get("text"):
                parts.append(block["text"])
        return "".join(parts)
    return ""


def _parse_chart_json(text):
    cleaned = (text or "").strip()
    # Check if reply is wrapped inside a ```json ... ``` code fence
    fence_match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", cleaned, re.IGNORECASE)
    candidate = fence_match.group(1).strip() if fence_match else cleaned

    match = re.search(r"\{[\s\S]*\}", candidate)
    if not match:
        raise ValueError("no JSON object in reply")

    raw_json = match.group(0)
    # Strip trailing commas before closing braces/brackets (e.g. {"a": 1, })
    cleaned_json = re.sub(r",\s*([\]}])", r"\1", raw_json)

    try:
        data = json.loads(cleaned_json)
    except Exception:
        data = json.loads(raw_json)

    if not isinstance(data, dict):
        raise ValueError("reply JSON is not an object")

    instrument = data.get("instrument")
    if instrument not in ("gold", "jpy", "forex", "crypto", "indices"):
        instrument = "forex"
    direction = data.get("direction")
    if direction not in ("buy", "sell"):
        direction = None
    return {
        "instrument": instrument,
        "direction": direction,
        "entry": _to_float(data.get("entry")),
        "sl": _to_float(data.get("sl")),
        "tp": _to_float(data.get("tp")),
    }


@app.route("/")
def index():
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), "index.html")


@app.route("/api/read-chart", methods=["POST"])
def read_chart():
    # Password protection, if configured. Checked before any other work.
    expected_password = os.environ.get("APP_PASSWORD")
    if expected_password:
        supplied = request.headers.get("X-App-Password", "")
        if not hmac.compare_digest(supplied, expected_password):
            return jsonify({"error": "Wrong password"}), 401

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    uploaded = request.files["image"]
    if not uploaded or not uploaded.filename:
        return jsonify({"error": "No image uploaded"}), 400

    media_type = (uploaded.mimetype or "").lower()
    media_type = MIME_ALIASES.get(media_type, media_type)

    if media_type not in ALLOWED_TYPES:
        ext = os.path.splitext(uploaded.filename or "")[1].lower()
        ext_to_mime = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".gif": "image/gif",
        }
        if ext in ext_to_mime:
            media_type = ext_to_mime[ext]
        else:
            return jsonify({"error": "Only PNG, JPEG, WebP or GIF images are allowed"}), 400

    data = uploaded.read()
    if len(data) > MAX_BYTES:
        return jsonify({"error": "Image is too large (max 5 MB)"}), 413
    if not data:
        return jsonify({"error": "No image uploaded"}), 400

    ip = _get_client_ip()
    if _rate_limited(ip):
        return jsonify({"error": "Too many chart reads. Try again later."}), 429

    global client
    if not client:
        key = os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            # Try loading from .env file as a fallback (e.g. when server
            # started before the .env file was written)
            try:
                from dotenv import load_dotenv
                load_dotenv(override=False)  # don't clobber already-set vars
            except ImportError:
                pass
            key = os.environ.get("ANTHROPIC_API_KEY")
        if key:
            client = anthropic.Anthropic(
                api_key=key,
                http_client=httpx.Client(timeout=60.0, trust_env=False)
            )
        else:
            return jsonify({
                "error": "ANTHROPIC_API_KEY is not configured on the server. "
                         "Set the key in a .env file or environment variable to use AI chart reading, or type prices manually."
            }), 503

    b64 = base64.b64encode(data).decode("utf-8")
    model = os.environ.get("CLAUDE_MODEL", "claude-sonnet-5-5")

    try:
        response = client.messages.create(
            model=model,
            max_tokens=300,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": b64,
                            },
                        },
                        {"type": "text", "text": PROMPT},
                    ],
                }
            ],
        )
    except anthropic.RateLimitError:
        return jsonify({"error": "The AI service is busy. Try again in a minute."}), 429
    except anthropic.AuthenticationError:
        return jsonify({"error": "Server is not configured correctly"}), 500
    except anthropic.APITimeoutError:
        return jsonify({"error": "The AI service timed out. Try again."}), 504
    except anthropic.APIError:
        return jsonify({"error": "Could not read the chart"}), 502
    except Exception:
        return jsonify({"error": "Could not read the chart"}), 500

    try:
        result = _parse_chart_json(_extract_text(response))
    except Exception:
        return jsonify({"error": "Could not read the chart"}), 502

    return jsonify(result), 200


if __name__ == "__main__":
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print(
            "INFO: ANTHROPIC_API_KEY is not set. "
            "Manual calculation works offline, but AI chart reading requires setting ANTHROPIC_API_KEY."
        )
    port = int(os.environ.get("PORT", 5000))
    print(f"Chart to Lot Size server starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port)

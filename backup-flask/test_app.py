"""Tests for app.py. The Anthropic client is mocked - no real API calls."""

import io
import json
import os
import sys
from types import SimpleNamespace

import pytest

# Set a dummy key before importing app, so the startup check passes.
os.environ["ANTHROPIC_API_KEY"] = "test-key-for-pytest"
os.environ.pop("APP_PASSWORD", None)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import app as app_module  # noqa: E402


@pytest.fixture
def client():
    app_module.app.config["TESTING"] = True
    app_module._RATE_LIMITS.clear()
    os.environ.pop("APP_PASSWORD", None)
    with app_module.app.test_client() as c:
        yield c
    app_module._RATE_LIMITS.clear()
    os.environ.pop("APP_PASSWORD", None)


def _png_bytes():
    # Minimal valid PNG header + some bytes; the server only checks type/size.
    return b"\x89PNG\r\n\x1a\n" + b"\x00" * 100


def _mock_response(text):
    """Fake Anthropic response with .content[0].text == text."""
    return SimpleNamespace(content=[SimpleNamespace(text=text)])


def _mock_client(monkeypatch, text):
    fake = SimpleNamespace(
        messages=SimpleNamespace(
            create=lambda **kwargs: _mock_response(text)
        )
    )
    monkeypatch.setattr(app_module, "client", fake)
    return fake


def test_missing_image(client):
    res = client.post("/api/read-chart", data={})
    assert res.status_code == 400
    assert "error" in res.get_json()


def test_wrong_file_type(client):
    data = {"image": (io.BytesIO(b"hello"), "note.txt", "text/plain")}
    res = client.post("/api/read-chart", data=data, content_type="multipart/form-data")
    assert res.status_code == 400
    assert "error" in res.get_json()


def test_oversized_file(client):
    big = b"\x00" * (5 * 1024 * 1024 + 1)
    data = {"image": (io.BytesIO(big), "big.png", "image/png")}
    res = client.post("/api/read-chart", data=data, content_type="multipart/form-data")
    assert res.status_code == 413
    assert "error" in res.get_json()


def test_valid_image_mocked_json(client, monkeypatch):
    payload = {"instrument": "gold", "direction": "buy", "entry": 2350.5, "sl": 2340.0, "tp": 2370.0}
    _mock_client(monkeypatch, json.dumps(payload))
    data = {"image": (io.BytesIO(_png_bytes()), "chart.png", "image/png")}
    res = client.post("/api/read-chart", data=data, content_type="multipart/form-data")
    assert res.status_code == 200
    body = res.get_json()
    assert body["instrument"] == "gold"
    assert body["direction"] == "buy"
    assert body["entry"] == 2350.5
    assert body["sl"] == 2340.0
    assert body["tp"] == 2370.0


def test_reply_wrapped_in_json_fences(client, monkeypatch):
    payload = {"instrument": "forex", "direction": "sell", "entry": 1.085, "sl": 1.088, "tp": 1.08}
    _mock_client(monkeypatch, "```json\n" + json.dumps(payload) + "\n```")
    data = {"image": (io.BytesIO(_png_bytes()), "chart.png", "image/png")}
    res = client.post("/api/read-chart", data=data, content_type="multipart/form-data")
    assert res.status_code == 200
    body = res.get_json()
    assert body["entry"] == 1.085
    assert body["sl"] == 1.088
    assert body["tp"] == 1.08


def test_reply_with_null_values(client, monkeypatch):
    payload = {"instrument": "jpy", "direction": "buy", "entry": 150.25, "sl": None, "tp": None}
    _mock_client(monkeypatch, json.dumps(payload))
    data = {"image": (io.BytesIO(_png_bytes()), "chart.png", "image/png")}
    res = client.post("/api/read-chart", data=data, content_type="multipart/form-data")
    assert res.status_code == 200
    body = res.get_json()
    assert body["entry"] == 150.25
    assert body["sl"] is None
    assert body["tp"] is None


def test_garbage_reply(client, monkeypatch):
    _mock_client(monkeypatch, "I cannot read this at all, sorry!")
    data = {"image": (io.BytesIO(_png_bytes()), "chart.png", "image/png")}
    res = client.post("/api/read-chart", data=data, content_type="multipart/form-data")
    assert res.status_code == 502
    assert "error" in res.get_json()


def test_wrong_password(client, monkeypatch):
    os.environ["APP_PASSWORD"] = "correct-password"
    _mock_client(monkeypatch, json.dumps(
        {"instrument": "forex", "direction": "buy", "entry": 1.08, "sl": 1.07, "tp": 1.09}
    ))
    data = {"image": (io.BytesIO(_png_bytes()), "chart.png", "image/png")}
    res = client.post(
        "/api/read-chart",
        data=data,
        content_type="multipart/form-data",
        headers={"X-App-Password": "wrong-password"},
    )
    assert res.status_code == 401
    assert "error" in res.get_json()
    os.environ.pop("APP_PASSWORD", None)


def test_correct_password(client, monkeypatch):
    os.environ["APP_PASSWORD"] = "secret123"
    payload = {"instrument": "forex", "direction": "buy", "entry": 1.08, "sl": 1.07, "tp": 1.09}
    _mock_client(monkeypatch, json.dumps(payload))
    data = {"image": (io.BytesIO(_png_bytes()), "chart.png", "image/png")}
    res = client.post(
        "/api/read-chart",
        data=data,
        content_type="multipart/form-data",
        headers={"X-App-Password": "secret123"},
    )
    assert res.status_code == 200
    assert res.get_json()["entry"] == 1.08
    os.environ.pop("APP_PASSWORD", None)


def test_price_with_commas_and_currency(client, monkeypatch):
    # Tests that numbers with commas like 2,350.50 and currency signs are parsed correctly
    raw_reply = '{"instrument": "gold", "direction": "buy", "entry": "2,350.50", "sl": "$2,340.00", "tp": "2,370.5"}'
    _mock_client(monkeypatch, raw_reply)
    data = {"image": (io.BytesIO(_png_bytes()), "chart.png", "image/png")}
    res = client.post("/api/read-chart", data=data, content_type="multipart/form-data")
    assert res.status_code == 200
    body = res.get_json()
    assert body["entry"] == 2350.50
    assert body["sl"] == 2340.00
    assert body["tp"] == 2370.5


def test_trailing_commas_and_surrounding_text(client, monkeypatch):
    # LLMs frequently add trailing commas and conversational prefix/suffix text
    raw_reply = (
        "Here are the levels from the chart:\n"
        "```json\n"
        "{\n"
        '  "instrument": "crypto",\n'
        '  "direction": "buy",\n'
        '  "entry": 65200.5,\n'
        '  "sl": 64000.0,\n'
        '  "tp": 68000.0,\n'
        "}\n"
        "```\n"
        "Please double check before placing."
    )
    _mock_client(monkeypatch, raw_reply)
    data = {"image": (io.BytesIO(_png_bytes()), "chart.png", "image/png")}
    res = client.post("/api/read-chart", data=data, content_type="multipart/form-data")
    assert res.status_code == 200
    body = res.get_json()
    assert body["instrument"] == "crypto"
    assert body["entry"] == 65200.5
    assert body["sl"] == 64000.0
    assert body["tp"] == 68000.0


def test_index_route(client):
    res = client.get("/")
    assert res.status_code == 200
    assert b"Chart to Lot Size" in res.data


def test_jpeg_mime_alias(client, monkeypatch):
    payload = {"instrument": "forex", "direction": "sell", "entry": 1.085, "sl": 1.088, "tp": 1.08}
    _mock_client(monkeypatch, json.dumps(payload))
    # Test uploading with image/jpg mimetype
    data = {"image": (io.BytesIO(_png_bytes()), "chart.jpg", "image/jpg")}
    res = client.post("/api/read-chart", data=data, content_type="multipart/form-data")
    assert res.status_code == 200
    assert res.get_json()["direction"] == "sell"


def test_missing_api_key_returns_503(client, monkeypatch):
    monkeypatch.setattr(app_module, "client", None)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    # Prevent load_dotenv from re-reading the .env file on disk
    try:
        import dotenv
        monkeypatch.setattr(dotenv, "load_dotenv", lambda **kw: None)
    except ImportError:
        pass
    data = {"image": (io.BytesIO(_png_bytes()), "chart.png", "image/png")}
    res = client.post("/api/read-chart", data=data, content_type="multipart/form-data")
    assert res.status_code == 503
    assert "ANTHROPIC_API_KEY" in res.get_json()["error"]


def test_rate_limiting_with_forwarded_ip(client, monkeypatch):
    payload = {"instrument": "gold", "direction": "buy", "entry": 2350.0, "sl": 2340.0, "tp": 2370.0}
    _mock_client(monkeypatch, json.dumps(payload))
    monkeypatch.setattr(app_module, "MAX_READS_PER_HOUR", 2)

    headers = {"X-Forwarded-For": "203.0.113.195, 10.0.0.1"}
    data = lambda: {"image": (io.BytesIO(_png_bytes()), "chart.png", "image/png")}

    # First 2 requests should succeed
    res1 = client.post("/api/read-chart", data=data(), content_type="multipart/form-data", headers=headers)
    assert res1.status_code == 200
    res2 = client.post("/api/read-chart", data=data(), content_type="multipart/form-data", headers=headers)
    assert res2.status_code == 200

    # 3rd request from same client IP exceeds limit
    res3 = client.post("/api/read-chart", data=data(), content_type="multipart/form-data", headers=headers)
    assert res3.status_code == 429
    assert "Too many chart reads" in res3.get_json()["error"]

    # Different IP should still succeed
    diff_headers = {"X-Forwarded-For": "198.51.100.42"}
    res4 = client.post("/api/read-chart", data=data(), content_type="multipart/form-data", headers=diff_headers)
    assert res4.status_code == 200

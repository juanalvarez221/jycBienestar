"""Fixtures para pruebas de API JyC Bienestar."""

from __future__ import annotations

import os
import time
import uuid

import httpx
import pytest
from dotenv import load_dotenv

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(ROOT, "apps", "api", ".env"))
load_dotenv(os.path.join(ROOT, ".env"))

API_BASE = os.getenv("JYC_API_URL", "http://localhost:3000/api")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@jycbienestar.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "CambiaEsto123!")


@pytest.fixture(scope="session")
def api_base() -> str:
    return API_BASE.rstrip("/")


@pytest.fixture(scope="session")
def client(api_base: str) -> httpx.Client:
    last_err: Exception | None = None
    for _ in range(30):
        try:
            with httpx.Client(base_url=api_base, timeout=20.0) as probe:
                r = probe.get("/products")
                if r.status_code < 500:
                    break
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            time.sleep(1)
    else:
        raise RuntimeError(
            f"API no disponible en {api_base}. Arranca `npm run dev:api`. "
            f"Último error: {last_err}"
        )

    with httpx.Client(base_url=api_base, timeout=30.0) as session:
        yield session


@pytest.fixture(scope="session")
def admin_token(client: httpx.Client) -> str:
    res = client.post(
        "/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert res.status_code == 201 or res.status_code == 200, res.text
    token = res.json().get("accessToken")
    assert token
    return token


@pytest.fixture
def auth_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def visitor_id() -> str:
    return f"test_{uuid.uuid4().hex}"

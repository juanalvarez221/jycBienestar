"""Pruebas de seguridad del login admin."""

from __future__ import annotations

import uuid

import httpx
import pytest


def _ip() -> dict[str, str]:
    """IP distinta por prueba para no mezclar throttling global."""
    return {"X-Forwarded-For": f"198.51.100.{uuid.uuid4().int % 200 + 1}"}


@pytest.mark.security
def test_login_rejects_invalid_email_format(client: httpx.Client):
    res = client.post(
        "/auth/login",
        headers=_ip(),
        json={"email": "no-es-email", "password": "Password123!"},
    )
    assert res.status_code in (400, 422)


@pytest.mark.security
def test_login_rejects_short_password(client: httpx.Client):
    res = client.post(
        "/auth/login",
        headers=_ip(),
        json={"email": "juancito@jyc.com", "password": "corta"},
    )
    assert res.status_code in (400, 422)


@pytest.mark.security
def test_login_rejects_oversized_password(client: httpx.Client):
    res = client.post(
        "/auth/login",
        headers=_ip(),
        json={"email": "juancito@jyc.com", "password": "A1!" + ("x" * 200)},
    )
    assert res.status_code in (400, 401, 422)


@pytest.mark.security
def test_login_unknown_user_same_message(client: httpx.Client):
    res = client.post(
        "/auth/login",
        headers=_ip(),
        json={
            "email": f"nobody.{uuid.uuid4().hex[:8]}@jyc.com",
            "password": "WrongPass123!",
        },
    )
    assert res.status_code == 401
    body = res.json()
    message = body.get("message", "")
    assert "inválid" in str(message).lower() or "invalid" in str(message).lower()


@pytest.mark.security
def test_login_wrong_password_juancito(client: httpx.Client):
    res = client.post(
        "/auth/login",
        headers=_ip(),
        json={"email": "juancito@jyc.com", "password": "WrongPass999!"},
    )
    assert res.status_code == 401


@pytest.mark.security
def test_login_ok_juancito(client: httpx.Client):
    res = client.post(
        "/auth/login",
        headers=_ip(),
        json={"email": "juancito@jyc.com", "password": "jfac2124A#"},
    )
    assert res.status_code in (200, 201), res.text
    body = res.json()
    assert body["accessToken"]
    assert body["user"]["email"] == "juancito@jyc.com"
    assert "password" not in body
    assert "passwordHash" not in body.get("user", {})


@pytest.mark.security
def test_login_ok_camilita(client: httpx.Client):
    res = client.post(
        "/auth/login",
        headers=_ip(),
        json={"email": "camilita@jyc.com", "password": "mcvl1002A#"},
    )
    assert res.status_code in (200, 201), res.text
    body = res.json()
    assert body["accessToken"]
    assert body["user"]["email"] == "camilita@jyc.com"


@pytest.mark.security
def test_login_email_normalized_case(client: httpx.Client):
    res = client.post(
        "/auth/login",
        headers=_ip(),
        json={"email": "  JuAnCiTo@JyC.CoM ", "password": "jfac2124A#"},
    )
    assert res.status_code in (200, 201), res.text
    assert res.json()["user"]["email"] == "juancito@jyc.com"


@pytest.mark.security
def test_admin_token_required_for_orders(client: httpx.Client):
    assert client.get("/admin/orders").status_code == 401
    assert (
        client.get(
            "/admin/orders",
            headers={"Authorization": "Bearer fake.token.value"},
        ).status_code
        == 401
    )


@pytest.mark.security
def test_juancito_can_access_admin(client: httpx.Client):
    login = client.post(
        "/auth/login",
        headers=_ip(),
        json={"email": "juancito@jyc.com", "password": "jfac2124A#"},
    )
    assert login.status_code in (200, 201)
    token = login.json()["accessToken"]
    orders = client.get(
        "/admin/orders",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert orders.status_code == 200
    assert isinstance(orders.json(), list)


@pytest.mark.security
def test_bruteforce_lockout_by_email(client: httpx.Client):
    """Tras varios fallos sobre el mismo email, el login queda bloqueado (429)."""
    email = f"attacker.{uuid.uuid4().hex[:10]}@jyc.com"
    headers = _ip()

    last = None
    for _ in range(6):
        last = client.post(
            "/auth/login",
            headers=headers,
            json={"email": email, "password": "WrongPass123!"},
        )
        assert last.status_code in (401, 429), last.text

    assert last is not None
    assert last.status_code == 429, last.text
    message = str(last.json().get("message", "")).lower()
    assert (
        "retryAfterSec" in last.json()
        or "demasiados" in message
        or "too many" in message
        or "throttler" in message
    )


@pytest.mark.security
def test_login_does_not_leak_stack(client: httpx.Client):
    res = client.post(
        "/auth/login",
        headers=_ip(),
        json={
            "email": f"leak.{uuid.uuid4().hex[:8]}@jyc.com",
            "password": "bad-password-xx",
        },
    )
    assert res.status_code == 401
    text = res.text.lower()
    assert "stack" not in text
    assert "passwordhash" not in text
    assert "bcrypt" not in text

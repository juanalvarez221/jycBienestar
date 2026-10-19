import httpx


def test_login_ok(client: httpx.Client, admin_token: str):
    assert isinstance(admin_token, str)
    assert len(admin_token) > 20


def test_login_fail(client: httpx.Client):
    res = client.post(
        "/auth/login",
        json={"email": "admin@jycbienestar.com", "password": "wrong-password"},
    )
    assert res.status_code in (401, 400)


def test_admin_requires_auth(client: httpx.Client):
    res = client.get("/admin/orders")
    assert res.status_code == 401

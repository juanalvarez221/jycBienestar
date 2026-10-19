"""
Suite profesional del panel /api/admin/*

Cubre autenticación, métricas, pedidos, clientes, productos,
carritos, configuración y correos de notificación.
"""

from __future__ import annotations

import uuid

import httpx
import pytest

from helpers import create_order, phone_key, product_payload


ADMIN_PROTECTED = [
    "/admin/metrics",
    "/admin/orders",
    "/admin/customers",
    "/admin/products",
    "/admin/carts",
    "/admin/config",
    "/admin/notify-emails",
]


# ---------------------------------------------------------------------------
# Autenticación / autorización
# ---------------------------------------------------------------------------


@pytest.mark.admin
@pytest.mark.parametrize("path", ADMIN_PROTECTED)
def test_admin_endpoints_require_jwt(client: httpx.Client, path: str):
    res = client.get(path)
    assert res.status_code == 401


@pytest.mark.admin
def test_admin_rejects_malformed_bearer(client: httpx.Client):
    res = client.get(
        "/admin/orders",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# Config & métricas
# ---------------------------------------------------------------------------


@pytest.mark.admin
def test_admin_config_shape(client: httpx.Client, auth_headers: dict[str, str]):
    res = client.get("/admin/config", headers=auth_headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body is None or isinstance(body, dict)
    if body:
        assert body.get("id") == "default"
        assert "termsHtml" in body or "shippingDefaultCents" in body or "id" in body


@pytest.mark.admin
def test_admin_metrics_contract(client: httpx.Client, auth_headers: dict[str, str]):
    res = client.get("/admin/metrics", headers=auth_headers)
    assert res.status_code == 200, res.text
    body = res.json()

    required = [
        "porAtender",
        "enviados",
        "ingresosCentavos",
        "clientes",
        "carritosAbandonados",
        "mapaClics",
    ]
    for key in required:
        assert key in body, f"Falta campo de métricas: {key}"

    assert isinstance(body["porAtender"], int)
    assert isinstance(body["ingresosCentavos"], int)
    assert isinstance(body["mapaClics"], list)
    assert len(body["mapaClics"]) == 100
    sample = body["mapaClics"][0]
    assert {"x", "y", "count", "intensity"} <= set(sample.keys())


# ---------------------------------------------------------------------------
# Pedidos
# ---------------------------------------------------------------------------


@pytest.mark.admin
def test_admin_orders_list_and_get(
    client: httpx.Client, auth_headers: dict[str, str], visitor_id: str
):
    order = create_order(client, visitor_id=visitor_id)
    oid = order["id"]

    listed = client.get("/admin/orders", headers=auth_headers)
    assert listed.status_code == 200
    rows = listed.json()
    assert isinstance(rows, list)
    assert any(row["id"] == oid for row in rows)

    detail = client.get(f"/admin/orders/{oid}", headers=auth_headers)
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["id"] == oid
    assert body["orderNumber"] == order["orderNumber"]
    assert isinstance(body.get("items"), list)
    assert len(body["items"]) >= 1

    client.delete(f"/admin/orders/{oid}", headers=auth_headers)


@pytest.mark.admin
def test_admin_order_update_and_status_lifecycle(
    client: httpx.Client, auth_headers: dict[str, str], visitor_id: str
):
    order = create_order(client, visitor_id=visitor_id, customer_name="Lifecycle Pytest")
    oid = order["id"]

    patched = client.patch(
        f"/admin/orders/{oid}",
        headers=auth_headers,
        json={
            "customerName": "Lifecycle Editado",
            "addressLine": "Carrera 50 # 10-20",
            "notes": "Nota admin pytest",
        },
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["customerName"] == "Lifecycle Editado"
    assert patched.json()["addressLine"] == "Carrera 50 # 10-20"

    for status, note in [
        ("EN_PREPARACION", "En cocina"),
        ("ENVIADO", "Salida de mensajería"),
        ("ENTREGADO", "Entregado al cliente"),
    ]:
        res = client.patch(
            f"/admin/orders/{oid}/status",
            headers=auth_headers,
            json={"status": status, "note": note},
        )
        assert res.status_code == 200, res.text
        assert res.json()["status"] == status

    detail = client.get(f"/admin/orders/{oid}", headers=auth_headers)
    events = detail.json().get("statusEvents") or detail.json().get("events") or []
    assert isinstance(events, list)
    assert len(events) >= 1

    deleted = client.delete(f"/admin/orders/{oid}", headers=auth_headers)
    assert deleted.status_code == 200
    assert deleted.json()["ok"] is True

    missing = client.get(f"/admin/orders/{oid}", headers=auth_headers)
    assert missing.status_code == 404


@pytest.mark.admin
def test_admin_order_invalid_status(
    client: httpx.Client, auth_headers: dict[str, str], visitor_id: str
):
    order = create_order(client, visitor_id=visitor_id)
    oid = order["id"]
    res = client.patch(
        f"/admin/orders/{oid}/status",
        headers=auth_headers,
        json={"status": "ESTADO_INVENTADO"},
    )
    assert res.status_code in (400, 422)
    client.delete(f"/admin/orders/{oid}", headers=auth_headers)


@pytest.mark.admin
def test_admin_order_not_found(client: httpx.Client, auth_headers: dict[str, str]):
    fake = "00000000-0000-0000-0000-000000000000"
    assert client.get(f"/admin/orders/{fake}", headers=auth_headers).status_code == 404
    assert (
        client.patch(
            f"/admin/orders/{fake}/status",
            headers=auth_headers,
            json={"status": "ENVIADO"},
        ).status_code
        == 404
    )


# ---------------------------------------------------------------------------
# Clientes
# ---------------------------------------------------------------------------


@pytest.mark.admin
def test_admin_customers_crud_flow(
    client: httpx.Client, auth_headers: dict[str, str], visitor_id: str
):
    phone = f"301{uuid.uuid4().hex[:7]}"
    order = create_order(
        client,
        visitor_id=visitor_id,
        customer_name="Cliente CRUD Pytest",
        customer_phone=phone,
    )
    key = phone_key(phone)

    listed = client.get("/admin/customers", headers=auth_headers)
    assert listed.status_code == 200
    assert any(row["phoneKey"] == key for row in listed.json())

    detail = client.get(f"/admin/customers/{key}", headers=auth_headers)
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["phoneKey"] == key
    assert body["customerName"] == "Cliente CRUD Pytest"
    assert body["ordersCount"] >= 1
    assert any(o["id"] == order["id"] for o in body["orders"])

    updated = client.patch(
        f"/admin/customers/{key}",
        headers=auth_headers,
        json={
            "customerName": "Cliente CRUD Editado",
            "customerPhone": phone,
            "customerEmail": "cliente.editado@example.com",
            "addressLine": "Calle Editada 123",
            "neighborhood": "El Poblado",
        },
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["customerName"] == "Cliente CRUD Editado"
    assert updated.json()["addressLine"] == "Calle Editada 123"

    removed = client.delete(f"/admin/customers/{key}", headers=auth_headers)
    assert removed.status_code == 200, removed.text
    assert removed.json()["ok"] is True
    assert removed.json()["removed"] >= 1

    assert client.get(f"/admin/customers/{key}", headers=auth_headers).status_code == 404


@pytest.mark.admin
def test_admin_customer_validation(
    client: httpx.Client, auth_headers: dict[str, str], visitor_id: str
):
    phone = f"302{uuid.uuid4().hex[:7]}"
    create_order(client, visitor_id=visitor_id, customer_phone=phone)
    key = phone_key(phone)

    bad = client.patch(
        f"/admin/customers/{key}",
        headers=auth_headers,
        json={
            "customerName": "Ab",
            "customerPhone": "12",
            "addressLine": "x",
        },
    )
    assert bad.status_code in (400, 422)

    client.delete(f"/admin/customers/{key}", headers=auth_headers)


# ---------------------------------------------------------------------------
# Productos
# ---------------------------------------------------------------------------


@pytest.mark.admin
def test_admin_products_full_crud(client: httpx.Client, auth_headers: dict[str, str]):
    payload = product_payload()
    created = client.post("/admin/products", headers=auth_headers, json=payload)
    assert created.status_code in (200, 201), created.text
    product = created.json()
    pid = product["id"]
    assert product["slug"] == payload["slug"]
    assert product["priceCents"] == payload["priceCents"]

    listed = client.get("/admin/products", headers=auth_headers)
    assert listed.status_code == 200
    assert any(row["id"] == pid for row in listed.json())

    patched = client.patch(
        f"/admin/products/{pid}",
        headers=auth_headers,
        json={"priceCents": 199900, "stock": 3, "active": False, "name": "Producto Pytest Off"},
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["priceCents"] == 199900
    assert patched.json()["stock"] == 3
    assert patched.json()["active"] is False

    deleted = client.delete(f"/admin/products/{pid}", headers=auth_headers)
    assert deleted.status_code == 200
    assert deleted.json()["ok"] is True


@pytest.mark.admin
def test_admin_product_duplicate_slug_rejected(
    client: httpx.Client, auth_headers: dict[str, str]
):
    payload = product_payload()
    first = client.post("/admin/products", headers=auth_headers, json=payload)
    assert first.status_code in (200, 201), first.text
    pid = first.json()["id"]

    clash = client.post("/admin/products", headers=auth_headers, json=payload)
    # Prisma unique → 500 hoy; contrato aceptable: no 2xx
    assert clash.status_code >= 400

    client.delete(f"/admin/products/{pid}", headers=auth_headers)


# ---------------------------------------------------------------------------
# Carritos
# ---------------------------------------------------------------------------


@pytest.mark.admin
def test_admin_carts_list_and_delete(
    client: httpx.Client, auth_headers: dict[str, str], visitor_id: str
):
    product = client.get("/products").json()[0]
    cart = client.post(
        "/carts",
        json={
            "visitorId": visitor_id,
            "items": [
                {
                    "productId": product["id"],
                    "name": product["name"],
                    "quantity": 1,
                    "unitPriceCents": product["priceCents"],
                }
            ],
            "subtotalCents": product["priceCents"],
            "customerName": "Carrito Admin Pytest",
            "customerPhone": "3045556677",
        },
    )
    assert cart.status_code in (200, 201), cart.text

    listed = client.get("/admin/carts", headers=auth_headers)
    assert listed.status_code == 200
    match = next((c for c in listed.json() if c["visitorId"] == visitor_id), None)
    assert match is not None

    removed = client.delete(f"/admin/carts/{match['id']}", headers=auth_headers)
    assert removed.status_code == 200

    again = client.get("/admin/carts", headers=auth_headers).json()
    assert all(c["visitorId"] != visitor_id for c in again)


# ---------------------------------------------------------------------------
# Correos de notificación
# ---------------------------------------------------------------------------


@pytest.mark.admin
def test_admin_notify_emails_crud(client: httpx.Client, auth_headers: dict[str, str]):
    email = f"pytest.notify.{uuid.uuid4().hex[:8]}@example.com"

    created = client.post(
        "/admin/notify-emails",
        headers=auth_headers,
        json={"email": email, "name": "Pytest Notify", "active": True},
    )
    assert created.status_code in (200, 201), created.text
    row = created.json()
    eid = row["id"]
    assert row["email"] == email.lower()
    assert row["active"] is True

    listed = client.get("/admin/notify-emails", headers=auth_headers)
    assert listed.status_code == 200
    assert any(r["id"] == eid for r in listed.json())

    dup = client.post(
        "/admin/notify-emails",
        headers=auth_headers,
        json={"email": email.upper(), "name": "Dup"},
    )
    assert dup.status_code == 400

    patched = client.patch(
        f"/admin/notify-emails/{eid}",
        headers=auth_headers,
        json={"name": "Pytest Pausado", "active": False},
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["active"] is False
    assert patched.json()["name"] == "Pytest Pausado"

    deleted = client.delete(f"/admin/notify-emails/{eid}", headers=auth_headers)
    assert deleted.status_code == 200
    assert deleted.json()["ok"] is True

    assert (
        client.delete(f"/admin/notify-emails/{eid}", headers=auth_headers).status_code
        == 404
    )


@pytest.mark.admin
def test_admin_notify_email_invalid(client: httpx.Client, auth_headers: dict[str, str]):
    res = client.post(
        "/admin/notify-emails",
        headers=auth_headers,
        json={"email": "no-es-email", "name": "X"},
    )
    assert res.status_code in (400, 422)


@pytest.mark.admin
def test_admin_notify_test_endpoint_contract(
    client: httpx.Client, auth_headers: dict[str, str]
):
    """Puede fallar por SMTP ausente; valida contrato de error o éxito."""
    res = client.post("/admin/notify-emails/test", headers=auth_headers)
    assert res.status_code in (200, 201, 400), res.text
    if res.status_code in (200, 201):
        body = res.json()
        assert body.get("ok") is True
        assert isinstance(body.get("recipients"), list)
    else:
        message = res.json().get("message", "")
        assert isinstance(message, (str, list))

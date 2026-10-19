"""Helpers compartidos para la suite de API."""

from __future__ import annotations

import uuid

import httpx


def phone_key(phone: str) -> str:
    return "".join(ch for ch in phone if ch.isdigit())


def first_product(client: httpx.Client) -> dict:
    products = client.get("/products").json()
    assert isinstance(products, list) and products, "Se espera al menos un producto público"
    return products[0]


def municipality(client: httpx.Client) -> tuple[str, str]:
    deps = client.get("/geo/departments").json()
    assert deps, "Se espera al menos un departamento"
    code = deps[0]["code"]
    munis = client.get(f"/geo/municipalities/{code}").json()
    assert munis, "Se espera al menos un municipio"
    return code, munis[0]["code"]


def create_order(
    client: httpx.Client,
    *,
    visitor_id: str | None = None,
    customer_name: str = "Cliente Pytest Admin",
    customer_phone: str | None = None,
    quantity: int = 1,
) -> dict:
    product = first_product(client)
    dep, muni = municipality(client)
    phone = customer_phone or f"300{uuid.uuid4().hex[:7]}"
    payload = {
        "customerName": customer_name,
        "customerPhone": phone,
        "customerEmail": f"pytest.{uuid.uuid4().hex[:8]}@example.com",
        "addressLine": "Calle 10 # 20-30",
        "neighborhood": "Laureles",
        "departmentCode": dep,
        "municipalityCode": muni,
        "notes": "Pedido de prueba automatizada admin",
        "acceptedTerms": True,
        "visitorId": visitor_id or f"test_{uuid.uuid4().hex}",
        "items": [{"productId": product["id"], "quantity": quantity}],
    }
    res = client.post("/orders", json=payload)
    assert res.status_code in (200, 201), res.text
    body = res.json()
    assert body["id"]
    assert body["orderNumber"].startswith("JYC-")
    return body


def product_payload(suffix: str | None = None) -> dict:
    tag = suffix or uuid.uuid4().hex[:8]
    return {
        "sku": f"PY-{tag}",
        "name": f"Producto Pytest {tag}",
        "slug": f"pytest-{tag}",
        "description": "Descripción de prueba suficientemente larga para validación.",
        "netContent": "100 ml",
        "ingredients": "Agua",
        "usageText": "Uso de prueba",
        "priceCents": 150000,
        "stock": 10,
        "active": True,
        "tagline": "Pytest",
    }

import httpx


def test_track_events(client: httpx.Client, visitor_id: str):
    view = client.post(
        "/analytics/events",
        json={
            "visitorId": visitor_id,
            "sessionId": f"s_{visitor_id}",
            "type": "page_view",
            "path": "/",
            "label": "Inicio",
            "city": "Medellín",
            "region": "Antioquia",
            "country": "CO",
        },
    )
    assert view.status_code in (200, 201), view.text

    click = client.post(
        "/analytics/events",
        json={
            "visitorId": visitor_id,
            "sessionId": f"s_{visitor_id}",
            "type": "click",
            "path": "/",
            "label": "Pedir ahora",
            "element": "button",
            "xPercent": 42.5,
            "yPercent": 61.0,
            "viewportW": 1280,
            "viewportH": 720,
        },
    )
    assert click.status_code in (200, 201), click.text


def test_cart_upsert_and_metrics(
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
                    "quantity": 2,
                    "unitPriceCents": product["priceCents"],
                }
            ],
            "subtotalCents": product["priceCents"] * 2,
            "customerName": "Carrito Pytest",
            "customerPhone": "3014445566",
        },
    )
    assert cart.status_code in (200, 201), cart.text

    metrics = client.get("/admin/metrics", headers=auth_headers)
    assert metrics.status_code == 200
    body = metrics.json()
    assert "porAtender" in body
    assert "carritosAbandonados" in body
    assert "mapaClics" in body
    assert len(body["mapaClics"]) == 100
    assert body["carritosAbandonados"] >= 1

    carts = client.get("/admin/carts", headers=auth_headers)
    assert carts.status_code == 200
    rows = carts.json()
    match = next((c for c in rows if c["visitorId"] == visitor_id), None)
    assert match is not None

    removed = client.delete(f"/admin/carts/{match['id']}", headers=auth_headers)
    assert removed.status_code == 200


def test_geo_and_site(client: httpx.Client):
    deps = client.get("/geo/departments")
    assert deps.status_code == 200
    assert len(deps.json()) >= 1

    cfg = client.get("/site/config")
    assert cfg.status_code == 200
    assert "termsHtml" in cfg.json()

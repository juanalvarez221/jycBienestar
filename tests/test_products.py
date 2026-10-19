import httpx
import uuid


def test_list_public_products(client: httpx.Client):
    res = client.get("/products")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "priceCents" in data[0]


def test_admin_product_crud(client: httpx.Client, auth_headers: dict[str, str]):
    slug = f"pytest-{uuid.uuid4().hex[:8]}"
    create = client.post(
        "/admin/products",
        headers=auth_headers,
        json={
            "sku": f"PY-{slug}",
            "name": "Producto Pytest",
            "slug": slug,
            "description": "Descripción de prueba suficientemente larga.",
            "netContent": "100 ml",
            "ingredients": "Agua",
            "usageText": "Uso de prueba",
            "priceCents": 150000,
            "stock": 10,
            "active": True,
        },
    )
    assert create.status_code in (200, 201), create.text
    product = create.json()
    pid = product["id"]

    patch = client.patch(
        f"/admin/products/{pid}",
        headers=auth_headers,
        json={"priceCents": 200000, "stock": 7, "name": "Producto Pytest Editado"},
    )
    assert patch.status_code == 200
    assert patch.json()["priceCents"] == 200000
    assert patch.json()["stock"] == 7

    delete = client.delete(f"/admin/products/{pid}", headers=auth_headers)
    assert delete.status_code == 200
    assert delete.json()["ok"] is True

import httpx
import pytest

from helpers import create_order


@pytest.mark.admin
def test_create_order_and_admin_flow(
    client: httpx.Client, auth_headers: dict[str, str], visitor_id: str
):
    order = create_order(
        client,
        visitor_id=visitor_id,
        customer_name="Cliente Pytest",
        customer_phone="3001112233",
    )
    oid = order["id"]

    listed = client.get("/admin/orders", headers=auth_headers)
    assert listed.status_code == 200
    assert any(row["id"] == oid for row in listed.json())

    patched = client.patch(
        f"/admin/orders/{oid}",
        headers=auth_headers,
        json={"customerName": "Cliente Pytest Editado", "status": "EN_PREPARACION"},
    )
    assert patched.status_code == 200
    assert patched.json()["customerName"] == "Cliente Pytest Editado"
    assert patched.json()["status"] == "EN_PREPARACION"

    status = client.patch(
        f"/admin/orders/{oid}/status",
        headers=auth_headers,
        json={"status": "ENVIADO", "note": "Salida de mensajería"},
    )
    assert status.status_code == 200
    assert status.json()["status"] == "ENVIADO"

    deleted = client.delete(f"/admin/orders/{oid}", headers=auth_headers)
    assert deleted.status_code == 200
    assert deleted.json()["ok"] is True


@pytest.mark.admin
def test_customers_list(client: httpx.Client, auth_headers: dict[str, str]):
    res = client.get("/admin/customers", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

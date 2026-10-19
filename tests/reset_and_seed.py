"""Vacía tablas transaccionales y vuelve a sembrar catálogo/geo/admin."""

from __future__ import annotations

import os
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
API = os.path.join(ROOT, "apps", "api")


def main() -> int:
    env = os.environ.copy()
    # Usa el .env de la API
    db_url = env.get("DATABASE_URL", "file:./dev.db")
    print(f"Reset DB → {db_url}")

    # Empuja schema (incluye AnalyticsEvent) y limpia con SQL vía prisma
    push = subprocess.run(
        ["npx", "prisma", "db", "push", "--accept-data-loss", "--skip-generate"],
        cwd=API,
        shell=True,
        check=False,
    )
    if push.returncode != 0:
        print("prisma db push falló", file=sys.stderr)
        return push.returncode

    # Script inline para vaciar datos de negocio sin borrar geo/admin/productos base
    clear = r"""
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  await p.orderStatusEvent.deleteMany();
  await p.orderItem.deleteMany();
  await p.order.deleteMany();
  await p.abandonedCart.deleteMany();
  await p.analyticsEvent.deleteMany();
  console.log('Tablas de pedidos/carritos/analytics vacías');
  await p.$disconnect();
})().catch(async (e) => { console.error(e); await p.$disconnect(); process.exit(1); });
"""
    wipe = subprocess.run(
        ["node", "-e", clear],
        cwd=API,
        shell=True,
        check=False,
    )
    if wipe.returncode != 0:
        return wipe.returncode

    seed = subprocess.run(
        ["npm", "run", "prisma:seed"],
        cwd=API,
        shell=True,
        check=False,
    )
    return seed.returncode


if __name__ == "__main__":
    raise SystemExit(main())

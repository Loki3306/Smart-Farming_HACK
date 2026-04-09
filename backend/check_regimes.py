"""
Utility script: check regimes in Neon DB.
Replaced Supabase SDK calls with direct psycopg2 queries.
"""
from app.db.regime_db import RegimeDatabase
from app.services.neon_client import get_connection

db = RegimeDatabase()  # Uses Neon internally

with get_connection() as conn:
    with conn.cursor() as cur:
        # All regimes
        cur.execute("SELECT regime_id, name, farmer_id, status FROM regimes LIMIT 10")
        desc = [d[0] for d in cur.description]
        rows = [dict(zip(desc, r)) for r in cur.fetchall()]

        cur.execute("SELECT COUNT(*) FROM regimes")
        total = cur.fetchone()[0]

print(f"Total regimes in database: {total}")
print("-" * 80)
for r in rows:
    print(f"ID:     {r['regime_id']}")
    print(f"Name:   {r['name']}")
    print(f"Farmer: {r['farmer_id']}")
    print(f"Status: {r['status']}")
    print("-" * 80)

# Check for a specific regime
target_id = "f1dd2754-62e7-4fca-9a7f-7d1c32924e95"
with get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM regimes WHERE regime_id = %s", (target_id,))
        desc = [d[0] for d in cur.description]
        row = cur.fetchone()

if row:
    print(f"\nFound regime {target_id}:")
    print(dict(zip(desc, row)))
else:
    print(f"\nRegime {target_id} NOT FOUND in database")

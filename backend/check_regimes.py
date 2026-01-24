from app.db.regime_db import RegimeDatabase
from app.services.supabase_client import get_supabase_client

db = RegimeDatabase(get_supabase_client())
regimes = db.supabase.table('regimes').select('id, regime_name, farmer_id, status').execute()

print(f'Total regimes in database: {len(regimes.data)}')
print('-' * 80)
for r in regimes.data[:10]:
    print(f'ID: {r["id"]}')
    print(f'Name: {r["regime_name"]}')
    print(f'Farmer: {r["farmer_id"]}')
    print(f'Status: {r["status"]}')
    print('-' * 80)

# Check for the specific regime
target_id = 'f1dd2754-62e7-4fca-9a7f-7d1c32924e95'
specific = db.supabase.table('regimes').select('*').eq('id', target_id).execute()
if specific.data:
    print(f'\nFound regime {target_id}:')
    print(specific.data[0])
else:
    print(f'\nRegime {target_id} NOT FOUND in database')

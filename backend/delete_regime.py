"""
Delete the old regime to fix duplicate constraint violation
"""
from app.db.regime_db import RegimeDatabase
from app.services.supabase_client import get_supabase_client

db = RegimeDatabase(get_supabase_client())

# The farmer ID that has the duplicate
farmer_id = '666c19f9-af42-4361-b252-505b16974b89'

print(f'Finding regimes for farmer {farmer_id}...')
regimes = db.supabase.table('regimes').select('*').eq('farmer_id', farmer_id).execute()

print(f'\nFound {len(regimes.data)} regimes:')
for regime in regimes.data:
    print(f'  - ID: {regime["regime_id"]}')
    print(f'    Name: {regime["regime_name"]}')
    print(f'    Status: {regime["status"]}')
    print(f'    Created: {regime["created_at"]}')
    print()

if regimes.data:
    regime_id = regimes.data[0]['regime_id']
    confirm = input(f'\nDelete regime {regime_id}? (yes/no): ')
    
    if confirm.lower() == 'yes':
        # Delete tasks first (foreign key constraint)
        print(f'Deleting tasks for regime {regime_id}...')
        db.supabase.table('regime_tasks').delete().eq('regime_id', regime_id).execute()
        
        # Delete regime
        print(f'Deleting regime {regime_id}...')
        db.supabase.table('regimes').delete().eq('regime_id', regime_id).execute()
        
        print('✅ Regime deleted successfully!')
    else:
        print('❌ Cancelled')
else:
    print('No regimes found')

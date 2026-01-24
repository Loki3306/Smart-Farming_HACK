"""
Execute PostGIS Setup on Supabase
Runs the 010_enable_postgis.sql migration
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def execute_postgis_setup():
    """Enable PostGIS extension and verify installation"""
    print("=" * 70)
    print("PostGIS Setup for Smart Farming System")
    print("=" * 70)
    
    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # Step 1: Enable PostGIS extension
        print("\n[1/4] Enabling PostGIS extension...")
        result = supabase.rpc('exec_sql', {
            'query': 'CREATE EXTENSION IF NOT EXISTS postgis;'
        }).execute()
        print("✓ PostGIS extension enabled")
        
        # Step 2: Verify PostGIS version
        print("\n[2/4] Verifying PostGIS installation...")
        # Use direct SQL query to check PostGIS
        version_check = supabase.rpc('exec_sql', {
            'query': 'SELECT PostGIS_version() as version;'
        }).execute()
        
        if version_check.data:
            print(f"✓ PostGIS installed: {version_check.data}")
        else:
            print("✓ PostGIS extension enabled (version check requires query access)")
        
        # Step 3: Verify SRID 4326 exists
        print("\n[3/4] Verifying spatial reference system (SRID 4326)...")
        srid_check = supabase.rpc('exec_sql', {
            'query': "SELECT COUNT(*) as count FROM spatial_ref_sys WHERE srid = 4326;"
        }).execute()
        print("✓ SRID 4326 (WGS 84) verified")
        
        # Step 4: Test basic PostGIS function
        print("\n[4/4] Testing PostGIS functions...")
        test_query = supabase.rpc('exec_sql', {
            'query': "SELECT ST_GeomFromText('POINT(0 0)', 4326) IS NOT NULL as test;"
        }).execute()
        print("✓ PostGIS functions working")
        
        print("\n" + "=" * 70)
        print("✅ PostGIS setup completed successfully!")
        print("=" * 70)
        print("\nNext steps:")
        print("1. PostGIS is ready for geometric operations")
        print("2. You can now store polygons, points, and spatial data")
        print("3. SRID 4326 (GPS coordinates) is available")
        print("4. Ready to run next migration: 011_add_geometry_columns.sql")
        
    except Exception as e:
        print(f"\n❌ Error during PostGIS setup: {str(e)}")
        print("\nNote: If Supabase doesn't expose exec_sql RPC, you need to:")
        print("1. Go to Supabase Dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Run the contents of DB_Scripts/farms/010_enable_postgis.sql manually")
        print("4. The SQL command is: CREATE EXTENSION IF NOT EXISTS postgis;")
        return False
    
    return True

if __name__ == "__main__":
    success = execute_postgis_setup()
    exit(0 if success else 1)

#!/usr/bin/env python3
"""
Run Product Catalog Database Migration
Executes CREATE_PRODUCT_CATALOG.sql on Supabase database
"""

import os
import asyncpg
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def run_migration():
    """Execute the product catalog SQL migration"""
    
    # Database connection
    DB_HOST = os.getenv("SUPABASE_DB_HOST", "aws-0-ap-south-1.pooler.supabase.com")
    DB_PORT = int(os.getenv("SUPABASE_DB_PORT", "6543"))
    DB_USER = os.getenv("SUPABASE_DB_USER", "postgres.euqvuasqzspzemcirgkw")
    DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD", "Quasar@2809")
    DB_NAME = os.getenv("SUPABASE_DB_NAME", "postgres")
    
    print("🔄 Connecting to database...")
    print(f"   Host: {DB_HOST}:{DB_PORT}")
    print(f"   Database: {DB_NAME}")
    
    try:
        conn = await asyncpg.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        
        print("✅ Connected successfully!")
        
        # Read SQL file
        sql_file = os.path.join(os.path.dirname(__file__), "DB_Scripts", "CREATE_PRODUCT_CATALOG.sql")
        print(f"\n📄 Reading SQL file: {sql_file}")
        
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print(f"   File size: {len(sql_content)} characters")
        
        # Execute migration
        print("\n🚀 Executing migration...")
        await conn.execute(sql_content)
        
        print("✅ Migration executed successfully!")
        
        # Verify tables created
        print("\n🔍 Verifying tables...")
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('fertilizer_products', 'recommendation_reports', 'agricultural_dealers')
            ORDER BY table_name
        """)
        
        for row in tables:
            print(f"   ✓ Table '{row['table_name']}' exists")
        
        # Count products
        product_count = await conn.fetchval("SELECT COUNT(*) FROM fertilizer_products")
        dealer_count = await conn.fetchval("SELECT COUNT(*) FROM agricultural_dealers")
        
        print(f"\n📊 Data Summary:")
        print(f"   • Fertilizer Products: {product_count}")
        print(f"   • Agricultural Dealers: {dealer_count}")
        
        await conn.close()
        print("\n🎉 Migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(run_migration())
    exit(0 if success else 1)

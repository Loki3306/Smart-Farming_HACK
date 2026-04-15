#!/usr/bin/env python
"""
Test script to verify MQTT data pipeline fixes
Checks database, tables, and error handling
"""
import os
import sys
import asyncio
import psycopg2
from dotenv import load_dotenv

# Load environment
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(project_root, '.env'))

def test_database_connection():
    """Test database connectivity"""
    print("\n[TEST] Database Connection")
    print("=" * 60)
    
    db_url = os.getenv('NEON_DATABASE_URL')
    if not db_url:
        print("[FAIL] NEON_DATABASE_URL not set in .env")
        return False
    
    try:
        conn = psycopg2.connect(db_url)
        conn.close()
        print("[PASS] Database connection successful")
        return True
    except Exception as e:
        print(f"[FAIL] Database connection failed: {e}")
        return False

def test_table_existence():
    """Test if required tables exist"""
    print("\n[TEST] Table Existence")
    print("=" * 60)
    
    db_url = os.getenv('NEON_DATABASE_URL')
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Check sensor_logs
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'sensor_logs'
            )
        """)
        sensor_logs_exists = cursor.fetchone()[0]
        
        # Check commands_history
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'commands_history'
            )
        """)
        commands_history_exists = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        print(f"[{'PASS' if sensor_logs_exists else 'FAIL'}] sensor_logs table: {'exists' if sensor_logs_exists else 'MISSING'}")
        print(f"[{'PASS' if commands_history_exists else 'FAIL'}] commands_history table: {'exists' if commands_history_exists else 'MISSING'}")
        
        return sensor_logs_exists and commands_history_exists
    
    except Exception as e:
        print(f"[FAIL] Error checking tables: {e}")
        return False

def test_table_schema():
    """Test if table schema is correct"""
    print("\n[TEST] Table Schema Validation")
    print("=" * 60)
    
    db_url = os.getenv('NEON_DATABASE_URL')
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Check sensor_logs columns
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'sensor_logs'
            ORDER BY column_name
        """)
        sensor_logs_cols = [row[0] for row in cursor.fetchall()]
        required_cols = ['farm_id', 'humidity', 'moisture', 'temp', 'timestamp']
        
        sensor_logs_ok = all(col in sensor_logs_cols for col in required_cols)
        print(f"[{'PASS' if sensor_logs_ok else 'FAIL'}] sensor_logs schema: {len(sensor_logs_cols)} columns")
        if not sensor_logs_ok:
            print(f"  Missing: {set(required_cols) - set(sensor_logs_cols)}")
        
        # Check commands_history columns
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'commands_history'
            ORDER BY column_name
        """)
        commands_cols = [row[0] for row in cursor.fetchall()]
        required_cmd_cols = ['action', 'farm_id', 'timestamp', 'value']
        
        commands_ok = all(col in commands_cols for col in required_cmd_cols)
        print(f"[{'PASS' if commands_ok else 'FAIL'}] commands_history schema: {len(commands_cols)} columns")
        if not commands_ok:
            print(f"  Missing: {set(required_cmd_cols) - set(commands_cols)}")
        
        cursor.close()
        conn.close()
        
        return sensor_logs_ok and commands_ok
    
    except Exception as e:
        print(f"[FAIL] Error checking schema: {e}")
        return False

def test_router_syntax():
    """Test if router.py has valid Python syntax"""
    print("\n[TEST] Router Syntax Validation")
    print("=" * 60)
    
    router_path = os.path.join(project_root, 'backend', 'iot_irrigation', 'router.py')
    try:
        with open(router_path, 'r', encoding='utf-8', errors='ignore') as f:
            code = f.read()
        compile(code, router_path, 'exec')
        print(f"[PASS] router.py syntax is valid ({len(code)} bytes)")
        return True
    except SyntaxError as e:
        print(f"[FAIL] Syntax error in router.py: {e}")
        return False
    except Exception as e:
        print(f"[FAIL] Error reading router.py: {e}")
        return False

def main():
    print("\n" + "=" * 60)
    print("MQTT Data Pipeline Fix - Test Suite")
    print("=" * 60)
    
    results = {
        "Database Connection": test_database_connection(),
        "Table Existence": test_table_existence(),
        "Table Schema": test_table_schema(),
        "Router Syntax": test_router_syntax(),
    }
    
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_flag in results.items():
        status = "PASS" if passed_flag else "FAIL"
        print(f"  [{status}] {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n[SUCCESS] All tests passed! System is ready for Phase 3 testing.")
        return 0
    else:
        print(f"\n[WARNING] {total - passed} test(s) failed. Check output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

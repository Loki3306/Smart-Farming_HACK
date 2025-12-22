"""
Database initialization without SQLAlchemy
Creates tables and seeds initial data using pure asyncpg
"""

import asyncio
import asyncpg


async def init_database():
    """Initialize database with tables and sample data"""
    print("🗄️  Initializing database...")
    
    # Connect to database
    conn = await asyncpg.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='Deep@2006',
        database='smart_farming'
    )
    
    print("📡 Connected to PostgreSQL!")
    
    try:
        # Create farms table
        print("📋 Creating farms table...")
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS farms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                location VARCHAR(200),
                latitude FLOAT,
                longitude FLOAT,
                size_hectares FLOAT,
                crop_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create sensors table
        print("📋 Creating sensors table...")
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS sensors (
                id SERIAL PRIMARY KEY,
                farm_id INTEGER REFERENCES farms(id),
                sensor_id VARCHAR(100) UNIQUE NOT NULL,
                sensor_type VARCHAR(50),
                location_description VARCHAR(200),
                latitude FLOAT,
                longitude FLOAT,
                is_active BOOLEAN DEFAULT TRUE,
                calibration_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create action_logs table
        print("📋 Creating action_logs table...")
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS action_logs (
                id SERIAL PRIMARY KEY,
                farm_id INTEGER REFERENCES farms(id),
                action_type VARCHAR(50),
                trigger_reason TEXT,
                ai_justification JSONB,
                blockchain_tx_hash VARCHAR(100),
                blockchain_status VARCHAR(20),
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        print("✅ Tables created successfully")
        
        # Check if data already exists
        result = await conn.fetchval('SELECT COUNT(*) FROM farms')
        
        if result > 0:
            print("⚠️  Data already exists, skipping seeding")
        else:
            print("🌱 Seeding sample data...")
            
            # Insert sample farm
            farm_id = await conn.fetchval('''
                INSERT INTO farms (name, location, latitude, longitude, size_hectares, crop_type)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            ''', 'Green Valley Farm', 'Pune, Maharashtra', 18.5204, 73.8567, 5.0, 'Rice')
            
            print(f"✅ Created farm with ID: {farm_id}")
            
            # Insert sample sensors
            sensors = [
                ('SOIL_MOIST_001', 'soil_moisture', 'Field A', 18.5205, 73.8568),
                ('TEMP_001', 'temperature', 'Field A', 18.5205, 73.8568),
                ('HUMID_001', 'humidity', 'Field B', 18.5203, 73.8566),
            ]
            
            for sensor_id, sensor_type, location, lat, lon in sensors:
                await conn.execute('''
                    INSERT INTO sensors (farm_id, sensor_id, sensor_type, location_description, latitude, longitude)
                    VALUES ($1, $2, $3, $4, $5, $6)
                ''', farm_id, sensor_id, sensor_type, location, lat, lon)
            
            print(f"✅ Created {len(sensors)} sensors")
        
        print("🎉 Database initialization complete!")
        
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(init_database())

"""
Configuration Management using Pydantic Settings
Loads all environment variables and API keys from .env file
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable management"""
    
    # FastAPI Configuration
    APP_NAME: str = "Autonomous Smart Farming System"
    DEBUG: bool = True
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:8080", "http://localhost:3000"]
    
    # Standalone Mode (runs without Redis, InfluxDB, PostgreSQL)
    STANDALONE_MODE: bool = False
    DISABLE_REDIS: bool = False
    DISABLE_INFLUXDB: bool = False
    DISABLE_POSTGRES: bool = False
    DISABLE_BLOCKCHAIN: bool = False
    
    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    # InfluxDB Configuration (Time-series for sensors)
    INFLUXDB_URL: str = "http://localhost:8086"
    INFLUXDB_TOKEN: str = "l4iGfnZMg7BDR_k3PwCl-HVPxVDFIzxqpjM6uNZ_NJ5jkmhLUZQkodXeuNzL4LFRvC73zg0hSYPH5ivYQKZfOQ=="
    INFLUXDB_ORG: str = "smart-farming"
    INFLUXDB_BUCKET: str = "sensor-data"
    
    # PostgreSQL Configuration (Relational for farm config)
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "smart_farming"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # MQTT Configuration (HiveMQ Cloud)
    MQTT_BROKER: str = "bbcee06087d24534a8bab3a332563368.s1.eu.hivemq.cloud"
    MQTT_PORT: int = 8883  # TLS port
    MQTT_USERNAME: str = "Deep2006"
    MQTT_PASSWORD: str = "Deep@2006"
    MQTT_TOPIC: str = "farm/sensors/#"
    MQTT_USE_TLS: bool = True
    
    # OpenWeatherMap API
    OPENWEATHER_API_KEY: str = "0efccc6ecb3d2ce58709b40d48a81c3e"
    OPENWEATHER_BASE_URL: str = "https://api.openweathermap.org/data/2.5"
    
    # NASA Earthdata API
    NASA_EARTHDATA_TOKEN: str = "eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6ImJ1cmlfYnVyaSIsImV4cCI6MTc3MTUyMzQyOCwiaWF0IjoxNzY2MzM5NDI4LCJpc3MiOiJodHRwczovL3Vycy5lYXJ0aGRhdGEubmFzYS5nb3YiLCJpZGVudGl0eV9wcm92aWRlciI6ImVkbF9vcHMiLCJhY3IiOiJlZGwiLCJhc3N1cmFuY2VfbGV2ZWwiOjN9.5fmO6vgBYGMmOCZX1lsQwVXrm3YtJiAQ8nvhjhWex8eGjjzaY3a4tTbcWSBYTAYubJjNZ1Nf2ZJBkeZBNRxs0MHQevZjZPL-zVPpIA5ty2ioxeSQT-1eyc6mrK-owL9Lb0DyGTXa4RYomZBkJb2h7lHpwPc9AQ-4GN__ch-6Xjjrp-45qRqCcmGNfZxryBQYelEtmr9giMGD5i5sTk_MFcNbAzhijYYCQ3QskjZWxoHp2rk2tuJIRmMZI8MJejmze6lV6W2UfJNPH0WjOUygVfjq54zdVGwkVqwwzXpIACM0ZOj1htUGJazRXQIoBpdLmgyETSMQSAeaYvgDeH8AkA"
    NASA_APPEEARS_URL: str = "https://appeears.earthdatacloud.nasa.gov/api"
    
    # Sentinel Hub OAuth (for advanced satellite imagery if needed)
    SENTINEL_CLIENT_ID: str = "5608167d-c8dd-4b35-87c1-ab37aa8243b1"
    SENTINEL_CLIENT_SECRET: str = "HEJNgUpc8x2m10bqYvAXsc9iy7ZqWOdL"
    
    # Alchemy Polygon Blockchain Configuration
    ALCHEMY_API_KEY: str = "2Vg0O_Utr3Iw09SEjprg6"
    ALCHEMY_HTTPS_URL: str = "https://polygon-mainnet.g.alchemy.com/v2/2Vg0O_Utr3Iw09SEjprg6"
    ALCHEMY_WSS_URL: str = "wss://polygon-mainnet.g.alchemy.com/v2/2Vg0O_Utr3Iw09SEjprg6"
    
    # Smart Contract Configuration (Update with your deployed contract address)
    CONTRACT_ADDRESS: str = "0x0000000000000000000000000000000000000000"  # Placeholder
    CONTRACT_ABI: str = "[]"  # Placeholder - add your contract ABI
    
    # Private key for blockchain transactions (NEVER commit real keys to git!)
    BLOCKCHAIN_PRIVATE_KEY: str = ""  # Set via environment variable only
    
    # Agronomist Decision Thresholds
    SOIL_MOISTURE_MIN_THRESHOLD: float = 30.0  # Percentage
    FORECAST_RAIN_THRESHOLD: float = 2.0  # mm
    TEMPERATURE_MAX_THRESHOLD: float = 35.0  # Celsius
    NDVI_MIN_THRESHOLD: float = 0.3  # Vegetation health
    
    # API Timeouts (in seconds)
    EXTERNAL_API_TIMEOUT: int = 30
    NASA_API_TIMEOUT: int = 60  # NASA APIs can be slower
    BLOCKCHAIN_TIMEOUT: int = 120  # Blockchain transactions can take time
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


# Global settings instance
settings = Settings()

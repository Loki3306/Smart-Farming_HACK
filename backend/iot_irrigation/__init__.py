"""
IoT Irrigation Module
Handles MQTT sensor data ingestion and WebSocket broadcasting
"""

from .router import router

__all__ = ["router"]

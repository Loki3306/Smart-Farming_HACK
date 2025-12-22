"""
API Module
Contains FastAPI routers for various endpoints
"""

from .fertilizer import router as fertilizer_router

__all__ = ['fertilizer_router']

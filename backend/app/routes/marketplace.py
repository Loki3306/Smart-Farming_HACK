"""
Indian Marketplace API Routes
Endpoints for searching agricultural products from Indian marketplaces
Completely independent from ML recommendation system
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import logging

# Real Serper API integration - 2500 free calls/month
from app.services.indian_marketplace_serper import IndianMarketplaceScraper
from app.db.base import get_db_connection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])

# Global scraper instance
marketplace_scraper = None


def get_scraper():
    """Get or initialize the marketplace scraper"""
    global marketplace_scraper
    if marketplace_scraper is None:
        marketplace_scraper = IndianMarketplaceScraper(db=None)
    return marketplace_scraper


# Request/Response Models
class ProductSearchRequest(BaseModel):
    recommendation: str = Field(..., description="ML recommendation text (e.g., 'Urea 30% nitrogen')")
    category: str = Field(..., description="Product category: fertilizer, seed, tool, pesticide, irrigation")
    location: Optional[str] = Field(None, description="Farmer location for local results")


class Product(BaseModel):
    name: str
    price: float
    rating: float
    image: str
    url: str
    seller: str
    currency: str = "INR ₹"


class MarketplaceSearchResponse(BaseModel):
    status: str
    recommendation_used: str
    category: str
    location: Optional[str]
    products: List[Product]
    source: str  # 'cache', 'fresh'
    total_found: int
    currency: str = "INR ₹"
    scrape_time: Optional[str] = None


@router.on_event("startup")
async def startup_event():
    """Initialize marketplace scraper on startup"""
    global marketplace_scraper
    try:
        marketplace_scraper = IndianMarketplaceScraper(db=None)
        logger.info("✅ Marketplace scraper initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize marketplace scraper: {e}")


@router.get("/search", response_model=MarketplaceSearchResponse)
async def search_indian_products(
    recommendation: str,
    category: str,
    location: Optional[str] = None
):
    """
    🚨 IMPORTANT: This endpoint is COMPLETELY INDEPENDENT from ML.

    Takes only recommendation TEXT (as string from UI display)
    Does NOT call ML APIs
    Does NOT modify ML data
    Does NOT affect ML recommendations

    Example:
    GET /api/marketplace/search
        ?recommendation=Urea%2030%25%20Nitrogen
        &category=fertilizer
        &location=Maharashtra
    """

    if not recommendation or len(recommendation) < 3:
        raise HTTPException(status_code=400, detail="Recommendation must be at least 3 characters")

    if category not in ['fertilizer', 'seed', 'tool', 'pesticide', 'irrigation']:
        raise HTTPException(
            status_code=400,
            detail="Invalid category. Must be one of: fertilizer, seed, tool, pesticide, irrigation"
        )

    try:
        logger.info(f"🔍 Searching marketplace: {recommendation} ({category})")

        scraper = get_scraper()
        results = await scraper.search_products_for_recommendation(
            recommendation_text=recommendation,
            category=category,
            farmer_location=location
        )

        logger.info(f"📦 Found {len(results['products'])} products")

        return MarketplaceSearchResponse(
            status="success",
            recommendation_used=recommendation,
            category=category,
            location=location,
            products=results['products'],
            source=results['source'],
            total_found=results.get('total_found', len(results['products'])),
            scrape_time=results.get('scrape_time')
        )

    except Exception as e:
        logger.error(f"❌ Marketplace search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/search", response_model=MarketplaceSearchResponse)
async def search_indian_products_post(request: ProductSearchRequest):
    """
    POST endpoint for marketplace search
    Same as GET but with request body for complex queries
    """

    if not request.recommendation or len(request.recommendation) < 3:
        raise HTTPException(status_code=400, detail="Recommendation must be at least 3 characters")

    if request.category not in ['fertilizer', 'seed', 'tool', 'pesticide', 'irrigation']:
        raise HTTPException(
            status_code=400,
            detail="Invalid category. Must be one of: fertilizer, seed, tool, pesticide, irrigation"
        )

    try:
        logger.info(f"🔍 Searching marketplace: {request.recommendation} ({request.category})")

        scraper = get_scraper()
        results = await scraper.search_products_for_recommendation(
            recommendation_text=request.recommendation,
            category=request.category,
            farmer_location=request.location
        )

        logger.info(f"📦 Found {len(results['products'])} products")

        return MarketplaceSearchResponse(
            status="success",
            recommendation_used=request.recommendation,
            category=request.category,
            location=request.location,
            products=results['products'],
            source=results['source'],
            total_found=results.get('total_found', len(results['products'])),
            scrape_time=results.get('scrape_time')
        )

    except Exception as e:
        logger.error(f"❌ Marketplace search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/health")
async def marketplace_health():
    """Health check for marketplace service"""
    return {
        "status": "healthy",
        "service": "Indian Marketplace Scraper",
        "timestamp": datetime.now().isoformat(),
        "independent": True,
        "ml_integrated": False,
        "message": "✅ Marketplace service is independent and operational"
    }


@router.get("/categories")
async def get_categories():
    """Get available product categories"""
    return {
        "categories": [
            {
                "id": "fertilizer",
                "name": "Fertilizers",
                "icon": "🧪",
                "price_range_inr": "₹100 - ₹5000"
            },
            {
                "id": "seed",
                "name": "Seeds",
                "icon": "🌱",
                "price_range_inr": "₹50 - ₹2000"
            },
            {
                "id": "pesticide",
                "name": "Pesticides",
                "icon": "🐛",
                "price_range_inr": "₹200 - ₹3000"
            },
            {
                "id": "tool",
                "name": "Farm Tools",
                "icon": "🔧",
                "price_range_inr": "₹500 - ₹50000"
            },
            {
                "id": "irrigation",
                "name": "Irrigation",
                "icon": "💧",
                "price_range_inr": "₹1000 - ₹100000"
            },
        ]
    }


@router.get("/sellers")
async def get_sellers():
    """Get available Indian sellers"""
    return {
        "sellers": [
            {
                "id": "flipkart",
                "name": "Flipkart",
                "logo": "🛒",
                "url": "https://www.flipkart.com",
                "coverage": "All India"
            },
            {
                "id": "amazon_in",
                "name": "Amazon.in",
                "logo": "📦",
                "url": "https://www.amazon.in",
                "coverage": "All India"
            },
            {
                "id": "bighaat",
                "name": "BigHaat",
                "logo": "🌾",
                "url": "https://www.bighaat.com",
                "coverage": "All India",
                "specialty": "Farmer-focused"
            },
            {
                "id": "agrostar",
                "name": "AgroStar",
                "logo": "⭐",
                "url": "https://www.agrostar.in",
                "coverage": "All India",
                "specialty": "Agricultural inputs"
            },
        ]
    }

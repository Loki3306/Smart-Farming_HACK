import asyncio
import sys
sys.path.insert(0, 'backend')
from app.services.indian_marketplace_serper import IndianMarketplaceScraper

async def test():
    scraper = IndianMarketplaceScraper()
    
    result = await scraper.search_products_for_recommendation(
        recommendation_text="Urea 30% nitrogen",
        category="fertilizer"
    )
    
    print(f"Total found: {result['total_found']}")
    print(f"Products: {len(result['products'])}")
    
    if result['products']:
        for p in result['products'][:3]:
            print(f"\n- {p['name']}")
            print(f"  Price: ₹{p['price']}")
            print(f"  Seller: {p['seller']}")
            print(f"  URL: {p['url']}")
    else:
        print("No products found!")

asyncio.run(test())

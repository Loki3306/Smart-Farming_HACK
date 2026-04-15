import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

async def test_serper_direct():
    """Test Serper scraper directly without API"""
    from app.services.indian_marketplace_serper import IndianMarketplaceScraper
    
    print("🔧 Testing Serper Scraper Directly\n")
    
    scraper = IndianMarketplaceScraper()
    
    # Test search
    result = await scraper.search_products_for_recommendation(
        recommendation_text="Urea 30% nitrogen",
        category="fertilizer"
    )
    
    print(f"Total found: {result['total_found']}")
    print(f"Products returned: {len(result['products'])}")
    print(f"Source: {result['source']}")
    print(f"Time: {result.get('scrape_time', 'N/A')}")
    
    if result['products']:
        print("\n✅ SUCCESS! Found products:\n")
        for i, p in enumerate(result['products'][:5], 1):
            print(f"{i}. {p['name'][:80]}")
            print(f"   Price: ₹{p['price']:.0f}")
            print(f"   Seller: {p['seller']}")
            print(f"   Rating: {p['rating']}\n")
    else:
        print("\n❌ No products found")
        if 'error' in result:
            print(f"Error: {result['error']}")

asyncio.run(test_serper_direct())

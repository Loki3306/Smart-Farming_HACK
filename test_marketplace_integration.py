#!/usr/bin/env python3
"""
Test Script: AI Recommendation → Marketplace Integration
Tests the complete flow from ML recommendation to marketplace product search
"""

import requests
import json
from datetime import datetime
from typing import Dict, Any

# Backend URLs
RECOMMENDATIONS_API = "http://localhost:8000/api/recommendations"
MARKETPLACE_API = "http://localhost:8000/api/marketplace"

# ============================================================================
# SIMULATED ML RECOMMENDATION OUTPUT
# ============================================================================

def get_simulated_ml_output() -> Dict[str, Any]:
    """
    Simulates what the ML recommendation system outputs
    This is based on real crop recommendations
    """
    return {
        "report_id": "crop-rec-2026-04-14-001",
        "farmer_id": "farmer-123",
        "farm_id": "farm-456",
        "location": "Maharashtra",
        "crop_type": "Cotton",
        "soil_analysis": {
            "nitrogen": 18.5,
            "phosphorus": 12.3,
            "potassium": 120.0,
            "pH": 6.8
        },
        "recommendations": {
            # Fertilizer recommendation from ML
            "fertilizer": {
                "type": "Urea NPK",
                "specification": "30% Nitrogen with NPK 20:20:20",
                "reason": "Cotton needs high nitrogen for growth. Current N level (18.5) is below optimal (35-40)"
            },
            # Crop/Seed recommendation from ML
            "crop": {
                "type": "Cotton Hybrid Seeds",
                "variety": "Mahyco hybrid variety",
                "reason": "Best suited for Maharashtra climate, high yield variety"
            },
            # Tool recommendation from ML
            "tool": {
                "type": "Drip Irrigation System",
                "specification": "1.5 HP electric drip with 500L tank",
                "reason": "Water conservation needed for cotton. Current moisture is low (38%)"
            },
            # Pesticide recommendation
            "pesticide": {
                "type": "Organic Neem-based pesticide",
                "specification": "0.5% concentration for cotton bollworms",
                "reason": "Preventive treatment recommended for cotton season"
            }
        },
        "soil_parameters": {
            "moisture": 38.2,
            "temperature": 28.5,
            "humidity": 65.0,
            "EC": 0.45  # Electrical Conductivity
        },
        "confidence_score": 0.94,
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# TEST FUNCTIONS
# ============================================================================

def test_marketplace_search(recommendation_text: str, category: str, location: str = None):
    """
    Test marketplace search with a specific recommendation
    """
    print(f"\n{'='*70}")
    print(f"🔍 TESTING MARKETPLACE SEARCH")
    print(f"{'='*70}")
    print(f"📝 Recommendation: {recommendation_text}")
    print(f"🏷️  Category: {category}")
    if location:
        print(f"📍 Location: {location}")
    print(f"{'='*70}\n")
    
    try:
        # Build request
        params = {
            "recommendation": recommendation_text,
            "category": category
        }
        if location:
            params["location"] = location
        
        # Make request
        print("📤 Sending request to marketplace API...")
        response = requests.get(
            f"{MARKETPLACE_API}/search",
            params=params,
            timeout=15
        )
        
        if response.status_code != 200:
            print(f"❌ Error: Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        
        # Display results
        print(f"✅ Search successful!\n")
        print(f"📊 RESULTS SUMMARY:")
        print(f"   Status: {data.get('status')}")
        print(f"   Source: {data.get('source')} (fresh/cache)")
        print(f"   Total Found: {data.get('total_found')} products")
        print(f"   Returned: {len(data.get('products', []))} products")
        print(f"   Currency: {data.get('currency')}")
        
        # Show products
        products = data.get("products", [])
        if products:
            print(f"\n🛒 TOP PRODUCTS:\n")
            for idx, product in enumerate(products[:5], 1):
                print(f"   {idx}. {product['name']}")
                print(f"      💰 Price: ₹{product['price']:,.0f}")
                print(f"      ⭐ Rating: {product['rating']}")
                print(f"      🏪 Seller: {product['seller']}")
                print(f"      🔗 Link: {product['url'][:60]}...")
                print()
        else:
            print(f"⚠️  No products found")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to backend at {MARKETPLACE_API}/search")
        print(f"   Make sure backend is running: python -m uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_health_check():
    """
    Test if marketplace service is healthy
    """
    print(f"\n{'='*70}")
    print(f"✅ HEALTH CHECK")
    print(f"{'='*70}\n")
    
    try:
        response = requests.get(f"{MARKETPLACE_API}/health", timeout=5)
        data = response.json()
        
        print(f"Status: {data.get('status')}")
        print(f"Service: {data.get('service')}")
        print(f"Independent: {data.get('independent')}")
        print(f"ML Integrated: {data.get('ml_integrated')}")
        print(f"Message: {data.get('message')}")
        
        if data.get('status') == 'healthy':
            print(f"\n✅ Marketplace service is healthy!\n")
            return True
        else:
            print(f"\n⚠️  Service not healthy\n")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to backend")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_categories():
    """
    Test getting available categories
    """
    print(f"\n{'='*70}")
    print(f"📂 AVAILABLE CATEGORIES")
    print(f"{'='*70}\n")
    
    try:
        response = requests.get(f"{MARKETPLACE_API}/categories", timeout=5)
        data = response.json()
        
        for cat in data.get('categories', []):
            print(f"{cat['icon']} {cat['name']}")
            print(f"   Price Range: {cat['price_range_inr']}")
            print()
        
        return True
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_sellers():
    """
    Test getting available sellers
    """
    print(f"\n{'='*70}")
    print(f"🏪 AVAILABLE SELLERS")
    print(f"{'='*70}\n")
    
    try:
        response = requests.get(f"{MARKETPLACE_API}/sellers", timeout=5)
        data = response.json()
        
        for seller in data.get('sellers', []):
            print(f"{seller['logo']} {seller['name']}")
            print(f"   Coverage: {seller['coverage']}")
            if 'specialty' in seller:
                print(f"   Specialty: {seller['specialty']}")
            print()
        
        return True
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


# ============================================================================
# MAIN TEST SUITE
# ============================================================================

def run_full_test_suite():
    """
    Run complete test with simulated ML output
    """
    print("\n")
    print("╔" + "═"*68 + "╗")
    print("║" + " "*15 + "🌾 MARKETPLACE INTEGRATION TEST SUITE 🌾" + " "*12 + "║")
    print("║" + " "*20 + "Testing AI Recommendation → Marketplace" + " "*10 + "║")
    print("╚" + "═"*68 + "╝")
    
    # Step 1: Health check
    print("\n[STEP 1/5] Health Check...")
    if not test_health_check():
        print("\n❌ Backend is not running!")
        print("Start it with: cd backend && python -m uvicorn app.main:app --reload --port 8000")
        return
    
    # Step 2: Get categories
    print("\n[STEP 2/5] Available Categories...")
    test_categories()
    
    # Step 3: Get sellers
    print("\n[STEP 3/5] Available Sellers...")
    test_sellers()
    
    # Step 4: Get ML output
    print("\n[STEP 4/5] Simulated ML Recommendation Output...")
    ml_output = get_simulated_ml_output()
    print(f"\n📋 ML OUTPUT FOR COTTON FARM IN MAHARASHTRA:")
    print(json.dumps(ml_output, indent=2))
    
    # Step 5: Test marketplace with ML output
    print("\n[STEP 5/5] Testing Marketplace with ML Recommendations...")
    
    results = {}
    
    # Test 1: Fertilizer
    print("\n" + "▶" * 35)
    print("TEST 1: FERTILIZER RECOMMENDATION")
    print("▶" * 35)
    results['fertilizer'] = test_marketplace_search(
        recommendation_text=ml_output['recommendations']['fertilizer']['specification'],
        category='fertilizer',
        location=ml_output['location']
    )
    
    # Test 2: Seed/Crop
    print("\n" + "▶" * 35)
    print("TEST 2: CROP/SEED RECOMMENDATION")
    print("▶" * 35)
    results['crop'] = test_marketplace_search(
        recommendation_text=ml_output['recommendations']['crop']['variety'],
        category='seed',
        location=ml_output['location']
    )
    
    # Test 3: Tool/Irrigation
    print("\n" + "▶" * 35)
    print("TEST 3: TOOL/IRRIGATION RECOMMENDATION")
    print("▶" * 35)
    results['tool'] = test_marketplace_search(
        recommendation_text=ml_output['recommendations']['tool']['specification'],
        category='irrigation',
        location=ml_output['location']
    )
    
    # Test 4: Pesticide
    print("\n" + "▶" * 35)
    print("TEST 4: PESTICIDE RECOMMENDATION")
    print("▶" * 35)
    results['pesticide'] = test_marketplace_search(
        recommendation_text=ml_output['recommendations']['pesticide']['specification'],
        category='pesticide',
        location=ml_output['location']
    )
    
    # Summary
    print("\n" + "═"*70)
    print("📊 TEST SUMMARY")
    print("═"*70)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name.upper()}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Marketplace is working perfectly!")
        print("\n✨ Next Steps:")
        print("   1. Integrate IndianMarketplace component in your pages")
        print("   2. Pass recommendation text from ML output")
        print("   3. Show products to farmers with purchase links")
        print("\n💡 Integration Example:")
        print("   <IndianMarketplace")
        print('       recommendation="30% Nitrogen with NPK 20:20:20"')
        print('       category="fertilizer"')
        print('       location="Maharashtra"')
        print("   />")
    else:
        print("\n⚠️  Some tests failed. Check backend logs.")


if __name__ == "__main__":
    run_full_test_suite()

import requests
import json

url = "http://localhost:8000/api/marketplace/search"
params = {
    'recommendation': 'Urea fertilizer',
    'category': 'fertilizer'
}

print(f"🔗 Testing: {url}")
print(f"Params: {params}\n")

try:
    response = requests.get(url, params=params, timeout=15)
    print(f"Status: {response.status_code}\n")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Total found: {data.get('total_found')}")
        print(f"Products: {len(data.get('products', []))}\n")
        
        for p in data.get('products', [])[:5]:
            print(f"- {p['name'][:70]}")
            print(f"  ₹{p['price']:.0f} | {p['seller']}\n")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    print("Make sure backend is running at localhost:8000")

"""
Indian Marketplace Scraper using Serper API
Real product search from Indian e-commerce platforms
Completely independent from ML recommendation system
"""

import asyncio
import logging
import os
import re
from datetime import datetime
from typing import List, Optional, Dict
import aiohttp

logger = logging.getLogger(__name__)

# Serper API Configuration
SERPER_API_KEY_ENV = "SERPER_API_KEY"
SERPER_API_URL_ENV = "SERPER_API_URL"
DEFAULT_SERPER_API_URL = "https://google.serper.dev/search"


class IndianMarketplaceScraper:
    """
    Searches for agricultural products using Serper API.
    Real-time product discovery from Indian e-commerce platforms.
    """

    def __init__(self, db=None):
        self.db = db
        self.api_key = os.getenv(SERPER_API_KEY_ENV, "").strip()
        configured_url = os.getenv(SERPER_API_URL_ENV, DEFAULT_SERPER_API_URL).strip()
        self.api_url = configured_url or DEFAULT_SERPER_API_URL

        if not self.api_key:
            logger.warning(
                "SERPER_API_KEY is not set. Marketplace fetches will be skipped until it is configured."
            )
        
        self.sellers = {
            'flipkart': 'site:flipkart.com',
            'amazon': 'site:amazon.in',
            'bighaat': 'site:bighaat.com',
            'agrostar': 'site:agrostar.in'
        }

    async def search_products_for_recommendation(
        self,
        recommendation_text: str,
        category: str,
        farmer_location: Optional[str] = None
    ) -> Dict:
        """
        Search for products matching ML recommendation using Serper API.
        
        Args:
            recommendation_text: ML recommendation (e.g., "Urea 30% nitrogen")
            category: Product category 
            farmer_location: Optional farmer location
        
        Returns:
            Dict with products, source, total_found
        """
        
        try:
            start_time = datetime.now()
            search_term = self._parse_recommendation(recommendation_text)
            
            logger.info(f"🔍 Serper search: {search_term} ({category})")
            
            products = []
            
            # Search all sellers in parallel
            tasks = [
                self._search_seller(search_term, 'flipkart'),
                self._search_seller(search_term, 'amazon'),
                self._search_seller(search_term, 'bighaat'),
                self._search_seller(search_term, 'agrostar'),
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    logger.warning(f"Search error: {result}")
                elif result:
                    products.extend(result)
            
            # Remove duplicates by URL
            unique = {}
            for p in products:
                key = p['url']
                if key not in unique:
                    unique[key] = p
            
            # ✅ Filter out zero-price products — they add no value to the user
            all_products = list(unique.values())
            valid_products = [p for p in all_products if p.get('price', 0) > 0]
            
            # If we filtered too aggressively, keep at most 20
            products = valid_products[:20]
            scrape_time = (datetime.now() - start_time).total_seconds()
            
            logger.info(f"✅ Found {len(products)} priced products ({len(all_products)} total) in {scrape_time:.2f}s")
            
            return {
                'products': products,
                'source': 'fresh',
                'total_found': len(products),
                'scrape_time': f"{scrape_time:.2f}s"
            }
        
        except Exception as e:
            logger.error(f"❌ Search failed: {e}", exc_info=True)
            return {
                'products': [],
                'source': 'error',
                'total_found': 0,
                'error': str(e)
            }

    async def _search_seller(self, search_term: str, seller: str) -> List[Dict]:
        """Search a specific seller using Serper API"""
        try:
            await asyncio.sleep(0.5)  # Rate limiting
            
            # Build search query with seller filter
            query = f"{search_term} {self.sellers[seller]} price ₹"
            
            logger.info(f"🔗 Searching {seller.upper()}: {query}")
            
            products = await self._serper_search(query, seller)
            
            logger.info(f"✅ {seller.upper()}: {len(products)} products")
            return products
        
        except Exception as e:
            logger.warning(f"⚠️  {seller} error: {e}")
            return []

    async def _serper_search(self, query: str, seller: str) -> List[Dict]:
        """Call Serper API and parse results"""
        try:
            if not self.api_key:
                logger.warning("Skipping Serper request because SERPER_API_KEY is missing")
                return []

            headers = {
                'X-API-KEY': self.api_key,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': query,
                'gl': 'in',  # Google India
                'hl': 'en',
                'num': 10
            }
            
            timeout = aiohttp.ClientTimeout(total=10)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(self.api_url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        products = self._parse_serper_response(data, seller)
                        return products
                    else:
                        logger.warning(f"⚠️  Serper API error: {response.status}")
                        return []
        
        except asyncio.TimeoutError:
            logger.warning(f"⚠️  Serper request timeout")
            return []
        except Exception as e:
            logger.warning(f"⚠️  Serper error: {e}")
            return []

    def _parse_serper_response(self, data: Dict, seller: str) -> List[Dict]:
        """Parse Serper API response"""
        products = []
        
        try:
            # Serper returns 'organic' results (not 'shopping')
            organic = data.get('organic', [])
            
            for item in organic:
                try:
                    title = item.get('title', '')
                    snippet = item.get('snippet', '')
                    link = item.get('link', '')
                    rating = item.get('rating', 0.0)
                    
                    # Skip items without valid URL or title
                    if not link or not title:
                        continue
                    
                    # Extract price — try snippet first, then title as fallback
                    price = self._extract_price_from_snippet(snippet)
                    if price == 0.0:
                        price = self._extract_price_from_snippet(title)
                    
                    # Skip items with no price — they clutter results
                    if price == 0.0:
                        logger.debug(f"Skipping no-price item: {title[:60]}")
                        continue
                    
                    # Try to get a thumbnail image from Serper's sitelinks or imageUrl
                    image_url = (
                        item.get('imageUrl', '') or
                        item.get('thumbnailUrl', '') or
                        ''
                    )
                    
                    product = {
                        'name': title[:120],
                        'price': price,
                        'rating': float(rating) if rating else 0.0,
                        'image': image_url,
                        'url': link,
                        'seller': seller.upper(),
                        'currency': 'INR ₹'
                    }
                    
                    products.append(product)
                
                except Exception as e:
                    logger.debug(f"Parse item error: {e}")
                    continue
        
        except Exception as e:
            logger.warning(f"Parse error ({seller}): {e}")
        
        return products[:10]

    def _parse_price(self, price_str: str) -> float:
        """Extract numeric price from string"""
        try:
            if not price_str:
                return 0.0
            
            # Remove currency symbols
            price_str = price_str.replace('₹', '').replace('Rs', '').replace('Rs.', '').strip()
            # Remove thousands separators
            price_str = price_str.replace(',', '')
            
            # Extract first number
            match = re.search(r'(\d+(?:\.\d{2})?)', price_str)
            if match:
                return float(match.group(1))
            return 0.0
        except:
            return 0.0

    def _extract_price_from_snippet(self, snippet: str) -> float:
        """Extract price from search snippet or title"""
        try:
            if not snippet:
                return 0.0
            
            # Pattern 1: ₹1,299 or ₹1299 or Rs 1299
            match = re.search(r'[₹]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)', snippet)
            if match:
                return float(match.group(1).replace(',', ''))
            
            # Pattern 2: Rs. 1299 or Rs 1299
            match = re.search(r'Rs\.?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)', snippet, re.IGNORECASE)
            if match:
                return float(match.group(1).replace(',', ''))
            
            # Pattern 3: price keyword followed by number (e.g. "price 399")
            match = re.search(r'(?:price|cost|mrp|rate)[:\s]+[₹Rs.]*\s*(\d{2,6})', snippet, re.IGNORECASE)
            if match:
                val = float(match.group(1))
                # Sanity check: must be between ₹1 and ₹10,00,000
                if 1 <= val <= 1000000:
                    return val
            
            return 0.0
        except:
            return 0.0

    def _parse_recommendation(self, rec: str) -> str:
        """Parse ML recommendation to search term"""
        try:
            # Remove parenthetical info
            rec = rec.split('(')[0].strip()
            # Take first 3-4 words
            terms = rec.split()[:4]
            result = ' '.join(terms)
            return result if result else rec
        except:
            return rec

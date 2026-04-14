import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Search,
  Loader,
  MapPin,
  Star,
  ExternalLink,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  name: string;
  price: number;
  rating: number;
  image: string;
  url: string;
  seller: string;
  currency: string;
}

interface MarketplaceProduct {
  status: string;
  recommendation_used: string;
  category: string;
  location: string | null;
  products: Product[];
  source: string;
  total_found: number;
  currency: string;
  scrape_time: string | null;
}

interface IndianMarketplaceProps {
  recommendation: string;
  category: 'fertilizer' | 'seed' | 'tool' | 'pesticide' | 'irrigation';
  location?: string;
}

const categoryIcons: Record<string, string> = {
  fertilizer: 'Beaker',
  seed: 'Sprout',
  tool: 'Wrench',
  pesticide: 'AlertTriangle',
  irrigation: 'Droplets',
};

const categoryNames: Record<string, string> = {
  fertilizer: 'Fertilizers',
  seed: 'Seeds',
  tool: 'Farm Tools',
  pesticide: 'Pesticides',
  irrigation: 'Irrigation Products',
};

const sellerLogos: Record<string, string> = {
  'Flipkart': 'ShoppingCart',
  'Amazon.in': 'Package',
  'BigHaat': 'Leaf',
  'AgroStar': 'Star',
};

export const IndianMarketplace: React.FC<IndianMarketplaceProps> = ({
  recommendation,
  category,
  location,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchData, setSearchData] = useState<MarketplaceProduct | null>(null);

  useEffect(() => {
    fetchProductsFromMarketplace();
  }, [recommendation, category, location]);

  const fetchProductsFromMarketplace = async () => {
    setLoading(true);
    setError('');

    try {
      // 🔑 KEY: We send recommendation TEXT (as displayed from ML)
      // Marketplace will search for it independently
      const params = new URLSearchParams({
        recommendation: recommendation,
        category: category,
      });

      if (location) {
        params.append('location', location);
      }

      const response = await fetch(
        `/python-api/api/marketplace/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          "Backend proxy not active. Please restart the Vite dev server (pnpm dev) and ensure FastAPI is running on port 8000."
        );
      }

      const data: MarketplaceProduct = await response.json();
      setSearchData(data);
      setProducts(data.products);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to find products'
      );
      console.error('Marketplace search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="indian-marketplace w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm p-6 mb-6 border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingCart className="text-4xl text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Indian Market - {categoryNames[category]}
            </h2>
            <p className="text-sm text-gray-600">
              सभी भारतीय कृषि बाज़ारों से सर्वश्रेष्ठ विकल्पों को ढूंढें
            </p>
          </div>
        </div>

        {/* ML Recommendation Display */}
        <div className="bg-white border-l-4 border-green-600 p-4 rounded">
          <p className="text-xs text-gray-600 font-semibold">ML ने सुझाया:</p>
          <p className="text-lg font-bold text-green-700">{recommendation}</p>
          {location && (
            <p className="text-xs text-gray-600 mt-2">
              <MapPin className="inline w-3 h-3 mr-1" />
              {location}
            </p>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-10 h-10 animate-spin text-green-600 mb-4" />
          <p className="text-gray-600 font-medium">
            बाज़ार खोज रहे हैं...
          </p>
          <p className="text-xs text-gray-500 mt-2">
            भारतीय बाजारों से सर्वश्रेष्ठ सौदे खोज रहे हैं
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">खोज विफल (Search Failed)</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {searchData && !loading && (
        <div className="mb-6 flex flex-wrap gap-4 text-sm">
          <div className="bg-sky-50 text-sky-700 px-4 py-2 rounded-lg border border-sky-200">
            {searchData.total_found} कुल उत्पाद मिले
          </div>
          <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg border border-purple-200">
            {searchData.source === 'cache' ? 'कैश से' : 'ताज़ी खोज'}
          </div>
          {searchData.scrape_time && (
            <div className="bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-200">
              {new Date(searchData.scrape_time).toLocaleTimeString('en-IN')}
            </div>
          )}
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {products.map((product, idx) => (
              <motion.div
                key={`${product.seller}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <IndianProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : !loading && error === '' ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            कोई उत्पाद नहीं मिला
          </p>
          <p className="text-xs text-gray-500 mt-2">
            कृपया अपनी खोज परिधि बढ़ाने का प्रयास करें
          </p>
        </div>
      ) : null}

      {/* Footer Info */}
      {products.length > 0 && !loading && (
        <div className="mt-8 bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs text-gray-600">
            💡 <strong>सुझाव:</strong> सभी कीमतें भारतीय रुपये (₹) में हैं। 
            कीमतें और उपलब्धता वास्तविक समय में बदल सकती है।
          </p>
        </div>
      )}
    </div>
  );
};

const IndianProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const sellerLogo = sellerLogos[product.seller] || '🏪';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all hover:scale-105 h-full flex flex-col bg-white">
      {/* Product Image Placeholder */}
      <div className="bg-gradient-to-br from-green-100 to-emerald-100 h-40 flex items-center justify-center border-b border-green-200">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m0 0l8 4m-8-4v10l8 4m0-10l8 4m-8-4v10" /%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="text-5xl">🛒</div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 mb-2">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(product.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 font-medium">
              {product.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Seller Badge */}
        <div className="mb-4 inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 w-fit">
          <span className="text-sm">{sellerLogo}</span>
          <span className="text-xs font-medium text-gray-700">
            {product.seller}
          </span>
        </div>

        {/* Buy Button */}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2 rounded-lg font-semibold text-center flex items-center justify-center gap-2 transition-all hover:shadow-md"
        >
          <ShoppingCart className="w-4 h-4" />
          {product.seller} पर खरीदें
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </Card>
  );
};

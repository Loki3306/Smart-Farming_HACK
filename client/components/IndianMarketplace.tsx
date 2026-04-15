import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Search,
  Loader2,
  MapPin,
  Star,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Package,
  RefreshCw,
  Zap,
  Radio,
  Info,
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

const categoryNames: Record<string, string> = {
  fertilizer: 'Fertilizers',
  seed: 'Seeds',
  tool: 'Farm Tools',
  pesticide: 'Pesticides',
  irrigation: 'Irrigation Products',
};

const sellerColors: Record<string, string> = {
  'Flipkart': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Amazon.in': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'AMAZON': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'FLIPKART': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'BigHaat': 'bg-green-500/10 text-green-400 border-green-500/20',
  'AgroStar': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const getSellerColor = (seller: string) =>
  sellerColors[seller] || 'bg-primary/10 text-primary border-primary/20';

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
    setProducts([]);
    setSearchData(null);

    try {
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

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'Backend proxy not active. Please restart the Vite dev server (pnpm dev) and ensure FastAPI is running on port 8000.'
        );
      }

      const data: MarketplaceProduct = await response.json();
      setSearchData(data);
      // Frontend safety net: never show ₹0 products
      const validProducts = data.products.filter((p) => p.price > 0);
      setProducts(validProducts);
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
    <div className="indian-marketplace w-full space-y-5">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 via-card to-card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Indian Market — {categoryNames[category] || category}
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Live
            </span>
          </h2>
          <p className="text-sm text-muted-foreground truncate">
            Searching Flipkart · Amazon · BigHaat · AgroStar for{' '}
            <span className="font-semibold text-foreground">
              {recommendation}
            </span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchProductsFromMarketplace}
          disabled={loading}
          className="flex-shrink-0 gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ML Suggestion Pill */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          ML Suggested:
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold text-primary">
          {recommendation}
        </span>
        {location && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {location}
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <ShoppingCart className="absolute inset-0 m-auto w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium">Searching Indian Markets…</p>
            <p className="text-sm text-muted-foreground mt-1">
              Finding the best deals across Flipkart, Amazon &amp; more
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground">Search Failed</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={fetchProductsFromMarketplace}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Results Stats Bar */}
      {searchData && !loading && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="px-3 py-1.5 rounded-full bg-card border border-border text-sm text-foreground font-medium">
            {searchData.total_found} products found
          </span>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
            searchData.source === 'cache'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-green-500/10 text-green-400 border-green-500/20'
          } inline-flex items-center gap-1.5`}>
            {searchData.source === 'cache' ? (
              <>
                <Zap className="w-3.5 h-3.5" />
                Cached
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5" />
                Live Search
              </>
            )}
          </span>
          {searchData.scrape_time && (
            <span className="px-3 py-1.5 rounded-full bg-card border border-border text-sm text-muted-foreground">
              Updated {new Date(searchData.scrape_time).toLocaleTimeString('en-IN')}
            </span>
          )}
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {products.map((product, idx) => (
              <motion.div
                key={`${product.seller}-${idx}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <IndianProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && searchData && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-semibold text-lg">No products found</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Try a different search term or broader category.
            </p>
          </div>
          <Button variant="outline" onClick={fetchProductsFromMarketplace}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Search Again
          </Button>
        </div>
      )}

      {/* Footer Disclaimer */}
      {products.length > 0 && !loading && (
        <p className="text-xs text-muted-foreground text-center pb-2 flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-primary" />
          <span>
            All prices are in Indian Rupees (₹). Prices and availability may change in real time.
          </span>
        </p>
      )}
    </div>
  );
};

/* ─── Product Card ─────────────────────────────────────────────────── */

const IndianProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const sellerColorClass = getSellerColor(product.seller);

  const displayName =
    product.seller.charAt(0).toUpperCase() +
    product.seller.slice(1).toLowerCase();

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col bg-card border-border group">
      {/* Product Image */}
      <div className="relative h-44 bg-gradient-to-br from-muted/60 to-muted overflow-hidden flex-shrink-0">
        {product.image && !imgFailed ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgFailed(true)}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">No image</span>
          </div>
        )}

        {/* Seller badge on image */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold border ${sellerColorClass} backdrop-blur-sm`}>
          {product.seller}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <h3 className="font-semibold text-sm line-clamp-2 text-foreground leading-snug">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">
            ₹{product.price > 0 ? product.price.toLocaleString('en-IN') : '—'}
          </span>
          {product.price === 0 && (
            <span className="text-xs text-muted-foreground">Price unavailable</span>
          )}
        </div>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : i < product.rating
                      ? 'fill-yellow-400/50 text-yellow-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {product.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Buy Button */}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm hover:shadow-md active:scale-95">
            <ShoppingCart className="w-4 h-4" />
            Buy on {displayName}
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </a>
      </div>
    </Card>
  );
};

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ShoppingCart,
  Search,
  Filter,
  Leaf,
  Package,
  Truck,
  Star,
  MapPin,
  Phone,
  Plus,
  Heart,
  Tag,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
  Shield,
  ExternalLink,
  Check,
  Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cropPriceService, type CropData } from "@/services/CropPriceService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  category: "seeds" | "fertilizers" | "pesticides" | "equipment" | "produce";
  price: number;
  unit: string;
  seller: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  organic: boolean;
  inStock: boolean;
}

interface Listing {
  id: string;
  title: string;
  category: string;
  quantity: string;
  price: number;
  seller: string;
  location: string;
  postedDate: Date;
}

export const Marketplace: React.FC = () => {
  const { t } = useTranslation('marketplace');
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [crops, setCrops] = useState<CropData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<CropData | null>(null);
  const [imageError, setImageError] = useState<Set<string>>(new Set());
  const [imageAttempts, setImageAttempts] = useState<Map<string, number>>(new Map());
  const [fertilizerProducts, setFertilizerProducts] = useState<any[]>([]);
  const [loadingFertilizers, setLoadingFertilizers] = useState(false);

  // Load crop data on mount
  useEffect(() => {
    loadCropData();
    loadFertilizerProducts();
  }, []);

  const loadCropData = async () => {
    setLoading(true);
    try {
      const cropData = await cropPriceService.getCropDataForMarketplace();
      setCrops(cropData);
    } catch (error) {
      console.error('Failed to load crop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFertilizerProducts = async () => {
    setLoadingFertilizers(true);
    try {
      const response = await fetch('http://localhost:8000/api/recommendations/products/fertilizers');
      if (response.ok) {
        const products = await response.json();
        setFertilizerProducts(products);
        console.log('[Marketplace] Loaded fertilizer products:', products.length);
      }
    } catch (error) {
      console.error('[Marketplace] Failed to load fertilizer products:', error);
    } finally {
      setLoadingFertilizers(false);
    }
  };

  const categories = [
    { id: "all", name: t('categories.all'), icon: Package },
    { id: "seeds", name: t('categories.seeds'), icon: Leaf },
    { id: "fertilizers", name: t('categories.fertilizers'), icon: Package },
    { id: "pesticides", name: t('categories.pesticides'), icon: Package },
    { id: "equipment", name: t('categories.equipment'), icon: Package },
    { id: "produce", name: t('categories.produce'), icon: Leaf },
  ];

  const products: Product[] = [
    {
      id: "1",
      name: `${t('products.rice')} ${t('products.seeds')} (IR-64)`,
      category: "seeds",
      price: 450,
      unit: "kg",
      seller: "Agri Seeds India",
      location: "Nashik, Maharashtra",
      rating: 4.5,
      reviews: 128,
      image: "🌾",
      organic: false,
      inStock: true,
    },
    {
      id: "2",
      name: `${t('labels.organic')} ${t('products.neem cake')} ${t('products.fertilizer')}`,
      category: "fertilizers",
      price: 25,
      unit: "kg",
      seller: "Green Earth Organics",
      location: "Pune, Maharashtra",
      rating: 4.8,
      reviews: 89,
      image: "🌿",
      organic: true,
      inStock: true,
    },
    {
      id: "3",
      name: `Bio-Pesticide (${t('products.neem oil') || 'Neem Oil'})`,
      category: "pesticides",
      price: 350,
      unit: "liter",
      seller: "Kisan Agro",
      location: "Mumbai, Maharashtra",
      rating: 4.3,
      reviews: 45,
      image: "🧴",
      organic: true,
      inStock: true,
    },
    {
      id: "4",
      name: `${t('products.drip irrigation')} Kit (1 Acre)`,
      category: "equipment",
      price: 15000,
      unit: "set",
      seller: "Jain Irrigation",
      location: "Jalgaon, Maharashtra",
      rating: 4.7,
      reviews: 234,
      image: "💧",
      organic: false,
      inStock: true,
    },
    {
      id: "5",
      name: `Fresh ${t('labels.organic')} ${t('products.tomato')}`,
      category: "produce",
      price: 40,
      unit: "kg",
      seller: "Ramesh Farms",
      location: "Nagpur, Maharashtra",
      rating: 4.6,
      reviews: 67,
      image: "🍅",
      organic: true,
      inStock: true,
    },
    {
      id: "6",
      name: `${t('products.wheat')} ${t('products.seeds')} (HD-2967)`,
      category: "seeds",
      price: 380,
      unit: "kg",
      seller: "Punjab Seeds Co.",
      location: "Ludhiana, Punjab",
      rating: 4.4,
      reviews: 156,
      image: "🌾",
      organic: false,
      inStock: false,
    },
  ];

  const myListings: Listing[] = [
    {
      id: "1",
      title: "Organic Rice (Basmati)",
      category: "produce",
      quantity: "500 kg",
      price: 65,
      seller: "You",
      location: "Your Farm",
      postedDate: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: "2",
      title: "Fresh Onions",
      category: "produce",
      quantity: "200 kg",
      price: 25,
      seller: "You",
      location: "Your Farm",
      postedDate: new Date(Date.now() - 86400000 * 5),
    },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredCrops = crops.filter((crop) => {
    const matchesSearch =
      crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || crop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleImageError = (cropId: string) => {
    const attempts = imageAttempts.get(cropId) || 0;
    const maxAttempts = 3; // Try 3 different extensions (.jpg, .jpeg, .png)

    if (attempts < maxAttempts) {
      // Try next extension
      setImageAttempts(prev => new Map(prev).set(cropId, attempts + 1));
    } else {
      // All attempts failed, mark as error
      setImageError(prev => new Set(prev).add(cropId));
    }
  };

  const getImageSrc = (crop: CropData): string => {
    const attempts = imageAttempts.get(crop.id) || 0;
    const extensions = ['jpg', 'jpeg', 'png'];
    const currentExt = extensions[attempts] || 'jpg';

    // Extract the base path and replace extension
    const basePath = crop.image.replace(/\.(jpg|jpeg|png)$/i, '');
    return `${basePath}.${currentExt}`;
  };

  const getPriceChange = (crop: CropData): { change: number; isPositive: boolean } => {
    const change = Math.round(((crop.price - crop.minPrice) / crop.minPrice) * 100);
    return { change: Math.abs(change), isPositive: change >= 0 };
  };

  const getLocalizedName = (name: string) => {
    const lowerName = name.toLowerCase();

    // Try explicit match first
    const key = `products.${lowerName}`;
    const translated = t(key);

    // If translation is different from key (excluding namespace prefix if any), use it
    if (translated && translated !== key && translated !== `marketplace:${key}`) {
      return translated;
    }

    // Check for "Seeds" suffix
    if (lowerName.includes(' seeds')) {
      const baseName = lowerName.replace(' seeds', '');
      const baseKey = `products.${baseName}`;
      const baseTranslated = t(baseKey);

      if (baseTranslated && baseTranslated !== baseKey && baseTranslated !== `marketplace:${baseKey}`) {
        return `${baseTranslated} ${t('products.seeds')}`;
      }
    }

    // Try partial matches for known crops
    const knownCrops = [
      'rice', 'wheat', 'tomato', 'potato', 'onion', 'cotton', 'soybean',
      'maize', 'chilli', 'sunflower', 'jowar', 'bajra', 'sugarcane',
      'banana', 'coconut', 'lemon', 'papaya', 'pineapple', 'cucumber',
      'ginger', 'garlic', 'turmeric'
    ];

    for (const crop of knownCrops) {
      if (lowerName.includes(crop)) {
        const cropKey = `products.${crop}`;
        const cropTranslated = t(cropKey);
        if (cropTranslated && cropTranslated !== cropKey && cropTranslated !== `marketplace:${cropKey}`) {
          return name.replace(new RegExp(crop, 'gi'), cropTranslated);
        }
      }
    }

    return name;
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div data-tour-id="market-header">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-primary" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2" data-tour-id="market-tabs">
        <Button
          variant={activeTab === "buy" ? "default" : "outline"}
          onClick={() => setActiveTab("buy")}
          className="gap-2"
        >
          <Package className="w-4 h-4" />
          {t('tabs.buy')}
        </Button>
        <Button
          variant={activeTab === "sell" ? "default" : "outline"}
          onClick={() => setActiveTab("sell")}
          className="gap-2"
        >
          <Tag className="w-4 h-4" />
          {t('tabs.sell')}
        </Button>
      </div>

      {activeTab === "insurance" ? (
        <>
          {/* Insurance Providers Section */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Protect Your Crops with Insurance
              </h2>
              <p className="text-muted-foreground">
                Compare and choose from trusted insurance providers. Get coverage for crop damage, weather risks, and more.
              </p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* GramCover - Farmer Focused */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-xl transition-all border-2 border-green-200 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 font-semibold">
                    RECOMMENDED
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">GramCover</h3>
                        <p className="text-sm text-green-600 font-medium">For Rural Farmers</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Specialized insurance for farmers with mobile enrollment, crop insurance, livestock protection, and life coverage.
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Direct API integration</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Mobile-first enrollment</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Crop + Livestock + Life</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Partner network support</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>All India Coverage</span>
                      </div>
                      <a
                        href="https://gramcover.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                          Learn More
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* PMFBY - Government Scheme */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all border-2 border-orange-200 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-3 py-1 font-semibold">
                    GOVT SUBSIDY
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">PMFBY</h3>
                        <p className="text-sm text-orange-600 font-medium">Government Scheme</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Pradhan Mantri Fasal Bima Yojana - India's flagship crop insurance with heavy government subsidies.
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Low premium (2% for Kharif)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Covers all risks (drought, flood)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Satellite-based claims</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Fast settlement via AI</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Building2 className="w-4 h-4" />
                        <span>Ministry of Agriculture</span>
                      </div>
                      <a
                        href="https://pmfby.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full gap-2 bg-orange-600 hover:bg-orange-700">
                          Apply Now
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* 1Silverbullet - Multi-Provider Aggregator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="h-full hover:shadow-xl transition-all border-2 border-blue-200 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 font-semibold">
                    AGGREGATOR
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Package className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">1Silverbullet</h3>
                        <p className="text-sm text-blue-600 font-medium">Compare Multiple Plans</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Single API gateway to compare insurance plans from multiple providers. One integration, many options.
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Multi-provider comparison</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Best price guarantee</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Instant policy issuance</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Scalable API platform</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Package className="w-4 h-4" />
                        <span>For Aggregators</span>
                      </div>
                      <a
                        href="https://digiqt.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                          Explore API
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Why Insurance Section */}
            <Card className="p-6 border-l-4 border-l-green-500 bg-green-50/50">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Why Crop Insurance?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="font-medium">🌧️ Weather Protection</p>
                  <p className="text-muted-foreground">Coverage against drought, flood, cyclone, and unseasonal rainfall.</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">💰 Financial Security</p>
                  <p className="text-muted-foreground">Protect your investment and ensure stable income even in bad seasons.</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">🏛️ Government Support</p>
                  <p className="text-muted-foreground">PMFBY subsidizes 95% of premium for small farmers (up to 2 hectares).</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">🚀 Fast Claims</p>
                  <p className="text-muted-foreground">Satellite and AI-based assessment ensures quick claim settlement.</p>
                </div>
              </div>
            </Card>

            {/* Insurance Comparison Table */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Quick Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-semibold">Feature</th>
                      <th className="text-center py-3 font-semibold text-green-600">GramCover</th>
                      <th className="text-center py-3 font-semibold text-orange-600">PMFBY</th>
                      <th className="text-center py-3 font-semibold text-blue-600">1Silverbullet</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3">Crop Coverage</td>
                      <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                      <td className="text-center"><Check className="w-5 h-5 text-orange-600 mx-auto" /></td>
                      <td className="text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Livestock Insurance</td>
                      <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                      <td className="text-center text-muted-foreground">-</td>
                      <td className="text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Mobile Enrollment</td>
                      <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                      <td className="text-center"><Check className="w-5 h-5 text-orange-600 mx-auto" /></td>
                      <td className="text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Govt Subsidy</td>
                      <td className="text-center text-muted-foreground">Partial</td>
                      <td className="text-center font-semibold text-orange-600">Up to 95%</td>
                      <td className="text-center text-muted-foreground">Varies</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium">Best For</td>
                      <td className="text-center text-xs px-2">Rural farmers</td>
                      <td className="text-center text-xs px-2">Low premium</td>
                      <td className="text-center text-xs px-2">Choice seekers</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      ) : activeTab === "buy" ? (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4" data-tour-id="market-search">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2" data-tour-id="market-categories">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="whitespace-nowrap"
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour-id="market-products">
            {loading ? (
              // Loading State
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">{t('loading')}</p>
              </div>
            ) : filteredCrops.length === 0 ? (
              // Empty State
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <Package className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noCrops')}</h3>
                <p className="text-muted-foreground">{t('noCropsSub')}</p>
              </div>
            ) : (
              // Crop Cards
              filteredCrops.map((crop, index) => {
                const priceChange = getPriceChange(crop);
                const hasImageError = imageError.has(crop.id);

                return (
                  <motion.div
                    key={crop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <Card
                      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => setSelectedCrop(crop)}
                    >
                      {/* Crop Image */}
                      <div className="relative h-48 bg-gradient-to-br from-green-50 to-green-100 overflow-hidden">
                        {!hasImageError ? (
                          <img
                            src={getImageSrc(crop)}
                            alt={crop.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={() => handleImageError(crop.id)}
                            key={`${crop.id}-${imageAttempts.get(crop.id) || 0}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Leaf className="w-20 h-20 text-green-600" />
                          </div>
                        )}

                        {/* Price Change Badge */}
                        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${priceChange.isPositive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                          }`}>
                          {priceChange.isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {priceChange.change}%
                        </div>
                      </div>

                      <div className="p-5">
                        {/* Badges */}
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {crop.organic && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                              {t('labels.organic')}
                            </span>
                          )}
                          {crop.brand && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                              {crop.brand}
                            </span>
                          )}
                        </div>

                        {/* Product Info */}
                        <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">
                          {getLocalizedName(crop.name)}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                          {crop.variety}
                        </p>

                        {/* Rating */}
                        {crop.rating && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium text-sm">{crop.rating.toFixed(1)}</span>
                            </div>
                            {crop.reviews && (
                              <span className="text-xs text-muted-foreground">({crop.reviews} {t('labels.reviews')})</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="line-clamp-1">{crop.district}, {crop.state}</span>
                        </div>

                        {/* Price Range */}
                        <div className="mb-4 p-2 bg-muted/50 rounded-lg">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{t('labels.min')}: ₹{crop.minPrice}</span>
                            <span>{t('labels.max')}: ₹{crop.maxPrice}</span>
                          </div>
                          <div className="h-1 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${((crop.price - crop.minPrice) / (crop.maxPrice - crop.minPrice)) * 100}%`
                              }}
                            />
                          </div>
                        </div>

                        {/* Price and Action */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-primary">
                              ₹{crop.price}
                            </span>
                            <span className="text-sm text-muted-foreground">/{crop.unit}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle add to cart
                            }}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {t('labels.buy')}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          {/* Sell Tab Content */}
          <Card className="p-6" data-tour-id="market-sell-listings">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">{t('listings.title')}</h2>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t('listings.addNew')}
              </Button>
            </div>

            {myListings.length > 0 ? (
              <div className="space-y-4">
                {myListings.map((listing) => (
                  <Card key={listing.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {listing.quantity} • ₹{listing.price}/kg
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Posted {Math.floor((Date.now() - listing.postedDate.getTime()) / 86400000)} days ago
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-600">Remove</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">{t('listings.empty')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('listings.emptySub')}
                </p>
                <Button>{t('listings.createFirst')}</Button>
              </div>
            )}
          </Card>

          {/* Selling Tips */}
          <Card className="p-6 border-l-4 border-l-primary">
            <h3 className="font-semibold mb-3">💡 {t('tips.title')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• {t('tips.photos')}</li>
              <li>• {t('tips.price')}</li>
              <li>• {t('tips.organic')}</li>
              <li>• {t('tips.respond')}</li>
            </ul>
          </Card>
        </>
      )}

      {/* Crop Detail Modal */}
      <Dialog open={!!selectedCrop} onOpenChange={() => setSelectedCrop(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCrop && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{getLocalizedName(selectedCrop.name)}</DialogTitle>
                <DialogDescription>{selectedCrop.variety}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Image */}
                <div className="relative h-64 bg-gradient-to-br from-green-50 to-green-100 rounded-lg overflow-hidden">
                  {!imageError.has(selectedCrop.id) ? (
                    <img
                      src={getImageSrc(selectedCrop)}
                      alt={selectedCrop.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(selectedCrop.id)}
                      key={`modal-${selectedCrop.id}-${imageAttempts.get(selectedCrop.id) || 0}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="w-24 h-24 text-green-600" />
                    </div>
                  )}
                </div>

                {/* Price Information */}
                <Card className="p-4 bg-primary/5">
                  <h3 className="font-semibold mb-3">{t('priceDetails')}</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('labels.minPrice')}</p>
                      <p className="text-lg font-bold text-red-600">₹{selectedCrop.minPrice}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('labels.modalPrice')}</p>
                      <p className="text-2xl font-bold text-primary">₹{selectedCrop.price}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('labels.maxPrice')}</p>
                      <p className="text-lg font-bold text-green-600">₹{selectedCrop.maxPrice}</p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    {t('labels.per')} {selectedCrop.unit}
                  </p>
                </Card>

                {/* Product Details */}
                {(selectedCrop.brand || selectedCrop.description || selectedCrop.rating) && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">{t('details')}</h3>
                    <div className="space-y-2">
                      {selectedCrop.brand && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{t('labels.brand')}:</span>
                          <span className="font-medium">{selectedCrop.brand}</span>
                        </div>
                      )}
                      {selectedCrop.rating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{t('labels.rating')}:</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{selectedCrop.rating.toFixed(1)}</span>
                            {selectedCrop.reviews && (
                              <span className="text-sm text-muted-foreground">({selectedCrop.reviews} {t('labels.reviews')})</span>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedCrop.description && (
                        <div>
                          <span className="text-sm text-muted-foreground">{t('labels.description')}:</span>
                          <p className="text-sm mt-1">{selectedCrop.description}</p>
                        </div>
                      )}
                      {selectedCrop.organic && (
                        <div className="pt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                            ✓ {t('labels.certifiedOrganic')}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Market Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Market Information</h3>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedCrop.market}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCrop.district}, {selectedCrop.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t('labels.arrivalDate')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedCrop.arrivalDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t('labels.category')}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {selectedCrop.category}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button className="flex-1" size="lg">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {t('labels.buyNow')}
                  </Button>
                  <Button variant="outline" size="lg">
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>

                {/* Additional Info */}
                <Card className="p-4 border-l-4 border-l-primary bg-primary/5">
                  <h4 className="font-semibold mb-2">💡 {t('insights.title')}</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• {t('insights.source')}</li>
                    <li>• {t('insights.update')}</li>
                    <li>• {t('insights.modal')}</li>
                    <li>• {t('insights.contact')}</li>
                  </ul>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

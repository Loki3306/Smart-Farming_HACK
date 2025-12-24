import React, { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [crops, setCrops] = useState<CropData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<CropData | null>(null);
  const [imageError, setImageError] = useState<Set<string>>(new Set());
  const [imageAttempts, setImageAttempts] = useState<Map<string, number>>(new Map());

  // Load crop data on mount
  useEffect(() => {
    loadCropData();
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

  const categories = [
    { id: "all", name: "All Items", icon: Package },
    { id: "seeds", name: "Seeds", icon: Leaf },
    { id: "fertilizers", name: "Fertilizers", icon: Package },
    { id: "pesticides", name: "Pesticides", icon: Package },
    { id: "equipment", name: "Equipment", icon: Package },
    { id: "produce", name: "Fresh Produce", icon: Leaf },
  ];

  const products: Product[] = [
    {
      id: "1",
      name: "Hybrid Rice Seeds (IR-64)",
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
      name: "Organic Neem Cake Fertilizer",
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
      name: "Bio-Pesticide (Neem Oil)",
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
      name: "Drip Irrigation Kit (1 Acre)",
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
      name: "Fresh Organic Tomatoes",
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
      name: "Wheat Seeds (HD-2967)",
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

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div data-tour-id="market-header">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-primary" />
          Farmer's Marketplace
        </h1>
        <p className="text-muted-foreground mt-1">
          Buy supplies and sell your produce directly to other farmers
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
          Buy Supplies
        </Button>
        <Button
          variant={activeTab === "sell" ? "default" : "outline"}
          onClick={() => setActiveTab("sell")}
          className="gap-2"
        >
          <Tag className="w-4 h-4" />
          Sell Produce
        </Button>
      </div>

      {activeTab === "buy" ? (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4" data-tour-id="market-search">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for seeds, fertilizers, equipment..."
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
                <p className="text-muted-foreground">Loading fresh crop prices...</p>
              </div>
            ) : filteredCrops.length === 0 ? (
              // Empty State
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <Package className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No crops found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
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
                        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                          priceChange.isPositive 
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
                              Organic
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
                          {crop.name}
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
                              <span className="text-xs text-muted-foreground">({crop.reviews} reviews)</span>
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
                            <span>Min: ₹{crop.minPrice}</span>
                            <span>Max: ₹{crop.maxPrice}</span>
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
                            Buy
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
              <h2 className="text-xl font-semibold">Your Listings</h2>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add New Listing
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
                <h3 className="font-semibold text-lg mb-2">No listings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start selling your produce to other farmers
                </p>
                <Button>Create Your First Listing</Button>
              </div>
            )}
          </Card>

          {/* Selling Tips */}
          <Card className="p-6 border-l-4 border-l-primary">
            <h3 className="font-semibold mb-3">💡 Tips for Selling</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Add clear photos of your produce</li>
              <li>• Set competitive prices based on market rates</li>
              <li>• Mention if your produce is organic or certified</li>
              <li>• Respond quickly to buyer inquiries</li>
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
                <DialogTitle className="text-2xl">{selectedCrop.name}</DialogTitle>
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
                  <h3 className="font-semibold mb-3">Price Details</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Minimum</p>
                      <p className="text-lg font-bold text-red-600">₹{selectedCrop.minPrice}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Modal Price</p>
                      <p className="text-2xl font-bold text-primary">₹{selectedCrop.price}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Maximum</p>
                      <p className="text-lg font-bold text-green-600">₹{selectedCrop.maxPrice}</p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    Per {selectedCrop.unit}
                  </p>
                </Card>

                {/* Product Details */}
                {(selectedCrop.brand || selectedCrop.description || selectedCrop.rating) && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Product Details</h3>
                    <div className="space-y-2">
                      {selectedCrop.brand && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Brand:</span>
                          <span className="font-medium">{selectedCrop.brand}</span>
                        </div>
                      )}
                      {selectedCrop.rating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{selectedCrop.rating.toFixed(1)}</span>
                            {selectedCrop.reviews && (
                              <span className="text-sm text-muted-foreground">({selectedCrop.reviews} reviews)</span>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedCrop.description && (
                        <div>
                          <span className="text-sm text-muted-foreground">Description:</span>
                          <p className="text-sm mt-1">{selectedCrop.description}</p>
                        </div>
                      )}
                      {selectedCrop.organic && (
                        <div className="pt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                            ✓ Certified Organic
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
                      <p className="font-medium">Arrival Date</p>
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
                      <p className="font-medium">Category</p>
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
                    Buy Now
                  </Button>
                  <Button variant="outline" size="lg">
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>

                {/* Additional Info */}
                <Card className="p-4 border-l-4 border-l-primary bg-primary/5">
                  <h4 className="font-semibold mb-2">💡 Market Insights</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Price data sourced from Government of India API</li>
                    <li>• Prices are updated daily based on market arrivals</li>
                    <li>• Modal price represents the most common trading price</li>
                    <li>• Contact local mandis for bulk purchases</li>
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

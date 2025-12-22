import React, { useState } from "react";
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-primary" />
          Farmer's Marketplace
        </h1>
        <p className="text-muted-foreground mt-1">
          Buy supplies and sell your produce directly to other farmers
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for seeds, fertilizers, equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Product Image */}
                    <div className="text-6xl text-center mb-4">{product.image}</div>
                    
                    {/* Badges */}
                    <div className="flex gap-2 mb-3">
                      {product.organic && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Organic
                        </span>
                      )}
                      {!product.inStock && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{product.seller}</p>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      {product.location}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{product.rating}</span>
                      <span className="text-muted-foreground">({product.reviews} reviews)</span>
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary">₹{product.price}</span>
                        <span className="text-muted-foreground">/{product.unit}</span>
                      </div>
                      <Button size="sm" disabled={!product.inStock}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Sell Tab Content */}
          <Card className="p-6">
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
    </div>
  );
};

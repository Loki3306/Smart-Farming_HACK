import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Leaf, IndianRupee, TrendingUp, Package, Sparkles, Zap, MapPin, Store } from "lucide-react";
import { motion } from "framer-motion";

interface ProductRecommendation {
    product_id: string;
    product_name: string;
    manufacturer: string;
    npk_ratio: string;
    product_type: string;
    target_nutrient: string;
    quantity: number;
    quantity_text: string;
    unit_type: string;
    price_per_unit: number;
    total_cost: number;
    nutrients_provided: {
        N: number;
        P: number;
        K: number;
    };
    cost_per_kg_nutrient: number;
    efficiency_score: number;
}

interface ProductRecommendationCardProps {
    product: ProductRecommendation;
    farmSize: number;
    onViewInMarketplace?: () => void;
    onFindDealers?: () => void;
}

export const ProductRecommendationCard: React.FC<ProductRecommendationCardProps> = ({
    product,
    farmSize,
    onViewInMarketplace,
    onFindDealers
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Determine gradient based on product type - BUT KEEPING IT GREEN-THEMED
    const getCardStyle = () => {
        // All cards use green/earth tones but with different accent shades
        switch (product.product_type) {
            case 'nano':
                return "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-emerald-200/50";
            case 'organic':
                return "bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-950/40 dark:to-lime-950/30 border-green-200/50";
            default: // chemical
                return "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/30 border-teal-200/50";
        }
    };

    // New texture pattern for the card background
    const textureStyle = {
        backgroundImage: `radial-gradient(circle at 10% 20%, rgba(34, 197, 94, 0.03) 0%, rgba(34, 197, 94, 0) 20%),
                          radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.03) 0%, rgba(16, 185, 129, 0) 20%),
                          url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2310b981' fill-opacity='0.03' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 8px 10px -6px rgba(16, 185, 129, 0.1)" }}
            transition={{ duration: 0.3 }}
            className="h-full"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <Card className={`h-full overflow-hidden shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 transition-all duration-300 relative group border-2 ${getCardStyle()}`} style={textureStyle}>

                {/* Efficiency Badge - Enhanced Green */}
                <div className="absolute top-0 right-0 z-20">
                    <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-md flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{product.efficiency_score}% Score</span>
                    </div>
                </div>

                <CardHeader className="pb-2 relative z-10 pt-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            {/* Product Badge */}
                            <Badge variant="outline" className={`mb-2 capitalize border-emerald-200 text-emerald-800 bg-emerald-50/80`}>
                                {product.product_type} Technology
                            </Badge>

                            <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-900 via-green-800 to-teal-800 dark:from-emerald-100 dark:to-teal-200">
                                {product.product_name}
                            </CardTitle>

                            <div className="flex items-center gap-2 text-sm text-emerald-700/80 dark:text-emerald-300/80 font-medium">
                                <Package className="w-4 h-4" />
                                <span>by {product.manufacturer}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5 relative z-10">
                    {/* Nutrient Highlight Box - Green Themed */}
                    <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm relative overflow-hidden group-hover:border-emerald-200 transition-colors">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Recommended For</p>
                                <div className="flex items-center gap-2">
                                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-1.5 rounded-full">
                                        <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <span className="font-bold text-emerald-900 dark:text-emerald-100">{product.target_nutrient}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold px-2 py-1">
                                    {product.npk_ratio}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Quantity & Numbers - Minimalist Green */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/40 dark:bg-black/20 p-3 rounded-lg border border-emerald-100/50">
                            <p className="text-xs text-muted-foreground mb-1">Quantity Needed</p>
                            <p className="font-bold text-lg text-emerald-900 dark:text-emerald-100 flex items-baseline">
                                {product.quantity}
                                <span className="text-xs font-normal ml-1 text-emerald-700">{product.unit_type}s</span>
                            </p>
                            <p className="text-xs text-emerald-600/80 mt-1">{product.quantity_text}</p>
                        </div>

                        <div className="bg-white/40 dark:bg-black/20 p-3 rounded-lg border border-emerald-100/50">
                            <p className="text-xs text-muted-foreground mb-1">Nutrients Provided</p>
                            <div className="flex gap-1.5 mt-1">
                                {product.nutrients_provided.N > 0 && (
                                    <div className="grid place-items-center">
                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center border border-emerald-200">N</span>
                                        <span className="text-[10px] font-bold mt-0.5">{product.nutrients_provided.N}</span>
                                    </div>
                                )}
                                {product.nutrients_provided.P > 0 && (
                                    <div className="grid place-items-center">
                                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center border border-green-200">P</span>
                                        <span className="text-[10px] font-bold mt-0.5">{product.nutrients_provided.P}</span>
                                    </div>
                                )}
                                {product.nutrients_provided.K > 0 && (
                                    <div className="grid place-items-center">
                                        <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center border border-teal-200">K</span>
                                        <span className="text-[10px] font-bold mt-0.5">{product.nutrients_provided.K}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pricing - Clean and Bold Green */}
                    <div className="flex items-center justify-between py-2 border-t border-dashed border-emerald-200 dark:border-emerald-800">
                        <div>
                            <p className="text-xs text-muted-foreground">Est. Total Cost</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-green-600">
                                    ₹{product.total_cost.toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground">approx.</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Price per {product.unit_type}</p>
                            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">₹{product.price_per_unit}</span>
                        </div>
                    </div>

                    {/* REAL MARKET INFORMATION - Green Themed */}
                    <div className="space-y-3 pt-2">
                        {/* Where to Buy - Dealer Information (Simplified Green) */}
                        <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm relative overflow-hidden">
                            {/* Subtle texture overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'6\\' height=\\'6\\' viewBox=\\'0 0 6 6\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23000\\' fill-opacity=\\'1\\' fill-rule=\\'evenodd\\'%3E%3Cpath d=\\'M5 0h1L0 6V5zM6 5v1H5z\\'/%3E%3C/g%3E%3C/svg%3E')" }}></div>

                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <div className="flex items-center gap-2">
                                    <Store className="w-5 h-5 text-emerald-600" />
                                    <h4 className="font-bold text-sm text-emerald-900 uppercase">Nearest Dealers</h4>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 rounded-full border border-emerald-200">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-bold text-emerald-800">In Stock</span>
                                </div>
                            </div>

                            <div className="space-y-2.5 relative z-10">
                                <div className="flex items-center justify-between text-sm group/dealer cursor-pointer hover:bg-emerald-50/50 p-1 -mx-1 rounded transition-colors">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-500 group-hover/dealer:text-emerald-600" />
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Kisan Seva Kendra</span>
                                    </div>
                                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">2.3 km</span>
                                </div>
                                <div className="flex items-center justify-between text-sm group/dealer cursor-pointer hover:bg-emerald-50/50 p-1 -mx-1 rounded transition-colors">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-500 group-hover/dealer:text-emerald-600" />
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Agro Center</span>
                                    </div>
                                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">3.7 km</span>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full mt-2 text-xs h-8 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                    onClick={onFindDealers}
                                >
                                    <MapPin className="w-3 h-3 mr-1" />
                                    View All Nearby Dealers
                                </Button>
                            </div>
                        </div>

                        {/* Info Strips - Green Themed */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Subsidy Strip */}
                            {(product.product_type === 'nano' || product.manufacturer === 'IFFCO') && (
                                <div className="bg-lime-50 dark:bg-lime-900/10 p-2 rounded-lg border border-lime-100 dark:border-lime-900/30 flex flex-col justify-center">
                                    <p className="text-[10px] text-lime-700 uppercase font-bold mb-0.5 flex items-center gap-1">
                                        <span>🏛️</span> Subsidy
                                    </p>
                                    <p className="text-xs font-semibold text-lime-900">30% Off (DBT)</p>
                                </div>
                            )}

                            {/* Manufacturer Contact */}
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-center">
                                <p className="text-[10px] text-emerald-700 uppercase font-bold mb-0.5 flex items-center gap-1">
                                    <span>📞</span> Support
                                </p>
                                <p className="text-xs font-semibold text-emerald-900">1800-103-1967</p>
                            </div>
                        </div>

                        {/* Special Features Badges - Clean & Green */}
                        {product.product_type === 'nano' && (
                            <motion.div
                                className="relative overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 p-2 rounded-lg text-white shadow-sm mt-3"
                                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                style={{ backgroundSize: '200% 200%' }}
                            >
                                <div className="flex items-center gap-2 justify-center">
                                    <Sparkles className="w-4 h-4 animate-pulse" />
                                    <span className="text-xs font-bold text-center">NANO TECH: Better Absorption �</span>
                                </div>
                            </motion.div>
                        )}
                        {product.product_type === 'organic' && (
                            <div className="bg-gradient-to-r from-green-600 to-lime-600 p-2 rounded-lg text-white shadow-sm mt-3">
                                <div className="flex items-center gap-2 justify-center">
                                    <Leaf className="w-4 h-4" />
                                    <span className="text-xs font-bold text-center">100% ORGANIC CERTIFIED 🌱</span>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

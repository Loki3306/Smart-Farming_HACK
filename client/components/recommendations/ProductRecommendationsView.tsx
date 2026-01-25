import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
    Leaf,
    ShoppingCart,
    TrendingUp,
    Download,
    Sparkles,
    PackageSearch
} from "lucide-react";
import { SoilAnalysisReport } from "@/components/recommendations/SoilAnalysisReport";
import { ProductRecommendationCard } from "@/components/recommendations/ProductRecommendationCard";
import { generateShoppingListPDF } from "@/utils/pdfGenerator";

interface ProductWithMarketplace {
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

interface ProductRecommendationsViewProps {
    soilData: {
        N: number;
        P: number;
        K: number;
        pH?: number;
        moisture?: number;
    };
    cropType: string;
    farmSize: number;
    farmerId: string;
}

export const ProductRecommendationsView: React.FC<ProductRecommendationsViewProps> = (props) => {
    const { soilData, cropType, farmSize, farmerId } = props;
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<any>(null);

    // Generate product recommendations (MOCK MODE for instant demo)
    const handleGenerateRecommendations = async () => {
        setLoading(true);

        // Simulate network delay for realistic experience
        setTimeout(() => {
            const mockData = {
                report_id: "mock_report_123",
                soil_analysis: soilData,
                crop_type: cropType,
                farm_size_hectares: farmSize,
                nutrient_gaps: {
                    N: 40,
                    P: 15,
                    K: 20
                },
                total_nutrients_needed: {
                    N: 40 * farmSize,
                    P: 15 * farmSize,
                    K: 20 * farmSize
                },
                recommended_products: [
                    {
                        product_id: "iffco-nano-urea-1",
                        product_name: "IFFCO Nano Urea",
                        manufacturer: "IFFCO",
                        npk_ratio: "Nano N",
                        product_type: "nano",
                        target_nutrient: "Nitrogen (N)",
                        quantity: Math.ceil(4 * farmSize),
                        quantity_text: `${Math.ceil(4 * farmSize)} bottles`,
                        unit_type: "bottle",
                        price_per_unit: 225.00,
                        total_cost: 225.00 * Math.ceil(4 * farmSize),
                        nutrients_provided: { N: 40, P: 0, K: 0 },
                        cost_per_kg_nutrient: 22.50,
                        efficiency_score: 95
                    },
                    {
                        product_id: "coromandel-dap-1",
                        product_name: "Coromandel Gromor DAP",
                        manufacturer: "Coromandel",
                        npk_ratio: "18-46-0",
                        product_type: "chemical",
                        target_nutrient: "Phosphorus (P)",
                        quantity: Math.ceil(2 * farmSize),
                        quantity_text: `${Math.ceil(2 * farmSize)} bags`,
                        unit_type: "bag",
                        price_per_unit: 1350.00,
                        total_cost: 1350.00 * Math.ceil(2 * farmSize),
                        nutrients_provided: { N: 18, P: 46, K: 0 },
                        cost_per_kg_nutrient: 29.35,
                        efficiency_score: 88
                    },
                    {
                        product_id: "iffco-npk-1",
                        product_name: "IFFCO NPK 10-26-26",
                        manufacturer: "IFFCO",
                        npk_ratio: "10-26-26",
                        product_type: "chemical",
                        target_nutrient: "Potassium (K)",
                        quantity: Math.ceil(1 * farmSize),
                        quantity_text: `${Math.ceil(1 * farmSize)} bags`,
                        unit_type: "bag",
                        price_per_unit: 1720.00,
                        total_cost: 1720.00 * Math.ceil(1 * farmSize),
                        nutrients_provided: { N: 10, P: 26, K: 26 },
                        cost_per_kg_nutrient: 33.00,
                        efficiency_score: 85
                    },
                    {
                        product_id: "organic-compost-1",
                        product_name: "Coromandel Organic Compost",
                        manufacturer: "Coromandel",
                        npk_ratio: "2-1-2",
                        product_type: "organic",
                        target_nutrient: "Soil Health",
                        quantity: Math.ceil(10 * farmSize),
                        quantity_text: `${Math.ceil(10 * farmSize)} bags`,
                        unit_type: "bag",
                        price_per_unit: 450.00,
                        total_cost: 450.00 * Math.ceil(10 * farmSize),
                        nutrients_provided: { N: 2, P: 1, K: 2 },
                        cost_per_kg_nutrient: 90.00,
                        efficiency_score: 75
                    }
                ],
                total_estimated_cost: (225 * 4 + 1350 * 2 + 1720 + 450 * 10) * farmSize,
                estimated_yield_improvement_percent: 25.0,
                summary: "Based on your soil analysis, we recommend a combination of IFFCO Nano Urea for cost-effective nitrogen and Coromandel DAP for phosphorus requirements. Adding organic compost will improve long-term soil health.",
                generated_at: new Date().toISOString()
            };

            setRecommendations(mockData);
            setLoading(false);

            toast({
                title: "✅ Recommendations Generated",
                description: `Found ${mockData.recommended_products.length} products for your farm needs.`
            });
        }, 1500);
    };

    // Navigate to marketplace with product filter
    const handleViewInMarketplace = (product: ProductWithMarketplace) => {
        // Store product details in sessionStorage for marketplace to pick up
        sessionStorage.setItem('marketplace_filter', JSON.stringify({
            product_id: product.product_id,
            product_name: product.product_name,
            manufacturer: product.manufacturer,
            from: 'recommendations'
        }));

        toast({
            title: "Opening Marketplace",
            description: `Viewing ${product.product_name} in marketplace...`
        });

        navigate('/marketplace');
    };

    // Find dealers for specific product
    const handleFindDealers = (product: ProductWithMarketplace) => {
        toast({
            title: "Finding Dealers",
            description: `Searching for dealers near you selling ${product.product_name}...`,
        });

        // TODO: Implement dealer finder
        // For now, navigate to marketplace
        handleViewInMarketplace(product);
    };

    // Download PDF report
    const handleDownloadPDF = () => {
        if (!recommendations) return;

        generateShoppingListPDF({
            farmerName: 'Farmer', // Can be fetched from user context
            farmSize,
            cropType,
            soilData,
            nutrientGaps: recommendations.nutrient_gaps,
            products: recommendations.recommended_products,
            totalCost: recommendations.total_estimated_cost,
            yieldImprovement: recommendations.estimated_yield_improvement_percent,
            generatedAt: new Date()
        });

        toast({
            title: "📄 PDF Downloaded",
            description: "Your shopping list has been downloaded successfully."
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-2 border-primary/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <PackageSearch className="w-7 h-7 text-primary" />
                                Product Recommendations
                            </CardTitle>
                            <p className="text-muted-foreground mt-2">
                                Get personalized fertilizer recommendations with real market products and pricing
                            </p>
                        </div>
                        {!recommendations && (
                            <Button
                                size="lg"
                                onClick={handleGenerateRecommendations}
                                disabled={loading}
                                className="gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                {loading ? "Analyzing..." : "Generate Recommendations"}
                            </Button>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Loading State */}
            {loading && (
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            <p className="text-muted-foreground">Analyzing your soil and matching products...</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations Result */}
            {recommendations && !loading && (
                <Tabs defaultValue="products" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="soil-analysis" className="gap-2">
                            <Leaf className="w-4 h-4" />
                            Soil Analysis
                        </TabsTrigger>
                        <TabsTrigger value="products" className="gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Recommended Products ({recommendations.recommended_products.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Soil Analysis Tab */}
                    <TabsContent value="soil-analysis" className="mt-6">
                        <SoilAnalysisReport
                            soilData={soilData}
                            nutrientGaps={recommendations.nutrient_gaps}
                            cropType={cropType}
                            farmSize={farmSize}
                            totalCost={recommendations.total_estimated_cost}
                            yieldImprovement={recommendations.estimated_yield_improvement_percent}
                            onDownloadPDF={handleDownloadPDF}
                        />
                    </TabsContent>

                    {/* Products Tab */}
                    <TabsContent value="products" className="mt-6">
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Products Found</p>
                                            <p className="text-2xl font-bold text-primary">
                                                {recommendations.recommended_products.length}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Investment</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                ₹{recommendations.total_estimated_cost.toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Expected Improvement</p>
                                            <p className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                                                <TrendingUp className="w-5 h-5" />
                                                {recommendations.estimated_yield_improvement_percent}%
                                            </p>
                                        </div>
                                        <div className="flex items-end">
                                            <Button onClick={handleDownloadPDF} variant="outline" className="w-full">
                                                <Download className="w-4 h-4 mr-2" />
                                                Download Shopping List
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Product Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {recommendations.recommended_products.map((product: ProductWithMarketplace, index: number) => (
                                    <ProductRecommendationCard
                                        key={product.product_id || index}
                                        product={product}
                                        farmSize={farmSize}
                                        onViewInMarketplace={() => handleViewInMarketplace(product)}
                                        onFindDealers={() => handleFindDealers(product)}
                                    />
                                ))}
                            </div>

                            {/* Why These Products */}
                            <Card className="border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <CardTitle className="text-lg">💡 Why These Products?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {recommendations.summary}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-400 mb-1">✓ Real Prices</p>
                                            <p className="text-xs text-muted-foreground">
                                                Official prices from IFFCO & Coromandel (Jan 2025)
                                            </p>
                                        </div>
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <p className="text-xs font-semibold text-green-900 dark:text-green-400 mb-1">✓ Efficiency Ranked</p>
                                            <p className="text-xs text-muted-foreground">
                                                Products sorted by cost per kg of nutrient
                                            </p>
                                        </div>
                                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <p className="text-xs font-semibold text-purple-900 dark:text-purple-400 mb-1">✓ Multiple Options</p>
                                            <p className="text-xs text-muted-foreground">
                                                Chemical, Organic, and Nano-tech alternatives
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* CTA to Marketplace */}
                            <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                                <CardContent className="py-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg mb-1">
                                                Ready to Purchase?
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                View all products in our marketplace with pricing, dealers, and delivery options
                                            </p>
                                        </div>
                                        <Button
                                            size="lg"
                                            onClick={() => navigate('/marketplace')}
                                            className="gap-2"
                                        >
                                            <ShoppingCart className="w-5 h-5" />
                                            Open Marketplace
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            )}

            {/* Empty State */}
            {!recommendations && !loading && (
                <Card className="border-dashed border-2">
                    <CardContent className="py-16">
                        <div className="flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <PackageSearch className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xl mb-2">
                                    Get Personalized Product Recommendations
                                </h3>
                                <p className="text-muted-foreground max-w-md">
                                    Our AI will analyze your soil data and recommend the best fertilizer products
                                    from real manufacturers (IFFCO, Coromandel) with actual market prices.
                                </p>
                            </div>
                            <Button
                                size="lg"
                                onClick={handleGenerateRecommendations}
                                className="gap-2 mt-4"
                            >
                                <Sparkles className="w-5 h-5" />
                                Generate Recommendations Now
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

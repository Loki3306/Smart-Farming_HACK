/**
 * INTEGRATION EXAMPLE: How to use IndianMarketplace Component
 * 
 * This file shows 3 examples of how to integrate the marketplace
 * into your existing application:
 * 1. In Recommendations page
 * 2. In Marketplace page
 * 3. As a standalone widget
 */

// ============================================================================
// EXAMPLE 1: Integration in Recommendations Page
// ============================================================================

import React, { useState, useEffect } from 'react';
import { IndianMarketplace } from '@/components/IndianMarketplace';

export const RecommendationsWithMarketplace: React.FC = () => {
  const [recommendation, setRecommendation] = useState<any>(null);
  const [location, setLocation] = useState('Maharashtra');

  // Your existing recommendation fetching code...
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    // Your API call here
    // const data = await api.getRecommendations(farmId)
    // setRecommendation(data)
  };

  return (
    <div className="space-y-8">
      {/* Existing Recommendation Display */}
      <div className="recommendation-section">
        {/* Your existing recommendation cards */}
      </div>

      {/* NEW: Add Marketplace Below Recommendations */}
      {recommendation && (
        <IndianMarketplace
          recommendation={recommendation.fertilizer_type} // e.g., "Urea 30% Nitrogen"
          category="fertilizer"
          location={location}
        />
      )}

      {/* More recommendations for other categories */}
      {recommendation && (
        <IndianMarketplace
          recommendation={recommendation.crop_recommendation} // e.g., "Cotton Hybrid Seeds"
          category="seed"
          location={location}
        />
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 2: Integration in Marketplace Page (Tab-based)
// ============================================================================

export const MarketplacePageWithRecommendations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'recommendation'>('general');
  const [recommendations, setRecommendations] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'general'
              ? 'border-b-2 border-green-600'
              : 'text-gray-600'
          }`}
        >
          🛒 सामान्य बाजार
        </button>
        <button
          onClick={() => setActiveTab('recommendation')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'recommendation'
              ? 'border-b-2 border-green-600'
              : 'text-gray-600'
          }`}
        >
          💡 मेरी सिफारिशें
        </button>
      </div>

      {/* General Marketplace Tab */}
      {activeTab === 'general' && (
        <div className="general-marketplace">
          {/* Your existing marketplace content */}
        </div>
      )}

      {/* Recommendation-based Marketplace Tab */}
      {activeTab === 'recommendation' && recommendations && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">
            आपकी खेत के अनुसार सुझाए गए उत्पाद
          </h2>

          {/* Fertilizer Recommendations */}
          {recommendations.fertilizer && (
            <div>
              <h3 className="text-lg font-semibold mb-4">肥料</h3>
              <IndianMarketplace
                recommendation={recommendations.fertilizer}
                category="fertilizer"
              />
            </div>
          )}

          {/* Seed Recommendations */}
          {recommendations.crop && (
            <div>
              <h3 className="text-lg font-semibold mb-4">बीज</h3>
              <IndianMarketplace
                recommendation={recommendations.crop}
                category="seed"
              />
            </div>
          )}

          {/* Tool Recommendations */}
          {recommendations.tool && (
            <div>
              <h3 className="text-lg font-semibold mb-4">उपकरण</h3>
              <IndianMarketplace
                recommendation={recommendations.tool}
                category="tool"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 3: Standalone Widget Component
// ============================================================================

interface MarketplaceWidgetProps {
  farmerId: string;
  recommendation: string;
  category: 'fertilizer' | 'seed' | 'tool' | 'pesticide' | 'irrigation';
  onProductSelected?: (product: any) => void;
  compact?: boolean;
}

export const MarketplaceWidget: React.FC<MarketplaceWidgetProps> = ({
  farmerId,
  recommendation,
  category,
  onProductSelected,
  compact = false,
}) => {
  return (
    <div className={compact ? 'max-w-md' : ''}>
      <IndianMarketplace
        recommendation={recommendation}
        category={category}
      />
    </div>
  );
};

// ============================================================================
// EXAMPLE 4: Usage in Irrigation Planner Page
// ============================================================================

export const IrrigationPlannerWithMarketplace: React.FC = () => {
  const [irrigationRecommendation, setIrrigationRecommendation] = useState('');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Existing Irrigation Plan */}
      <div className="lg:col-span-2">
        {/* Your irrigation planning UI */}
      </div>

      {/* New: Marketplace for Irrigation Products */}
      <div className="lg:col-span-1">
        <IndianMarketplace
          recommendation={irrigationRecommendation}
          category="irrigation"
        />
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 5: Modal-based Product Selection
// ============================================================================

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const MarketplaceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  recommendation: string;
  category: 'fertilizer' | 'seed' | 'tool' | 'pesticide' | 'irrigation';
}> = ({ isOpen, onClose, recommendation, category }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>खेत के लिए अनुशंसित उत्पाद खरीदें</DialogTitle>
        </DialogHeader>
        <IndianMarketplace
          recommendation={recommendation}
          category={category}
        />
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// EXAMPLE 6: Real-World Integration in Recommendations Component
// ============================================================================

import { useFarmContext } from '@/context/FarmContext';
import { apiNotificationService } from '@/services/apiNotificationService';

export const FullRecommendationsPage: React.FC = () => {
  const { sensorData } = useFarmContext();
  const [recommendations, setRecommendations] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    'fertilizer' | 'seed' | 'tool' | 'pesticide' | 'irrigation' | null
  >(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Your existing recommendation API call
        const data = await apiNotificationService.getRecommendations();
        setRecommendations(data);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      }
    };

    fetchRecommendations();
  }, []);

  const categoryMap: Record<
    string,
    'fertilizer' | 'seed' | 'tool' | 'pesticide' | 'irrigation'
  > = {
    fertilizer: 'fertilizer',
    crop: 'seed',
    tool: 'tool',
    pest: 'pesticide',
    irrigation: 'irrigation',
  };

  return (
    <div className="space-y-12">
      {/* Existing Recommendations */}
      <section>
        <h2 className="text-3xl font-bold mb-6">
          🧠 AI-संचालित सिफारिशें
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations &&
            Object.entries(recommendations).map(([key, value]) => (
              <div key={key} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600 mb-4">{value.description}</p>
                <button
                  onClick={() => setSelectedCategory(categoryMap[key])}
                  className="text-green-600 font-semibold hover:underline"
                >
                  → बाजार में देखें
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* Marketplace for Selected Category */}
      {selectedCategory && recommendations && (
        <section>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← वापस जाएं
          </button>
          <IndianMarketplace
            recommendation={
              recommendations[
                Object.keys(categoryMap).find(
                  (k) => categoryMap[k] === selectedCategory
                ) || ''
              ]?.title || ''
            }
            category={selectedCategory}
          />
        </section>
      )}
    </div>
  );
};

// ============================================================================
// USAGE NOTES:
// ============================================================================

/**
 * 1. IMPORT:
 *    import { IndianMarketplace } from '@/components/IndianMarketplace';
 *
 * 2. MINIMAL USAGE:
 *    <IndianMarketplace 
 *      recommendation="Urea 30% Nitrogen"
 *      category="fertilizer"
 *    />
 *
 * 3. WITH LOCATION:
 *    <IndianMarketplace 
 *      recommendation="Urea 30% Nitrogen"
 *      category="fertilizer"
 *      location="Maharashtra"
 *    />
 *
 * 4. PROPS:
 *    - recommendation: string (ML recommendation text)
 *    - category: 'fertilizer' | 'seed' | 'tool' | 'pesticide' | 'irrigation'
 *    - location: Optional string (farmer's location)
 *
 * 5. NO ML INTEGRATION NEEDED:
 *    - Just pass the recommendation text as displayed
 *    - Component handles scraping independently
 *    - ML is never called or modified
 *
 * 6. ERROR HANDLING:
 *    - Component shows error messages if scraping fails
 *    - Shows loading state while searching
 *    - Gracefully handles empty results
 */

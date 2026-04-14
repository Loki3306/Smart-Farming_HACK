/**
 * Indian Marketplace Service
 * Handles all marketplace-related API calls
 * Completely independent from ML recommendation system
 */

export interface MarketplaceProduct {
  name: string;
  price: number;
  rating: number;
  image: string;
  url: string;
  seller: string;
  currency: string;
}

export interface MarketplaceSearchResponse {
  status: string;
  recommendation_used: string;
  category: string;
  location: string | null;
  products: MarketplaceProduct[];
  source: 'cache' | 'fresh';
  total_found: number;
  currency: string;
  scrape_time: string | null;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  icon: string;
  price_range_inr: string;
}

export interface MarketplaceSeller {
  id: string;
  name: string;
  logo: string;
  url: string;
  coverage: string;
  specialty?: string;
}

class IndianMarketplaceService {
  // Use /python-api proxy (Vite proxies this to http://localhost:8000)
  private baseUrl: string = '/python-api';

  /**
   * Search for products based on ML recommendation
   * This is the main entry point - takes recommendation text and category
   * ML system is NOT involved after this point
   */
  async searchProducts(
    recommendation: string,
    category:
      | 'fertilizer'
      | 'seed'
      | 'tool'
      | 'pesticide'
      | 'irrigation',
    location?: string
  ): Promise<MarketplaceSearchResponse> {
    try {
      const params = new URLSearchParams({
        recommendation: recommendation,
        category: category,
      });

      if (location) {
        params.append('location', location);
      }

      const response = await fetch(
        `${this.baseUrl}/api/marketplace/search?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Marketplace search failed: ${response.statusText}`
        );
      }

      const data: MarketplaceSearchResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Marketplace search error:', error);
      throw error;
    }
  }

  /**
   * Get available product categories
   */
  async getCategories(): Promise<MarketplaceCategory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/marketplace/categories`);

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      return data.categories;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  }

  /**
   * Get available sellers
   */
  async getSellers(): Promise<MarketplaceSeller[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/marketplace/sellers`);

      if (!response.ok) {
        throw new Error('Failed to fetch sellers');
      }

      const data = await response.json();
      return data.sellers;
    } catch (error) {
      console.error('Failed to fetch sellers:', error);
      throw error;
    }
  }

  /**
   * Health check for marketplace service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/marketplace/health`);
      const data = await response.json();
      console.log('Marketplace health:', data);
      return data.status === 'healthy';
    } catch (error) {
      console.error('Marketplace health check failed:', error);
      return false;
    }
  }

  /**
   * Extract recommendation text from ML recommendation object
   * Helper function to format recommendation for marketplace search
   */
  formatRecommendationForMarketplace(mlRecommendation: any): string {
    // Handle different recommendation formats
    if (typeof mlRecommendation === 'string') {
      return mlRecommendation;
    }

    if (mlRecommendation?.name) {
      return mlRecommendation.name;
    }

    if (mlRecommendation?.product_name) {
      return mlRecommendation.product_name;
    }

    return JSON.stringify(mlRecommendation);
  }

  /**
   * Get search history
   */
  getSearchHistory(): string[] {
    try {
      const history = localStorage.getItem('marketplace_search_history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save search to history
   */
  saveSearchToHistory(recommendation: string, category: string): void {
    try {
      const history = this.getSearchHistory();
      const search = `${recommendation} (${category})`;

      // Add to history if not already there
      if (!history.includes(search)) {
        history.unshift(search);
        // Keep only last 10 searches
        history.splice(10);
        localStorage.setItem('marketplace_search_history', JSON.stringify(history));
      }
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    localStorage.removeItem('marketplace_search_history');
  }
}

// Export singleton instance
export const marketplaceService = new IndianMarketplaceService();

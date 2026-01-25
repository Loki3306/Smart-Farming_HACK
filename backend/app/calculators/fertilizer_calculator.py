"""
Fertilizer Quantity Calculator
Calculates precise fertilizer quantities based on nutrient requirements
"""

import math
from typing import Dict, Optional
from decimal import Decimal, ROUND_UP


class FertilizerCalculator:
    """Calculate fertilizer quantities and costs"""
    
    @staticmethod
    def calculate_bags_needed(
        nutrient_needed_kg: float,
        nutrient_percent: float,
        bag_size_kg: float
    ) -> Dict[str, float]:
        """
        Calculate how many bags of fertilizer are needed
        
        Args:
            nutrient_needed_kg: Total nutrient required (e.g., 80 kg N)
            nutrient_percent: Nutrient percentage in fertilizer (e.g., 46 for urea)
            bag_size_kg: Size of one bag in kg (e.g., 45 kg)
        
        Returns:
            Dict with bags needed, total product kg, nutrients provided, excess
        
        Example:
            Need 80 kg N, Using Urea (46% N), Bag = 45 kg
            Pure N per bag = 45 × 0.46 = 20.7 kg
            Bags needed = 80 / 20.7 = 3.86 ≈ 4 bags (rounded up)
        """
        if nutrient_percent == 0 or bag_size_kg == 0:
            return {
                "bags": 0,
                "total_product_kg": 0,
                "nutrients_provided": 0,
                "excess_kg": 0,
                "excess_percent": 0
            }
        
        # Calculate pure nutrient per bag
        pure_nutrient_per_bag = bag_size_kg * (nutrient_percent / 100)
        
        # Calculate bags needed (round up to avoid shortage)
        bags_needed = math.ceil(nutrient_needed_kg / pure_nutrient_per_bag)
        
        # Calculate totals
        total_product_kg = bags_needed * bag_size_kg
        nutrients_provided = bags_needed * pure_nutrient_per_bag
        excess_kg = nutrients_provided - nutrient_needed_kg
        excess_percent = (excess_kg / nutrient_needed_kg * 100) if nutrient_needed_kg > 0 else 0
        
        return {
            "bags": bags_needed,
            "total_product_kg": round(total_product_kg, 2),
            "nutrients_provided": round(nutrients_provided, 2),
            "excess_kg": round(excess_kg, 2),
            "excess_percent": round(excess_percent, 1)
        }
    
    @staticmethod
    def calculate_bottles_needed(
        nutrient_needed_kg: float,
        nutrient_equivalent_kg_per_bottle: float
    ) -> Dict[str, float]:
        """
        Calculate bottles needed for nano fertilizers
        
        Args:
            nutrient_needed_kg: Total nutrient required
            nutrient_equivalent_kg_per_bottle: Nutrient equivalent per bottle
        
        Returns:
            Dict with bottles needed and nutrients provided
        """
        if nutrient_equivalent_kg_per_bottle == 0:
            return {
                "bottles": 0,
                "nutrients_provided": 0,
                "excess_kg": 0
            }
        
        bottles_needed = math.ceil(nutrient_needed_kg / nutrient_equivalent_kg_per_bottle)
        nutrients_provided = bottles_needed * nutrient_equivalent_kg_per_bottle
        excess_kg = nutrients_provided - nutrient_needed_kg
        
        return {
            "bottles": bottles_needed,
            "nutrients_provided": round(nutrients_provided, 2),
            "excess_kg": round(excess_kg, 2)
        }
    
    @staticmethod
    def calculate_total_cost(
        quantity: int,
        price_per_unit: float
    ) -> float:
        """Calculate total cost"""
        return round(quantity * price_per_unit, 2)
    
    @staticmethod
    def calculate_cost_per_kg_nutrient(
        total_cost: float,
        nutrients_provided: float
    ) -> float:
        """Calculate cost efficiency (₹ per kg of nutrient)"""
        if nutrients_provided == 0:
            return 0
        return round(total_cost / nutrients_provided, 2)
    
    @staticmethod
    def calculate_roi_estimate(
        total_cost: float,
        yield_improvement_percent: float,
        expected_yield_kg: float,
        market_price_per_kg: float
    ) -> Dict[str, float]:
        """
        Calculate estimated return on investment
        
        Args:
            total_cost: Total fertilizer cost
            yield_improvement_percent: Expected yield increase (e.g., 15%)
            expected_yield_kg: Expected base yield
            market_price_per_kg: Market price of crop
        
        Returns:
            Dict with additional revenue, net profit, ROI percentage
        """
        additional_yield_kg = expected_yield_kg * (yield_improvement_percent / 100)
        additional_revenue = additional_yield_kg * market_price_per_kg
        net_profit = additional_revenue - total_cost
        roi_percent = (net_profit / total_cost * 100) if total_cost > 0 else 0
        
        return {
            "additional_yield_kg": round(additional_yield_kg, 2),
            "additional_revenue": round(additional_revenue, 2),
            "net_profit": round(net_profit, 2),
            "roi_percent": round(roi_percent, 1)
        }


# Optimal NPK levels for different crops (kg/ha)
CROP_OPTIMAL_NPK = {
    "wheat": {"N": 120, "P": 60, "K": 40},
    "rice": {"N": 100, "P": 50, "K": 50},
    "corn": {"N": 150, "P": 60, "K": 60},
    "maize": {"N": 150, "P": 60, "K": 60},
    "tomato": {"N": 100, "P": 80, "K": 120},
    "potato": {"N": 125, "P": 100, "K": 150},
    "cotton": {"N": 120, "P": 60, "K": 60},
    "sugarcane": {"N": 150, "P": 80, "K": 100},
    "soybean": {"N": 40, "P": 60, "K": 40},  # Less N (nitrogen-fixing)
    "groundnut": {"N": 25, "P": 60, "K": 60},
    "chili": {"N": 100, "P": 60, "K": 60},
    "onion": {"N": 100, "P": 50, "K": 100},
    "default": {"N": 100, "P": 50, "K": 50}  # Fallback
}


def get_optimal_npk_for_crop(crop_type: str) -> Dict[str, int]:
    """Get optimal NPK levels for a crop"""
    crop_lower = crop_type.lower().strip()
    return CROP_OPTIMAL_NPK.get(crop_lower, CROP_OPTIMAL_NPK["default"])

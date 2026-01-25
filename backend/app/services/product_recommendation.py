"""
Product Recommendation Service
AI engine to match fertilizer products to soil deficiencies
"""

from typing import Dict, List, Optional, Any
import asyncpg
from decimal import Decimal

from app.calculators.fertilizer_calculator import (
    FertilizerCalculator,
    get_optimal_npk_for_crop
)


class ProductRecommendationEngine:
    """Generate product recommendations based on soil analysis"""
    
    def __init__(self, db_connection):
        self.db = db_connection
        self.calculator = FertilizerCalculator()
    
    async def generate_recommendations(
        self,
        soil_data: Dict[str, float],
        crop_type: str,
        farm_size_hectares: float,
        budget_preference: str = "balanced"  # 'budget', 'balanced', 'premium'
    ) -> Dict[str, Any]:
        """
        Generate product recommendations
        
        Args:
            soil_data: Current NPK levels {"N": 60, "P": 45, "K": 40, "pH": 6.8}
            crop_type: Type of crop being grown
            farm_size_hectares: Farm size in hectares
            budget_preference: Budget category
        
        Returns:
            Complete recommendation report with products, costs, ROI
        """
        
        # Step 1: Calculate nutrient gaps
        nutrient_gaps = self._calculate_nutrient_gaps(soil_data, crop_type)
        
        # Step 2: Calculate total nutrients needed (gap × farm size)
        total_nutrients_needed = {
            nutrient: gap * farm_size_hectares
            for nutrient, gap in nutrient_gaps.items()
        }
        
        # Step 3: Query available products
        products = await self._get_available_products()
        
        # Step 4: Match products to needs
        recommendations = await self._match_products_to_needs(
            total_nutrients_needed,
            products,
            farm_size_hectares,
            budget_preference
        )
        
        # Step 5: Calculate totals and ROI
        total_cost = sum(r["total_cost"] for r in recommendations)
        
        report = {
            "soil_analysis": soil_data,
            "crop_type": crop_type,
            "farm_size_hectares": farm_size_hectares,
            "nutrient_gaps": nutrient_gaps,
            "total_nutrients_needed": total_nutrients_needed,
            "recommended_products": recommendations,
            "total_estimated_cost": total_cost,
            "estimated_yield_improvement_percent": self._estimate_yield_improvement(nutrient_gaps),
            "summary": self._generate_summary(nutrient_gaps, recommendations, total_cost)
        }
        
        return report
    
    def _calculate_nutrient_gaps(
        self,
        current_npk: Dict[str, float],
        crop_type: str
    ) -> Dict[str, float]:
        """
        Calculate nutrient deficiencies
        
        Example:
            Current: {N: 60, P: 45, K: 40}
            Optimal (wheat): {N: 120, P: 60, K: 40}
            Gap: {N: 60, P: 15, K: 0}
        """
        optimal_npk = get_optimal_npk_for_crop(crop_type)
        
        gaps = {}
        for nutrient in ["N", "P", "K"]:
            current = current_npk.get(nutrient, 0)
            optimal = optimal_npk.get(nutrient, 0)
            gap = max(0, optimal - current)  # Only positive gaps (deficiencies)
            gaps[nutrient] = round(gap, 2)
        
        return gaps
    
    async def _get_available_products(self) -> List[Dict]:
        """Query database for available products"""
        query = """
            SELECT 
                id, product_name, manufacturer, npk_ratio,
                nitrogen_percent, phosphorus_percent, potassium_percent,
                bag_size_kg, bottle_size_ml, price_per_unit, unit_type,
                product_type, n_equivalent_kg, p_equivalent_kg, k_equivalent_kg,
                special_features
            FROM fertilizer_products
            WHERE is_available = true
            ORDER BY price_per_unit ASC
        """
        
        rows = await self.db.fetch(query)
        return [dict(row) for row in rows]
    
    async def _match_products_to_needs(
        self,
        total_needs: Dict[str, float],
        products: List[Dict],
        farm_size: float,
        budget_pref: str
    ) -> List[Dict]:
        """
        Match products to nutrient needs and rank by efficiency
        """
        recommendations = []
        
        # Nitrogen recommendations
        if total_needs["N"] > 0:
            n_products = self._find_nitrogen_products(products, total_needs["N"], budget_pref)
            recommendations.extend(n_products[:3])  # Top 3 options
        
        # Phosphorus recommendations
        if total_needs["P"] > 0:
            p_products = self._find_phosphorus_products(products, total_needs["P"], budget_pref)
            recommendations.extend(p_products[:2])  # Top 2 options
        
        # Potassium recommendations
        if total_needs["K"] > 0:
            k_products = self._find_potassium_products(products, total_needs["K"], budget_pref)
            recommendations.extend(k_products[:2])  # Top 2 options
        
        # Remove duplicates and sort by efficiency
        recommendations = self._deduplicate_and_rank(recommendations)
        
        return recommendations[:5]  # Return top 5 overall
    
    def _find_nitrogen_products(
        self,
        products: List[Dict],
        n_needed_kg: float,
        budget_pref: str
    ) -> List[Dict]:
        """Find products that provide nitrogen"""
        options = []
        
        for product in products:
            n_percent = float(product.get("nitrogen_percent") or 0)
            n_equiv = product.get("n_equivalent_kg")  # For nano products
            
            if n_percent > 0 or n_equiv:
                if product["unit_type"] == "bottle" and n_equiv:
                    # Nano product
                    calc = self.calculator.calculate_bottles_needed(n_needed_kg, float(n_equiv))
                    quantity = calc["bottles"]
                    nutrients_provided = calc["nutrients_provided"]
                    unit_text = f"{quantity} bottles"
                else:
                    # Regular bag product
                    calc = self.calculator.calculate_bags_needed(
                        n_needed_kg,
                        n_percent,
                        float(product.get("bag_size_kg") or 0)
                    )
                    quantity = calc["bags"]
                    nutrients_provided = calc["nutrients_provided"]
                    unit_text = f"{quantity} bags"
                
                if quantity > 0:
                    total_cost = self.calculator.calculate_total_cost(
                        quantity,
                        float(product["price_per_unit"])
                    )
                    
                    cost_per_kg = self.calculator.calculate_cost_per_kg_nutrient(
                        total_cost,
                        nutrients_provided
                    )
                    
                    options.append({
                        "product_id": str(product["id"]),
                        "product_name": product["product_name"],
                        "manufacturer": product["manufacturer"],
                        "npk_ratio": product["npk_ratio"],
                        "product_type": product["product_type"],
                        "target_nutrient": "Nitrogen (N)",
                        "quantity": quantity,
                        "quantity_text": unit_text,
                        "unit_type": product["unit_type"],
                        "price_per_unit": float(product["price_per_unit"]),
                        "total_cost": total_cost,
                        "nutrients_provided": {
                            "N": nutrients_provided,
                            "P": 0,
                            "K": 0
                        },
                        "cost_per_kg_nutrient": cost_per_kg,
                        "efficiency_score": self._calculate_efficiency_score(
                            cost_per_kg,
                            product["product_type"],
                            budget_pref
                        )
                    })
        
        # Sort by efficiency score
        return sorted(options, key=lambda x: x["efficiency_score"], reverse=True)
    
    def _find_phosphorus_products(
        self,
        products: List[Dict],
        p_needed_kg: float,
        budget_pref: str
    ) -> List[Dict]:
        """Find products that provide phosphorus (similar to nitrogen)"""
        options = []
        
        for product in products:
            p_percent = float(product.get("phosphorus_percent") or 0)
            p_equiv = product.get("p_equivalent_kg")
            
            if p_percent > 0 or p_equiv:
                if product["unit_type"] == "bottle" and p_equiv:
                    calc = self.calculator.calculate_bottles_needed(p_needed_kg, float(p_equiv))
                    quantity = calc["bottles"]
                    nutrients_provided = calc["nutrients_provided"]
                    unit_text = f"{quantity} bottles"
                else:
                    calc = self.calculator.calculate_bags_needed(
                        p_needed_kg,
                        p_percent,
                        float(product.get("bag_size_kg") or 0)
                    )
                    quantity = calc["bags"]
                    nutrients_provided = calc["nutrients_provided"]
                    unit_text = f"{quantity} bags"
                
                if quantity > 0:
                    total_cost = self.calculator.calculate_total_cost(
                        quantity,
                        float(product["price_per_unit"])
                    )
                    
                    cost_per_kg = self.calculator.calculate_cost_per_kg_nutrient(
                        total_cost,
                        nutrients_provided
                    )
                    
                    options.append({
                        "product_id": str(product["id"]),
                        "product_name": product["product_name"],
                        "manufacturer": product["manufacturer"],
                        "npk_ratio": product["npk_ratio"],
                        "product_type": product["product_type"],
                        "target_nutrient": "Phosphorus (P)",
                        "quantity": quantity,
                        "quantity_text": unit_text,
                        "unit_type": product["unit_type"],
                        "price_per_unit": float(product["price_per_unit"]),
                        "total_cost": total_cost,
                        "nutrients_provided": {
                            "N": 0,
                            "P": nutrients_provided,
                            "K": 0
                        },
                        "cost_per_kg_nutrient": cost_per_kg,
                        "efficiency_score": self._calculate_efficiency_score(
                            cost_per_kg,
                            product["product_type"],
                            budget_pref
                        )
                    })
        
        return sorted(options, key=lambda x: x["efficiency_score"], reverse=True)
    
    def _find_potassium_products(
        self,
        products: List[Dict],
        k_needed_kg: float,
        budget_pref: str
    ) -> List[Dict]:
        """Find products that provide potassium (similar to nitrogen/phosphorus)"""
        options = []
        
        for product in products:
            k_percent = float(product.get("potassium_percent") or 0)
            k_equiv = product.get("k_equivalent_kg")
            
            if k_percent > 0 or k_equiv:
                if product["unit_type"] == "bottle" and k_equiv:
                    calc = self.calculator.calculate_bottles_needed(k_needed_kg, float(k_equiv))
                    quantity = calc["bottles"]
                    nutrients_provided = calc["nutrients_provided"]
                    unit_text = f"{quantity} bottles"
                else:
                    calc = self.calculator.calculate_bags_needed(
                        k_needed_kg,
                        k_percent,
                        float(product.get("bag_size_kg") or 0)
                    )
                    quantity = calc["bags"]
                    nutrients_provided = calc["nutrients_provided"]
                    unit_text = f"{quantity} bags"
                
                if quantity > 0:
                    total_cost = self.calculator.calculate_total_cost(
                        quantity,
                        float(product["price_per_unit"])
                    )
                    
                    cost_per_kg = self.calculator.calculate_cost_per_kg_nutrient(
                        total_cost,
                        nutrients_provided
                    )
                    
                    options.append({
                        "product_id": str(product["id"]),
                        "product_name": product["product_name"],
                        "manufacturer": product["manufacturer"],
                        "npk_ratio": product["npk_ratio"],
                        "product_type": product["product_type"],
                        "target_nutrient": "Potassium (K)",
                        "quantity": quantity,
                        "quantity_text": unit_text,
                        "unit_type": product["unit_type"],
                        "price_per_unit": float(product["price_per_unit"]),
                        "total_cost": total_cost,
                        "nutrients_provided": {
                            "N": 0,
                            "P": 0,
                            "K": nutrients_provided
                        },
                        "cost_per_kg_nutrient": cost_per_kg,
                        "efficiency_score": self._calculate_efficiency_score(
                            cost_per_kg,
                            product["product_type"],
                            budget_pref
                        )
                    })
        
        return sorted(options, key=lambda x: x["efficiency_score"], reverse=True)
    
    def _calculate_efficiency_score(
        self,
        cost_per_kg: float,
        product_type: str,
        budget_pref: str
    ) -> float:
        """
        Calculate efficiency score (higher is better)
        Considers cost and product type preferences
        """
        # Base score: inverse of cost (cheaper = higher score)
        base_score = 100 / (cost_per_kg + 1)  # +1 to avoid division by zero
        
        # Product type multipliers
        type_multipliers = {
            "budget": {"chemical": 1.2, "organic": 1.0, "nano": 0.8, "bio": 0.9},
            "balanced": {"chemical": 1.0, "organic": 1.1, "nano": 1.0, "bio": 1.0},
            "premium": {"chemical": 0.9, "organic": 1.2, "nano": 1.3, "bio": 1.2}
        }
        
        multiplier = type_multipliers.get(budget_pref, {}).get(product_type, 1.0)
        
        return round(base_score * multiplier, 2)
    
    def _deduplicate_and_rank(self, recommendations: List[Dict]) -> List[Dict]:
        """Remove duplicate products and rank by efficiency"""
        seen_products = set()
        unique_recs = []
        
        for rec in recommendations:
            product_id = rec["product_id"]
            if product_id not in seen_products:
                seen_products.add(product_id)
                unique_recs.append(rec)
        
        # Sort by efficiency score (highest first)
        return sorted(unique_recs, key=lambda x: x["efficiency_score"], reverse=True)
    
    def _estimate_yield_improvement(self, nutrient_gaps: Dict[str, float]) -> float:
        """
        Estimate yield improvement percentage based on nutrient gaps filled
        Simplified model: larger gaps = more improvement potential
        """
        avg_gap = sum(nutrient_gaps.values()) / len(nutrient_gaps)
        
        # Rough estimates:
        # 0-20 kg/ha gap: 5-10% improvement
        # 20-50 kg/ha gap: 10-20% improvement
        # 50+ kg/ha gap: 20-30% improvement
        
        if avg_gap < 20:
            return round(5 + (avg_gap / 20) * 5, 1)
        elif avg_gap < 50:
            return round(10 + ((avg_gap - 20) / 30) * 10, 1)
        else:
            return round(min(30, 20 + ((avg_gap - 50) / 50) * 10), 1)
    
    def _generate_summary(
        self,
        nutrient_gaps: Dict[str, float],
        recommendations: List[Dict],
        total_cost: float
    ) -> str:
        """Generate human-readable summary"""
        gaps_text = []
        for nutrient, gap in nutrient_gaps.items():
            if gap > 0:
                gaps_text.append(f"{nutrient}: {gap} kg/ha")
        
        if not gaps_text:
            return "Your soil nutrients are optimal. No additional fertilizers needed."
        
        gap_summary = ", ".join(gaps_text)
        product_count = len(recommendations)
        
        return f"Your soil needs: {gap_summary}. We recommend {product_count} products with a total cost of ₹{total_cost:.2f}."

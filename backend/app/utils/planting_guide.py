"""
Planting Guide Generator
Creates visual and textual planting guides for farmers
"""

from typing import Dict, List
import math


class PlantingGuideGenerator:
    """Generate planting guides with visual diagrams and instructions"""
    
    def calculate_field_layout(
        self,
        farm_size_hectares: float,
        row_spacing_cm: float,
        plant_spacing_cm: float
    ) -> Dict:
        """
        Calculate how many rows and plants needed for a farm
        
        Args:
            farm_size_hectares: Farm size in hectares
            row_spacing_cm: Distance between rows
            plant_spacing_cm: Distance between plants in a row
        
        Returns:
            Dictionary with layout calculations
        """
        # Convert hectares to square meters
        area_sqm = farm_size_hectares * 10000
        
        # Assume square field for simplicity
        side_length_m = math.sqrt(area_sqm)
        side_length_cm = side_length_m * 100
        
        # Calculate number of rows
        rows_count = int(side_length_cm / row_spacing_cm)
        
        # Calculate plants per row
        plants_per_row = int(side_length_cm / plant_spacing_cm)
        
        # Total plants
        total_plants = rows_count * plants_per_row
        
        # Plants per hectare
        plants_per_hectare = int(total_plants / farm_size_hectares)
        
        return {
            "farm_size_hectares": farm_size_hectares,
            "farm_area_sqm": area_sqm,
            "field_dimension_m": round(side_length_m, 2),
            "rows_count": rows_count,
            "plants_per_row": plants_per_row,
            "total_plants": total_plants,
            "plants_per_hectare": plants_per_hectare,
            "row_spacing_cm": row_spacing_cm,
            "plant_spacing_cm": plant_spacing_cm
        }
    
    def calculate_seed_requirement(
        self,
        crop_type: str,
        total_plants: int
    ) -> Dict:
        """
        Calculate seed/seedling requirements
        
        Returns:
            Seed quantity needed
        """
        # Seed requirements per 1000 plants (with 10% buffer)
        seed_data = {
            'rice': {'seeds_per_1000_plants': 25, 'unit': 'kg', 'buffer': 1.1},
            'wheat': {'seeds_per_1000_plants': 40, 'unit': 'kg', 'buffer': 1.1},
            'maize': {'seeds_per_1000_plants': 15, 'unit': 'kg', 'buffer': 1.1},
            'cotton': {'seeds_per_1000_plants': 5, 'unit': 'kg', 'buffer': 1.1},
            'soybean': {'seeds_per_1000_plants': 60, 'unit': 'kg', 'buffer': 1.1},
            'tomato': {'seeds_per_1000_plants': 200, 'unit': 'g', 'buffer': 1.2},
            'potato': {'seeds_per_1000_plants': 60, 'unit': 'kg (tubers)', 'buffer': 1.15},
            'onion': {'seeds_per_1000_plants': 15, 'unit': 'kg (sets)', 'buffer': 1.15}
        }
        
        crop_lower = crop_type.lower()
        if crop_lower not in seed_data:
            return {"error": f"Seed data not available for {crop_type}"}
        
        data = seed_data[crop_lower]
        seed_per_1000 = data['seeds_per_1000_plants']
        buffer = data['buffer']
        
        # Calculate requirement
        seed_needed = (total_plants / 1000) * seed_per_1000 * buffer
        
        return {
            "crop_type": crop_type,
            "total_plants": total_plants,
            "seed_required": round(seed_needed, 2),
            "unit": data['unit'],
            "includes_buffer": f"{int((buffer - 1) * 100)}% extra"
        }
    
    def generate_tools_list(
        self,
        row_spacing_cm: float,
        plant_spacing_cm: float,
        farm_equipment: str = 'manual'
    ) -> List[str]:
        """
        Generate list of tools needed for planting
        
        Returns:
            List of required tools
        """
        tools = []
        
        if farm_equipment == 'manual':
            tools = [
                f"📏 Measuring rope/tape marked every {row_spacing_cm} cm",
                f"📏 Measuring stick marked every {plant_spacing_cm} cm",
                "🧵 String or rope to mark straight rows",
                "🪵 Wooden stakes (4 per field for corner marking)",
                "🌱 Planting stick or dibber for making holes",
                "📋 Notebook to track progress",
                "⚖️ Scale for measuring seeds"
            ]
        elif farm_equipment == 'tractor':
            tools = [
                f"🚜 Tractor with seed drill set to {row_spacing_cm} cm spacing",
                "📏 Measuring tape for verification",
                "🧵 Marker flags for field boundaries",
                "⚖️ Seed hopper calibration cups"
            ]
        elif farm_equipment == 'transplanter':
            tools = [
                f"🚜 Mechanical transplanter set to {row_spacing_cm} × {plant_spacing_cm} cm",
                "🌱 Seedling trays (standard size)",
                "📏 Spacing verification rod",
                "💧 Water supply for field puddling (rice)"
            ]
        else:
            tools = [
                f"📏 Measuring tools ({row_spacing_cm} cm spacing)",
                "🌱 Basic planting equipment"
            ]
        
        return tools
    
    def generate_step_by_step_guide(
        self,
        crop_type: str,
        layout: Dict,
        seed_req: Dict,
        tools: List[str]
    ) -> Dict:
        """
        Generate complete step-by-step planting guide
        
        Returns:
            Comprehensive planting instructions
        """
        row_spacing = layout['row_spacing_cm']
        plant_spacing = layout['plant_spacing_cm']
        
        steps = [
            {
                "step": 1,
                "title": "Field Preparation",
                "instructions": [
                    f"Clear the field of weeds and debris",
                    f"Level the field for uniform water distribution",
                    f"Mark field corners with stakes",
                    f"Total area to prepare: {layout['field_dimension_m']} m × {layout['field_dimension_m']} m"
                ]
            },
            {
                "step": 2,
                "title": "Mark First Row",
                "instructions": [
                    f"Using your measuring rope marked at {row_spacing} cm intervals",
                    "Start from one corner of the field",
                    "Pull string tight across the field",
                    "Mark the first row line with stakes and string"
                ]
            },
            {
                "step": 3,
                "title": "Mark All Rows",
                "instructions": [
                    f"From the first row, measure {row_spacing} cm perpendicular",
                    f"Mark second row parallel to first",
                    f"Repeat until you have {layout['rows_count']} rows marked",
                    "Use string to keep rows perfectly straight"
                ]
            },
            {
                "step": 4,
                "title": "Plant Along Rows",
                "instructions": [
                    f"Starting at row beginning, make hole every {plant_spacing} cm",
                    f"Each row will have approximately {layout['plants_per_row']} plants",
                    f"Plant seeds/seedlings at marked positions",
                    "Maintain uniform depth (2-3 cm for most crops)"
                ]
            },
            {
                "step": 5,
                "title": "Seed Management",
                "instructions": [
                    f"Total seeds needed: {seed_req['seed_required']} {seed_req['unit']}",
                    f"This includes {seed_req['includes_buffer']} for germination failures",
                    "Keep seeds covered and dry until planting",
                    "Use seed treatment if recommended"
                ]
            },
            {
                "step": 6,
                "title": "Post-Planting Care",
                "instructions": [
                    "Water immediately after planting",
                    "Check spacing accuracy in first few rows",
                    "Adjust if needed before completing whole field",
                    f"Expected total plants: {layout['total_plants']:,}"
                ]
            }
        ]
        
        visualization = self._generate_ascii_diagram(row_spacing, plant_spacing)
        
        return {
            "crop_type": crop_type,
            "farm_layout": layout,
            "seed_requirements": seed_req,
            "tools_needed": tools,
            "planting_steps": steps,
            "visual_diagram": visualization,
            "estimated_time": self._estimate_planting_time(layout['total_plants']),
            "labor_required": self._estimate_labor(layout['farm_size_hectares'])
        }
    
    def _generate_ascii_diagram(
        self,
        row_spacing_cm: float,
        plant_spacing_cm: float
    ) -> str:
        """
        Generate ASCII diagram showing plant arrangement
        
        Returns:
            Text-based visual representation
        """
        diagram = f"""
╔════════════════════════════════════════════════════════╗
║           PLANTING PATTERN DIAGRAM                     ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║    ← {row_spacing_cm} cm →                                  ║
║                                                        ║
║    *   ·   ·   ·   *   ·   ·   ·   *  ←Row 1         ║
║    ↕ {plant_spacing_cm} cm                                  ║
║    *   ·   ·   ·   *   ·   ·   ·   *  ←Row 2         ║
║    ↕                                                   ║
║    *   ·   ·   ·   *   ·   ·   ·   *  ←Row 3         ║
║                                                        ║
║    * = Plant position                                  ║
║    · = Spacing markers                                 ║
║                                                        ║
║    Maintain uniform spacing for best results!         ║
╚════════════════════════════════════════════════════════╝
        """
        return diagram.strip()
    
    def _estimate_planting_time(self, total_plants: int) -> str:
        """Estimate time needed for planting"""
        # Assume 200 plants per hour for manual planting
        hours = total_plants / 200
        
        if hours < 1:
            return f"{int(hours * 60)} minutes"
        elif hours < 8:
            return f"{hours:.1f} hours"
        else:
            days = hours / 8
            return f"{days:.1f} days (8-hour workdays)"
    
    def _estimate_labor(self, farm_size_hectares: float) -> str:
        """Estimate labor requirement"""
        # 1 person can plant ~0.2 hectares per day
        person_days = farm_size_hectares / 0.2
        
        if person_days < 1:
            return "1 person for 1 day"
        elif person_days < 5:
            return f"1-2 people for {person_days:.1f} days"
        else:
            people = int(math.ceil(person_days / 3))
            return f"{people} people for 2-3 days"


# Global instance
planting_guide_generator = PlantingGuideGenerator()

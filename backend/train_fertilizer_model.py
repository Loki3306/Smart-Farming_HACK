"""
Training script for fertilizer recommendation model
Run this to train and save the ML models
"""

import sys
import logging
from pathlib import Path

from app.ml_models import get_fertilizer_recommender

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Train and save fertilizer recommendation models"""
    logger.info("🚀 Starting fertilizer recommendation model training...")
    
    try:
        # Get or create recommender instance
        recommender = get_fertilizer_recommender()
        
        # Train models (will load if already trained)
        if not recommender.is_trained:
            logger.info("Training new models from scratch...")
            recommender.train_and_save()
        else:
            logger.info("Models already loaded/trained")
        
        # Test the model with sample data
        logger.info("\n" + "="*60)
        logger.info("🧪 Testing model with sample scenarios...")
        logger.info("="*60)
        
        test_scenarios = [
            {
                "name": "High temperature, dry soil - Wheat",
                "temperature": 35,
                "humidity": 40,
                "moisture": 25,
                "soil_type": "Loamy",
                "crop_type": "Wheat"
            },
            {
                "name": "Optimal conditions - Paddy",
                "temperature": 28,
                "humidity": 70,
                "moisture": 60,
                "soil_type": "Clayey",
                "crop_type": "Paddy"
            },
            {
                "name": "Cotton cultivation - Black soil",
                "temperature": 32,
                "humidity": 55,
                "moisture": 45,
                "soil_type": "Black",
                "crop_type": "Cotton"
            },
            {
                "name": "Maize with nutrient deficiency",
                "temperature": 30,
                "humidity": 60,
                "moisture": 50,
                "soil_type": "Sandy",
                "crop_type": "Maize",
                "current_n": 5,
                "current_p": 8,
                "current_k": 100
            }
        ]
        
        for scenario in test_scenarios:
            logger.info(f"\n📋 Scenario: {scenario['name']}")
            logger.info(f"   Conditions: {scenario['temperature']}°C, {scenario['humidity']}% humidity, {scenario['moisture']}% moisture")
            logger.info(f"   Soil: {scenario['soil_type']}, Crop: {scenario['crop_type']}")
            
            try:
                recommendation = recommender.predict_fertilizer(
                    temperature=scenario['temperature'],
                    humidity=scenario['humidity'],
                    moisture=scenario['moisture'],
                    soil_type=scenario['soil_type'],
                    crop_type=scenario['crop_type'],
                    current_n=scenario.get('current_n', 0),
                    current_p=scenario.get('current_p', 0),
                    current_k=scenario.get('current_k', 0)
                )
                
                logger.info(f"\n   ✅ Recommendation:")
                logger.info(f"      Fertilizer: {recommendation['fertilizer_name']} (Confidence: {recommendation['confidence']:.2%})")
                logger.info(f"      NPK Required: N={recommendation['npk_requirements']['nitrogen']}, "
                          f"P={recommendation['npk_requirements']['phosphorous']}, "
                          f"K={recommendation['npk_requirements']['potassium']}")
                logger.info(f"      Application Rate: {recommendation['application_rate_kg_per_hectare']} kg/ha")
                logger.info(f"      Timing: {recommendation['timing']['urgency']} - {recommendation['timing']['recommended_time_of_day']}")
                logger.info(f"      Apply within: {recommendation['timing']['days_to_apply']} days")
                logger.info(f"      Note: {recommendation['timing']['note']}")
                
                if recommendation['alternatives']:
                    logger.info(f"\n      Alternative fertilizers:")
                    for alt in recommendation['alternatives'][:2]:
                        logger.info(f"        - {alt['name']} (Confidence: {alt['confidence']:.2%})")
                
            except Exception as e:
                logger.error(f"   ❌ Failed to get recommendation: {e}")
        
        logger.info("\n" + "="*60)
        logger.info("✅ Training and testing completed successfully!")
        logger.info("="*60)
        
        # Get crop-specific recommendations
        logger.info("\n📚 Crop-specific fertilizer guidelines:")
        for crop in ["Wheat", "Paddy", "Cotton", "Maize", "Sugarcane"]:
            guidelines = recommender.get_crop_specific_recommendations(crop)
            logger.info(f"\n{crop}:")
            logger.info(f"  Primary nutrients: {', '.join(guidelines['primary_nutrients'])}")
            logger.info(f"  Typical NPK: {guidelines['typical_npk']}")
            logger.info(f"  Frequency: {guidelines['frequency']}")
        
    except Exception as e:
        logger.error(f"❌ Error during training: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

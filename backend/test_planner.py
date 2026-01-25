import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

try:
    from app.utils.agronomy import agronomy_engine
    print("✅ Import successful")
    
    plan = agronomy_engine.generate_complete_season_plan(
        crop_type="wheat",
        seeding_date_str="2023-11-01",
        soil_type="loam",
        target_yield_tons_ha=4.0,
        farm_area_acres=10.0,
        current_ph=6.5
    )
    print("✅ Plan generation successful")
    print(list(plan.keys()))
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

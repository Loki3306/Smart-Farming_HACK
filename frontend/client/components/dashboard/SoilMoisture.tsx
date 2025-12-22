import React from "react";
import { Gauge } from "../ui/Gauge";
import { Card } from "@/components/ui/card";
import { useFarmContext } from "../../context/FarmContext";

export const SoilMoisture: React.FC = () => {
  const { sensorData } = useFarmContext();

  return (
    <Card glass className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Soil Condition
          </h3>
          <p className="text-sm text-muted-foreground">
            Real-time sensor readings from field A
          </p>
        </div>

        <div className="flex justify-center">
          <Gauge
            value={sensorData?.soilMoisture ?? 0}
            max={100}
            min={0}
            label="Soil Moisture"
            unit="%"
            size="md"
            color="emerald"
          />
        </div>

        {/* NPK Indicators */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/30 rounded-lg p-4 text-center backdrop-blur-sm border border-white/20">
            <div className="text-2xl font-bold text-primary">
              {sensorData?.npk.nitrogen ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Nitrogen</div>
            <div className="text-xs font-semibold text-foreground">mg/kg</div>
          </div>

          <div className="bg-white/30 rounded-lg p-4 text-center backdrop-blur-sm border border-white/20">
            <div className="text-2xl font-bold text-primary">
              {sensorData?.npk.phosphorus ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Phosphorus</div>
            <div className="text-xs font-semibold text-foreground">mg/kg</div>
          </div>

          <div className="bg-white/30 rounded-lg p-4 text-center backdrop-blur-sm border border-white/20">
            <div className="text-2xl font-bold text-primary">
              {sensorData?.npk.potassium ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Potassium</div>
            <div className="text-xs font-semibold text-foreground">mg/kg</div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-3 border-t border-border/30 pt-4">
          <div>
            <div className="text-sm text-muted-foreground">pH Level</div>
            <div className="text-xl font-semibold text-foreground">
              {sensorData?.pH.toFixed(1) ?? 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">EC</div>
            <div className="text-xl font-semibold text-foreground">
              {sensorData?.ec.toFixed(2) ?? 0}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

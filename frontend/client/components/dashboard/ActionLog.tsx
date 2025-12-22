import React from "react";
import { Droplet, Leaf, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useFarmContext } from "../../context/FarmContext";

export const ActionLog: React.FC = () => {
  const { actionLog } = useFarmContext();

  const getIcon = (type: string) => {
    switch (type) {
      case "irrigation":
        return <Droplet className="w-4 h-4 text-blue-500" />;
      case "fertilization":
        return <Leaf className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "irrigation":
        return "bg-blue-100 text-blue-700";
      case "fertilization":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card glass className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Action Log</h3>

        {actionLog.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No recent actions
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {actionLog.slice(0, 8).map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 bg-white/20 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/30 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">{getIcon(entry.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm">
                        {entry.action}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {entry.description}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${getTypeBadgeColor(
                        entry.type,
                      )}`}
                    >
                      {entry.type.charAt(0).toUpperCase() +
                        entry.type.slice(1).replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {entry.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

import React from "react";
import { Droplet, Leaf, Info, Clock, ClipboardList } from "lucide-react";
import { useFarmContext } from "../../context/FarmContext";
import { useTranslation } from "react-i18next";
import { getLocalizedDescription, getLocalizedAction } from "../../lib/logTranslator";

export const ActionLog: React.FC = () => {
  const { t } = useTranslation("dashboard");
  const { actionLog } = useFarmContext();

  const getIcon = (type: string) => {
    switch (type) {
      case "irrigation":
        return <Droplet className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      case "fertilization":
        return <Leaf className="w-4 h-4 text-green-500 dark:text-green-400" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getLocalizedType = (type: string) => {
    switch (type) {
      case "irrigation": return t("actionLog.types.irrigation");
      case "fertilization": return t("actionLog.types.fertilization");
      case "alert": return t("actionLog.types.alert");
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "irrigation":
        return {
          bg: "bg-blue-100/50 dark:bg-blue-800/30",
          border: "border-blue-200/50 dark:border-blue-700/40",
          badge: "bg-blue-200/60 dark:bg-blue-700/50 text-blue-700 dark:text-blue-300",
        };
      case "fertilization":
        return {
          bg: "bg-green-100/50 dark:bg-green-800/30",
          border: "border-green-200/50 dark:border-green-700/40",
          badge: "bg-green-200/60 dark:bg-green-700/50 text-green-700 dark:text-green-300",
        };
      case "info":
        return {
          bg: "bg-amber-100/30 dark:bg-amber-800/20",
          border: "border-amber-200/30 dark:border-amber-700/30",
          badge: "bg-amber-200/50 dark:bg-amber-700/40 text-amber-700 dark:text-amber-300",
        };
      default:
        return {
          bg: "bg-gray-100/30 dark:bg-gray-800/20",
          border: "border-gray-200/30 dark:border-gray-700/30",
          badge: "bg-gray-200/50 dark:bg-gray-700/40 text-gray-700 dark:text-gray-300",
        };
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/20 backdrop-blur-md border border-amber-200/50 dark:border-amber-700/30 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("actionLog.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("actionLog.subtitle")}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-200/50 dark:bg-amber-700/30 flex items-center justify-center">
          <ClipboardList className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      {actionLog.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100/50 dark:bg-amber-800/30 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-muted-foreground font-medium">{t("actionLog.noActions")}</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {t("actionLog.willAppear")}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {actionLog.slice(0, 8).map((entry, index) => {
            const styles = getTypeStyles(entry.type);
            return (
              <div
                key={entry.id}
                className={`relative flex items-start gap-3 p-4 rounded-xl ${styles.bg} border ${styles.border} backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
                style={{
                  animation: index === 0 ? 'fadeInSlide 0.3s ease-out' : undefined
                }}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/80 dark:bg-white/10 shadow-sm flex items-center justify-center">
                  {getIcon(entry.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-foreground text-sm">
                        {getLocalizedAction(entry.action, t)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {getLocalizedDescription(entry.description, t)}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${styles.badge}`}
                    >
                      {getLocalizedType(entry.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="w-3 h-3" />
                    {entry.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom animation styles */}
      <style>{`
@keyframes fadeInSlide {
          from {
    opacity: 0;
    transform: translateY(-10px);
  }
          to {
    opacity: 1;
    transform: translateY(0);
  }
}
`}</style>
    </div>
  );
};

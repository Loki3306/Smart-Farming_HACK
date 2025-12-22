import React, { useState } from "react";
import {
  Bell,
  AlertTriangle,
  CloudRain,
  Droplets,
  Bug,
  Sprout,
  Check,
  Trash2,
  Settings,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: "alert" | "weather" | "irrigation" | "pest" | "crop" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: "high" | "medium" | "low";
}

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "alert",
      title: "Critical: Low Soil Moisture",
      message: "Soil moisture in Field A has dropped below 20%. Immediate irrigation recommended.",
      timestamp: new Date(Date.now() - 1800000),
      read: false,
      priority: "high",
    },
    {
      id: "2",
      type: "weather",
      title: "Heavy Rain Expected",
      message: "Weather forecast predicts heavy rainfall tomorrow. Consider postponing pesticide application.",
      timestamp: new Date(Date.now() - 3600000),
      read: false,
      priority: "medium",
    },
    {
      id: "3",
      type: "pest",
      title: "Pest Alert: Aphid Activity",
      message: "Increased aphid activity detected in your area. Check your crops and consider preventive measures.",
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      priority: "medium",
    },
    {
      id: "4",
      type: "irrigation",
      title: "Irrigation Complete",
      message: "Scheduled irrigation for Field B has been completed successfully. 500 liters used.",
      timestamp: new Date(Date.now() - 14400000),
      read: true,
      priority: "low",
    },
    {
      id: "5",
      type: "crop",
      title: "Harvest Reminder",
      message: "Your wheat crop is approaching optimal harvest time. Check crop maturity in the next 7 days.",
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      priority: "medium",
    },
    {
      id: "6",
      type: "system",
      title: "Sensor Battery Low",
      message: "Sensor #2 battery is at 15%. Please replace or recharge soon.",
      timestamp: new Date(Date.now() - 172800000),
      read: true,
      priority: "low",
    },
  ]);

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="w-5 h-5" />;
      case "weather":
        return <CloudRain className="w-5 h-5" />;
      case "irrigation":
        return <Droplets className="w-5 h-5" />;
      case "pest":
        return <Bug className="w-5 h-5" />;
      case "crop":
        return <Sprout className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "alert":
        return "text-red-500 bg-red-100";
      case "weather":
        return "text-blue-500 bg-blue-100";
      case "irrigation":
        return "text-cyan-500 bg-cyan-100";
      case "pest":
        return "text-orange-500 bg-orange-100";
      case "crop":
        return "text-green-500 bg-green-100";
      default:
        return "text-gray-500 bg-gray-100";
    }
  };

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === "all" ? true : !n.read
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-sm bg-primary text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with alerts and important information
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead} className="gap-2">
            <Check className="w-4 h-4" />
            Mark All Read
          </Button>
          <Button variant="outline" onClick={clearAll} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "unread"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No notifications
              </h3>
              <p className="text-muted-foreground">
                {filter === "unread"
                  ? "You're all caught up!"
                  : "You don't have any notifications yet."}
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card
                  className={`p-4 transition-all hover:shadow-md ${
                    !notification.read ? "bg-primary/5 border-primary/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`p-2 rounded-full ${getTypeColor(notification.type)}`}
                    >
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-semibold ${
                                !notification.read ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <span
                              className={`w-2 h-2 rounded-full ${getPriorityColor(
                                notification.priority
                              )}`}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Notification Settings Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-foreground">Notification Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure which notifications you want to receive
              </p>
            </div>
          </div>
          <Button variant="outline">Configure</Button>
        </div>
      </Card>
    </div>
  );
};

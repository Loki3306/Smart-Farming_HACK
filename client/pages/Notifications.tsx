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
  MessageSquare,
  Heart,
  Share2,
  AtSign,
  UserPlus,
  Loader2,
  Lightbulb,
  FlaskConical,
  Leaf,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { ApiNotification } from "@/services/apiNotificationService";
import { playNotificationSound, vibrateDevice } from "@/services/NotificationService";
import { useSettings } from "@/context/SettingsContext";

// Sample notifications for when no sensor alerts exist
const sampleNotifications = [
  {
    id: "sample_1",
    type: "irrigation",
    title: "Irrigation System Ready",
    message: "Your irrigation system is connected and monitoring soil moisture levels.",
    timestamp: new Date(Date.now() - 3600000),
    read: true,
    priority: "low",
  },
  {
    id: "sample_2",
    type: "system",
    title: "Sensors Connected",
    message: "All farm sensors are online and transmitting data.",
    timestamp: new Date(Date.now() - 7200000),
    read: true,
    priority: "low",
  },
];

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Helper functions for recommendation cards
  const getRecommendationTypeIcon = (type: string) => {
    switch (type) {
      case "irrigation": return Droplets;
      case "fertilizer": return FlaskConical;
      case "pest": return Bug;
      case "crop": return Leaf;
      default: return Lightbulb;
    }
  };

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case "irrigation": return "text-blue-500 bg-blue-100";
      case "fertilizer": return "text-green-500 bg-green-100";
      case "pest": return "text-red-500 bg-red-100";
      case "crop": return "text-amber-500 bg-amber-100";
      case "stress_management": return "text-orange-500 bg-orange-100";
      case "soil_treatment": return "text-teal-500 bg-teal-100";
      default: return "text-purple-500 bg-purple-100";
    }
  };

  const getRecommendationPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-muted text-foreground";
    }
  };

  // Test notification function
  const testNotification = async () => {
    if (settings.notificationSound) {
      await playNotificationSound();
    }
    if (settings.vibration) {
      vibrateDevice();
    }
  };

  const getIcon = (type: ApiNotification["type"]) => {
    switch (type) {
      case "reaction":
        return <Heart className="w-5 h-5" />;
      case "comment":
        return <MessageSquare className="w-5 h-5" />;
      case "reply":
        return <MessageSquare className="w-5 h-5" />;
      case "mention":
        return <AtSign className="w-5 h-5" />;
      case "share":
        return <Share2 className="w-5 h-5" />;
      case "follow":
        return <UserPlus className="w-5 h-5" />;
      case "message":
        return <MessageSquare className="w-5 h-5" />;
      case "recommendation":
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: ApiNotification["type"]) => {
    switch (type) {
      case "reaction":
        return "text-red-500 bg-red-100";
      case "comment":
      case "reply":
        return "text-blue-500 bg-blue-100";
      case "mention":
        return "text-purple-500 bg-purple-100";
      case "share":
        return "text-green-500 bg-green-100";
      case "follow":
        return "text-orange-500 bg-orange-100";
      case "message":
        return "text-cyan-500 bg-cyan-100";
      case "recommendation":
        return "text-amber-500 bg-amber-100";
      default:
        return "text-muted-foreground bg-muted";
    }
  };
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getNotificationMessage = (notification: ApiNotification): string => {
    if (notification.message) return notification.message;

    switch (notification.type) {
      case 'reaction':
        return 'reacted to your post';
      case 'comment':
        return 'commented on your post';
      case 'reply':
        return 'replied to your comment';
      case 'mention':
        return 'mentioned you in a post';
      case 'share':
        return 'shared your post';
      case 'follow':
        return 'started following you';
      case 'message':
        return 'sent you a message';
      default:
        return 'interacted with you';
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread" && n.read) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4" data-tour-id="notif-header">
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
        <div className="flex gap-2" data-tour-id="notif-actions">
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
      <div className="flex items-center gap-4" data-tour-id="notif-filters">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "all"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "unread"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3" data-tour-id="notif-list">
        {isLoading ? (
          <Card className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading notifications...</p>
          </Card>
        ) : (
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
                    className={`p-4 transition-all hover:shadow-md cursor-pointer ${!notification.read ? "bg-primary/5 border-primary/20" : ""
                      }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
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
                          <div className="flex-1">
                            <h3
                              className={`font-semibold ${!notification.read ? "text-foreground" : "text-muted-foreground"
                                }`}
                            >
                              {notification.actor_name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {getNotificationMessage(notification)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTimeAgo(notification.created_at)}
                            </p>

                            {/* Render Recommendation Cards Inline */}
                            {notification.type === 'recommendation' &&
                              notification.data?.recommendations &&
                              Array.isArray(notification.data.recommendations) && (
                                <div className="mt-4 space-y-3">
                                  {notification.data.recommendations.map((rec: any, idx: number) => {
                                    const TypeIcon = getRecommendationTypeIcon(rec.type);
                                    const typeColor = getRecommendationTypeColor(rec.type);

                                    return (
                                      <Card key={rec.id || idx} className="p-4 bg-background/50 border-l-4 border-l-primary">
                                        <div className="flex items-start gap-3">
                                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                                            <TypeIcon className="w-5 h-5" />
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                              <h4 className="font-semibold text-foreground text-sm">{rec.title}</h4>
                                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRecommendationPriorityBadge(rec.priority)}`}>
                                                {rec.priority?.toUpperCase()}
                                              </span>
                                            </div>

                                            <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>

                                            <div className="flex items-center gap-4 text-xs">
                                              <div className="flex items-center gap-1 text-muted-foreground">
                                                <Sparkles className="w-3 h-3 text-primary" />
                                                <span>Confidence: {rec.confidence?.toFixed(1)}%</span>
                                              </div>
                                              <div className="text-primary font-medium">
                                                {rec.type?.replace('_', ' ')}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </Card>
                                    );
                                  })}
                                </div>
                              )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
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
        )}
      </div>

      {/* Notification Settings Card */}
      <Card className="p-6" data-tour-id="notif-settings">
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={testNotification}>
              🔊 Test Sound
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings')}>
              Configure
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

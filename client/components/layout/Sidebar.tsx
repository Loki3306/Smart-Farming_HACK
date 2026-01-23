import React, { useState } from "react";
import { NavLink, useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Tractor,
  CloudSun,
  Lightbulb,
  ShoppingCart,
  GraduationCap,
  Users,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Bug,
  User,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { ChatDialog } from "../chat/ChatDialog";
import { useNotifications } from "../../hooks/useNotifications";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Farm", icon: Tractor, path: "/farm" },
  { label: "Weather", icon: CloudSun, path: "/weather" },
  { label: "AI Recommendations", icon: Lightbulb, path: "/recommendations" },
  { label: "Farming Regimes", icon: Leaf, path: "/regimes" },
  { label: "Disease Detection", icon: Bug, path: "/disease" },
  { label: "Marketplace", icon: ShoppingCart, path: "/marketplace" },
  { label: "Learn", icon: GraduationCap, path: "/learn" },
  { label: "Community", icon: Users, path: "/community" },
];

const bottomNavItems: NavItem[] = [
  { label: "Notifications", icon: Bell, path: "/notifications" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [searchParams] = useSearchParams();

  // Check if messages should be opened from URL params
  React.useEffect(() => {
    const shouldOpenMessages = searchParams.get('openMessages') === 'true' ||
      searchParams.get('farmer_id') ||
      searchParams.get('expert_id') ||
      searchParams.get('conversation');

    if (shouldOpenMessages) {
      setIsChatOpen(true);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => (
    <NavLink
      to={item.path}
      onClick={() => setIsMobileOpen(false)}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-primary/10 hover:text-primary",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground",
          isCollapsed && "justify-center px-2"
        )
      }
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {!isCollapsed && (
        <>
          <span className="font-medium text-sm">{item.label}</span>
          {item.label === "Notifications" && unreadCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link
        to="/dashboard"
        className={cn(
          "flex items-center gap-3 px-4 py-6 border-b border-border cursor-pointer hover:scale-105 transition-transform",
          isCollapsed && "justify-center px-2"
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:rotate-12 transition-transform">
          <Leaf className="w-6 h-6 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="font-bold text-lg text-foreground">Krushi Unnati</h1>
            <p className="text-xs text-muted-foreground">AI-Powered Farming</p>
          </div>
        )}
      </Link>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" data-tour-id="sidebar-nav">
        {mainNavItems.map((item) => (
          <NavItemComponent key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-2 border-t border-border space-y-1">
        {/* Messages Button */}
        <button
          onClick={() => {
            setIsChatOpen(true);
            setIsMobileOpen(false);
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "hover:bg-primary/10 hover:text-primary text-muted-foreground",
            isCollapsed && "justify-center px-2"
          )}
        >
          <MessageSquare className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Messages</span>}
        </button>

        {bottomNavItems.map((item) => (
          <NavItemComponent key={item.path} item={item} />
        ))}
      </div>

      {/* User Profile */}
      <div className={cn(
        "px-3 py-4 border-t border-border",
        isCollapsed && "px-2"
      )}>
        <NavLink
          to="/profile"
          onClick={() => setIsMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 p-2 rounded-lg transition-all",
              "hover:bg-muted",
              isActive && "bg-muted",
              isCollapsed && "justify-center"
            )
          }
        >
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary-foreground">
              {user?.fullName
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2) || "U"}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.phone || ""}
              </p>
            </div>
          )}
        </NavLink>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg transition-all",
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Log out</span>}
        </button>
      </div>

      {/* Collapse Toggle (Desktop only) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-sm items-center justify-center hover:bg-muted transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border z-40 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg text-foreground">Krushi Unnati</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-30 bg-sidebar border-r border-sidebar-border transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Chat Dialog */}
      <ChatDialog open={isChatOpen} onOpenChange={setIsChatOpen} />
    </>
  );
};

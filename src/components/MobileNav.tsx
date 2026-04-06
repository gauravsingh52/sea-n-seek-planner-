import { useNavigate, useLocation } from "react-router-dom";
import { Home, Map, Bookmark, Plus, MessageSquare } from "lucide-react";

interface MobileNavProps {
  onNewChat?: () => void;
  savedCount?: number;
  onHistoryClick?: () => void;
}

export function MobileNav({ onNewChat, savedCount = 0, onHistoryClick }: MobileNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Map, label: "Itinerary", path: "/itinerary" },
    { icon: Bookmark, label: "Saved", path: "/saved", badge: savedCount },
    { icon: MessageSquare, label: "History", path: "history" },
    { icon: Plus, label: "New", path: "new" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/30">
      <div className="flex items-center justify-around py-2 px-4">
        {items.map((item) => {
          const isActive = item.path !== "new" && location.pathname === item.path;
          const handleClick = () => {
            if (item.path === "new") {
              onNewChat?.();
              navigate("/");
            } else if (item.path === "history") {
              onHistoryClick?.();
            } else {
              navigate(item.path);
            }
          };

          return (
            <button
              key={item.label}
              onClick={handleClick}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-0.5 right-1 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-bold">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

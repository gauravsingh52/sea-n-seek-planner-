import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutHandlers {
  onNewChat?: () => void;
  onSave?: () => void;
}

export function useKeyboardShortcuts({ onNewChat, onSave }: ShortcutHandlers) {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "n") {
        e.preventDefault();
        onNewChat?.();
        navigate("/");
      }

      if (ctrl && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }

      if (ctrl && e.key === "i") {
        e.preventDefault();
        navigate("/itinerary");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, onNewChat, onSave]);
}

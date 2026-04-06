import { useState, useEffect } from "react";
import { CheckSquare, Plus, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

const DEFAULT_ITEMS = [
  "Passport / ID",
  "Travel insurance",
  "Visa (if required)",
  "Flight tickets",
  "Hotel confirmation",
  "Local currency / cards",
  "Phone charger & adapter",
  "Medications",
];

export function TravelChecklist({ tripId }: { tripId?: string }) {
  const storageKey = `checklist-${tripId || "default"}`;

  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);
    return DEFAULT_ITEMS.map((text, i) => ({ id: `default-${i}`, text, checked: false }));
  });

  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const toggle = (id: string) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems((prev) => [...prev, { id: `custom-${Date.now()}`, text: newItem.trim(), checked: false }]);
    setNewItem("");
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

  const done = items.filter((i) => i.checked).length;
  const total = items.length;

  return (
    <Card className="glass-strong gradient-border">
      <CardHeader className="py-4 px-5">
        <CardTitle className="text-base font-display gradient-text mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" /> Travel Checklist
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {done}/{total} done
          </span>
        </CardTitle>

        <div className="w-full bg-muted/30 rounded-full h-1.5 mb-3">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
          />
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2.5 group cursor-pointer py-1.5 px-1 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={item.checked}
                onClick={() => toggle(item.id)}
                className={`flex-shrink-0 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  item.checked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/40 hover:border-primary"
                }`}
              >
                {item.checked && (
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className={`text-sm flex-1 transition-all duration-200 ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {item.text}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); removeItem(item.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </label>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add item..."
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <Button size="sm" variant="ghost" onClick={addItem} className="h-8 px-2">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}

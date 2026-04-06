import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, PiggyBank, Users, TrendingUp, AlertTriangle } from "lucide-react";
import type { ItineraryData } from "@/types/itinerary";

const currencySymbols: Record<string, string> = {
  INR: "₹", EUR: "€", USD: "$", GBP: "£", JPY: "¥", THB: "฿", AUD: "A$",
};

interface Props {
  itinerary: ItineraryData;
  budget?: number;
  travelers?: number;
}

export function BudgetTracker({ itinerary, budget, travelers = 1 }: Props) {
  const [open, setOpen] = useState(true);
  const symbol = currencySymbols[itinerary.currency] || itinerary.currency || "$";

  const categories = useMemo(() => {
    const cats: Record<string, number> = {};
    itinerary.legs.forEach((leg) => {
      const cat = leg.type === "transport" ? "Transport" : leg.type === "hotel" ? "Accommodation" : "Activities";
      cats[cat] = (cats[cat] || 0) + leg.cost;
    });
    return Object.entries(cats).sort(([, a], [, b]) => b - a);
  }, [itinerary.legs]);

  const total = itinerary.totalCost;
  const perPerson = travelers > 1 ? Math.ceil(total / travelers) : null;
  const budgetPercent = budget ? Math.min((total / budget) * 100, 100) : null;
  const isOverBudget = budget ? total > budget : false;
  const statusColor = budgetPercent
    ? budgetPercent > 90
      ? "text-destructive"
      : budgetPercent > 70
        ? "text-yellow-500"
        : "text-green-500"
    : "";

  const catColors = ["bg-primary", "bg-accent", "bg-secondary"];

  return (
    <Card className="glass-strong gradient-border">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-5 cursor-pointer hover:bg-muted/30 transition-colors">
            <CardTitle className="text-base font-display gradient-text flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4" /> Budget Tracker
              </span>
              {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-5 pb-4 space-y-4">
            {/* Budget progress */}
            {budget ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span className={`font-semibold ${statusColor}`}>
                    {symbol}{total.toFixed(0)} / {symbol}{budget.toFixed(0)}
                  </span>
                </div>
                <Progress value={budgetPercent || 0} className="h-3" />
                {isOverBudget && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Over budget by {symbol}{(total - budget).toFixed(0)}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {budgetPercent?.toFixed(0)}% of budget used
                  {budget > total && ` — ${symbol}${(budget - total).toFixed(0)} remaining`}
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">Set a budget in Trip Settings to track spending</p>
                <p className="text-lg font-bold gradient-text mt-1">{symbol}{total.toFixed(0)} total</p>
              </div>
            )}

            {/* Category breakdown - horizontal bar chart */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">By Category</p>
              {categories.map(([cat, cost], i) => {
                const pct = total > 0 ? (cost / total) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{cat}</span>
                      <span className="text-muted-foreground">{symbol}{cost.toFixed(0)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${catColors[i % catColors.length]} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Per person */}
            {perPerson && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">{travelers} travelers — </span>
                  <span className="font-semibold text-foreground">{symbol}{perPerson} per person</span>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

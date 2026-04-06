import { useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ItineraryLeg, LegType } from "@/types/itinerary";
import { toast } from "sonner";

interface CustomStopProps {
  onAdd: (leg: ItineraryLeg) => void;
  maxDay?: number;
}

export function CustomStop({ onAdd, maxDay = 1 }: CustomStopProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<LegType>("activity");
  const [cost, setCost] = useState("");
  const [time, setTime] = useState("");
  const [day, setDay] = useState("1");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const leg: ItineraryLeg = {
      id: `custom-${Date.now()}`,
      type,
      title: title.trim(),
      description: description.trim(),
      cost: Number(cost) || 0,
      time: time || undefined,
      day: Number(day) || 1,
      icon: type === "transport" ? "bus" : type === "hotel" ? "hotel" : "pin",
    };
    onAdd(leg);
    setTitle("");
    setDescription("");
    setCost("");
    setTime("");
    setOpen(false);
    toast.success("Stop added!");
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full glass gradient-border border-dashed gap-2 text-muted-foreground hover:text-foreground"
      >
        <PlusCircle className="w-4 h-4" /> Add Custom Stop
      </Button>
    );
  }

  return (
    <Card className="glass-strong gradient-border">
      <CardHeader className="py-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-base font-display gradient-text flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4" /> Add Custom Stop
          </CardTitle>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Visit local market" className="h-8 text-sm mt-1" />
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" className="h-8 text-sm mt-1" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as LegType)}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Cost</Label>
              <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" className="h-8 text-sm mt-1" />
            </div>

            <div>
              <Label className="text-xs">Day</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: Math.max(maxDay, 1) }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>Day {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Time</Label>
            <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 2:00 PM" className="h-8 text-sm mt-1" />
          </div>

          <Button onClick={handleSubmit} className="w-full h-8 text-sm earth-gradient">
            Add Stop
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}

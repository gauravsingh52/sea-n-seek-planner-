import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "tripmap_onboarded";

const STEPS = [
  {
    title: "Welcome to TripMap Planner.ai! 🗺️",
    description: "Plan trips anywhere — just type your destination and let AI handle the rest.",
  },
  {
    title: "Trip Settings ⚙️",
    description: "Set your budget, number of travelers, and travel dates for personalized plans.",
  },
  {
    title: "Voice Input 🎙️",
    description: "Tap the microphone to speak your travel plans instead of typing.",
  },
  {
    title: "Save & Share 📤",
    description: "Save your favorite itineraries and share them via WhatsApp, Telegram, or PDF.",
  },
];

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShow(true);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      dismiss();
    } else {
      setStep(step + 1);
    }
  };

  if (!show) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm animate-slide-up-fade">
      <div className="glass-strong rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-border/30">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-lg font-display font-bold text-foreground mb-2">{current.title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{current.description}</p>
        <div className="flex justify-between items-center">
          <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Skip tour
          </button>
          <Button onClick={next} size="sm" className="rounded-xl earth-gradient">
            {step >= STEPS.length - 1 ? "Get Started" : "Next"}
            {step < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

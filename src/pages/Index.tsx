import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Trash2, Map, ArrowRight, Sun, Moon, Bookmark, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessage } from "@/components/ChatMessage";
import { WaveLoader } from "@/components/WaveLoader";
import { Logo } from "@/components/Logo";
import { TripSettings, type TripSettingsData } from "@/components/TripSettings";
import { FollowUpChips } from "@/components/FollowUpChips";
import { VoiceInput } from "@/components/VoiceInput";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ScrollToTop } from "@/components/ScrollToTop";
import { MobileNav } from "@/components/MobileNav";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ChatHistory } from "@/components/ChatHistory";
import { TripComparison } from "@/components/TripComparison";
import { TripTemplates } from "@/components/TripTemplates";
import { useChat } from "@/hooks/useChat";
import { useTrip } from "@/contexts/TripContext";
import { useTheme } from "@/hooks/useTheme";
import { useGeoSuggestions } from "@/hooks/useGeoSuggestions";
import { useSmartSuggestions } from "@/hooks/useSmartSuggestions";
import { useSavedTrips } from "@/hooks/useSavedTrips";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useChatHistory } from "@/hooks/useChatHistory";

function Particles() {
  return (
    <div className="particles">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${15 + Math.random() * 20}s`,
            animationDelay: `${Math.random() * 10}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function Index() {
  const [input, setInput] = useState("");
  const [tripSettings, setTripSettings] = useState<TripSettingsData>({
    travelers: 1,
    language: navigator.language?.slice(0, 2) || "en",
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const { messages, isLoading, sendMessage, clearChat, loadChat, latestItinerary, comparisonItineraries, followUpSuggestions, triggerComparison } = useChat();
  const { setItinerary } = useTrip();
  const { count: savedCount } = useSavedTrips();
  const { sessions, saveSession, saveSessionDirect, renameSession, deleteSession, clearAll: clearHistory } = useChatHistory();
  const { suggestions: geoSuggestions, locationLabel: geoLabel, isLoading: geoLoading, countryCode } = useGeoSuggestions();
  const { suggestions: smartSuggestions, label: smartLabel } = useSmartSuggestions(sessions, geoSuggestions, geoLoading);
  const suggestions = smartSuggestions;
  const locationLabel = smartLabel || geoLabel;
  const { theme, toggleTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useKeyboardShortcuts({
    onNewChat: clearChat,
  });

  useEffect(() => {
    if (latestItinerary) {
      setItinerary(latestItinerary);
    }
  }, [latestItinerary, setItinerary]);

  // Auto-save to chat history only after streaming completes
  const wasLoading = useRef(false);
  useEffect(() => {
    if (wasLoading.current && !isLoading && messages.length > 0) {
      saveSession(messages, latestItinerary);
    }
    wasLoading.current = isLoading;
  }, [isLoading, messages, latestItinerary, saveSession]);

  // Save on browser close to catch mid-chat exits (direct IndexedDB write)
  useEffect(() => {
    const handleUnload = () => {
      if (messages.length > 0) {
        saveSessionDirect(messages, latestItinerary);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [messages, latestItinerary, saveSessionDirect]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement;
      viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), tripSettings);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const handleLoadSession = (session: typeof sessions[0]) => {
    loadChat(session.messages, session.itinerary);
    if (session.itinerary) setItinerary(session.itinerary);
  };

  const hasMessages = messages.length > 0;
  const showFollowUps = !isLoading && hasMessages && messages[messages.length - 1]?.role === "assistant";

  const UI_STRINGS: Record<string, { heading: string; subtitle: string; placeholder: string; locationPrefix: string }> = {
    en: { heading: "Where to next?", subtitle: "Plan trips anywhere in the world — compare ferries, trains & flights, find hotels, and build complete travel itineraries.", placeholder: "Plan your next adventure...", locationPrefix: "Popular trips near" },
    hi: { heading: "अगला सफ़र कहाँ?", subtitle: "दुनिया में कहीं भी यात्रा की योजना बनाएं — फ़ेरी, ट्रेन और फ़्लाइट की तुलना करें, होटल खोजें, और पूरी यात्रा योजना बनाएं।", placeholder: "अपनी अगली यात्रा की योजना बनाएं...", locationPrefix: "आपके पास लोकप्रिय यात्राएँ" },
    es: { heading: "¿A dónde vamos?", subtitle: "Planifica viajes a cualquier parte del mundo — compara ferris, trenes y vuelos, encuentra hoteles y crea itinerarios completos.", placeholder: "Planifica tu próxima aventura...", locationPrefix: "Viajes populares cerca de" },
    fr: { heading: "Où aller ensuite ?", subtitle: "Planifiez des voyages partout dans le monde — comparez ferries, trains et vols, trouvez des hôtels et créez des itinéraires complets.", placeholder: "Planifiez votre prochaine aventure...", locationPrefix: "Voyages populaires près de" },
    de: { heading: "Wohin als Nächstes?", subtitle: "Planen Sie Reisen weltweit — vergleichen Sie Fähren, Züge & Flüge, finden Sie Hotels und erstellen Sie Reiserouten.", placeholder: "Planen Sie Ihr nächstes Abenteuer...", locationPrefix: "Beliebte Reisen in der Nähe von" },
    ja: { heading: "次はどこへ？", subtitle: "世界中の旅行を計画 — フェリー、電車、フライトを比較し、ホテルを見つけ、完全な旅程を作成。", placeholder: "次の冒険を計画...", locationPrefix: "近くの人気旅行" },
    zh: { heading: "下一站去哪？", subtitle: "规划全球旅行 — 比较渡轮、火车和航班，找酒店，制定完整行程。", placeholder: "规划你的下一次冒险...", locationPrefix: "附近热门旅行" },
    ko: { heading: "다음은 어디로?", subtitle: "전 세계 여행을 계획하세요 — 페리, 기차, 항공편을 비교하고 호텔을 찾고 완전한 여행 일정을 만드세요.", placeholder: "다음 모험을 계획하세요...", locationPrefix: "근처 인기 여행" },
  };
  const lang = tripSettings.language || "en";
  const t = UI_STRINGS[lang] || UI_STRINGS.en;

  return (
    <div className="flex flex-col h-screen bg-background relative travel-bg">
      <Particles />
      <OnboardingTour />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 glass-strong border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="transition-transform duration-300 hover:scale-110">
            <Logo size={42} />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground leading-none">TripMap Planner.ai</h1>
            <p className="text-xs text-foreground/50">AI-powered travel planning</p>
          </div>
        </div>
        <div className="flex gap-2">
          <LanguageSelector
            value={tripSettings.language}
            onChange={(lang) => setTripSettings(s => ({ ...s, language: lang }))}
          />
          <div className="hidden md:flex gap-2">
            <ChatHistory
              sessions={sessions}
              onLoad={handleLoadSession}
              onDelete={deleteSession}
              onClearAll={clearHistory}
              onRename={renameSession}
            />
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme" className="glass hover:glow-primary transition-all duration-300 text-foreground">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/saved")} className="glass text-foreground relative">
              <Bookmark className="w-4 h-4 mr-1" /> Saved
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {savedCount > 9 ? "9+" : savedCount}
                </span>
              )}
            </Button>
            {hasMessages && (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/itinerary")} className="glass text-foreground">
                  <Map className="w-4 h-4 mr-1" /> Itinerary
                </Button>
                <Button variant="ghost" size="icon" onClick={clearChat} title="New chat" className="glass text-foreground">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-8 text-center">
            <div className="mb-8 animate-slide-up-fade" style={{ animationDelay: "0s" }}>
              <Logo size={80} />
            </div>
            <h2
              className="text-4xl md:text-6xl font-display font-bold gradient-text mb-4 animate-slide-up-fade drop-shadow-lg"
              style={{ animationDelay: "0.15s" }}
            >
              {t.heading}
            </h2>
            <p
              className="text-foreground/70 mb-12 max-w-md text-base animate-slide-up-fade"
              style={{ animationDelay: "0.3s" }}
            >
              {t.subtitle}
            </p>

            {locationLabel && !geoLoading && (
              <p className="text-sm text-primary/80 mb-4 animate-slide-up-fade" style={{ animationDelay: "0.35s" }}>
                📍 {locationLabel}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl w-full">
              {geoLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[72px] rounded-2xl" />
                  ))
                : suggestions.map((prompt, i) => (
                    <button
                      key={prompt.text}
                      onClick={() => sendMessage(prompt.text, tripSettings)}
                      className="group relative text-left px-5 py-5 rounded-2xl glass gradient-border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/10 animate-slide-up-fade"
                      style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary/25 group-hover:shadow-md group-hover:shadow-primary/20">
                          <prompt.icon className="w-5 h-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <span className="text-sm text-foreground leading-snug flex-1">{prompt.text}</span>
                      </div>
                      <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-0 translate-x-[-8px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                    </button>
                  ))}
            </div>
            <TripTemplates onSelect={(prompt) => sendMessage(prompt, tripSettings)} />
          </div>
        ) : (
          <div className="relative h-full">
            <ScrollArea className="h-full" ref={scrollRef}>
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-4">
                {messages.map((msg, idx) => {
                  // An assistant message "has itinerary" if it's followed by itinerary data
                  const hasItinerary = msg.role === "assistant" && !!latestItinerary && 
                    (idx === messages.length - 1 || messages.slice(idx + 1).every(m => m.role === "user"));
                  return (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      hasItinerary={hasItinerary}
                      onCompare={() => triggerComparison(tripSettings)}
                    />
                  );
                })}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && <WaveLoader />}
                {showFollowUps && (
                  <>
                    <FollowUpChips
                      suggestions={followUpSuggestions}
                      onSelect={(text) => sendMessage(text, tripSettings)}
                      disabled={isLoading}
                      regionCode={countryCode}
                    />
                  </>
                )}
                {comparisonItineraries.length > 1 && (
                  <TripComparison
                    itineraries={comparisonItineraries}
                    onSelect={(it) => { setItinerary(it); navigate("/itinerary"); }}
                  />
                )}
              </div>
            </ScrollArea>
            <ScrollToTop scrollRef={scrollRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="relative z-10 p-3 md:p-4 mb-14 md:mb-0">
        <div className="max-w-3xl mx-auto mb-2">
          <TripSettings settings={tripSettings} onChange={setTripSettings} />
        </div>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <div className="flex-1 relative group">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              rows={1}
              className="w-full resize-none rounded-2xl glass-strong px-5 py-3.5 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-300 disabled:opacity-50"
              disabled={isLoading}
            />
          </div>
          <VoiceInput onTranscript={handleVoiceTranscript} disabled={isLoading} />
          <Button
            type="submit"
            size="icon"
            className={`rounded-2xl h-[48px] w-[48px] earth-gradient shadow-lg transition-all duration-300 ${
              input.trim() ? "scale-100 shadow-primary/30" : "scale-95 opacity-70"
            }`}
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-2 opacity-40">
          Prices are AI-generated estimates. Always verify with operators before booking.
        </p>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav onNewChat={clearChat} savedCount={savedCount} onHistoryClick={() => setHistoryOpen(true)} />

      {/* Mobile history drawer - triggered programmatically */}
      <div className="md:hidden">
        <ChatHistory
          sessions={sessions}
          onLoad={handleLoadSession}
          onDelete={deleteSession}
          onClearAll={clearHistory}
          onRename={renameSession}
          trigger={<span className="hidden" />}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      </div>
    </div>
  );
}

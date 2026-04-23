import { useState, useCallback } from "react";
import type { ItineraryData } from "@/types/itinerary";
import { playMessageSound } from "@/hooks/useMessageSound";
import type { TripSettingsData } from "@/components/TripSettings";
import { format } from "date-fns";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

function mapItinerary(raw: any): ItineraryData & { followUpSuggestions?: string[]; packingList?: string[] } {
  return {
    legs: raw.legs.map((leg: any, i: number) => ({
      id: leg.id || `leg-${i}`,
      type: leg.type || "activity",
      title: leg.title || "",
      description: leg.description || "",
      from: leg.from,
      to: leg.to,
      fromCoords: leg.fromCoords,
      toCoords: leg.toCoords,
      time: leg.time,
      cost: Number(leg.cost) || 0,
      icon: leg.icon,
      day: leg.day,
    })),
    totalCost: Number(raw.totalCost) || 0,
    currency: raw.currency || "",
    title: raw.title,
    days: raw.days,
    nights: raw.nights,
    packingList: Array.isArray(raw.packingList) ? raw.packingList : undefined,
    followUpSuggestions: Array.isArray(raw.followUpSuggestions) ? raw.followUpSuggestions : undefined,
    emergencyInfo: raw.emergencyInfo || undefined,
  };
}

function parseAllItineraryBlocks(text: string): (ItineraryData & { followUpSuggestions?: string[]; packingList?: string[] })[] {
  const results: (ItineraryData & { followUpSuggestions?: string[]; packingList?: string[] })[] = [];
  const markers = ["```itinerary-json", "~~~itinerary-json", "```json"];

  for (const marker of markers) {
    let searchFrom = 0;
    while (true) {
      const startIdx = text.indexOf(marker, searchFrom);
      if (startIdx === -1) break;
      const jsonStart = text.indexOf("\n", startIdx) + 1;
      const closingMarker = marker.startsWith("~~~") ? "~~~" : "```";
      const endIdx = text.indexOf(closingMarker, jsonStart);
      if (endIdx === -1) break;
      try {
        const raw = JSON.parse(text.slice(jsonStart, endIdx).trim());
        if (raw && Array.isArray(raw.legs) && raw.legs.length > 0) {
          results.push(mapItinerary(raw));
        }
      } catch { /* skip invalid */ }
      searchFrom = endIdx + 3;
    }
  }

  // Fallback: try to find a raw JSON object with "legs"
  if (results.length === 0) {
    try {
      const legsIdx = text.indexOf('"legs"');
      if (legsIdx !== -1) {
        let braceStart = text.lastIndexOf("{", legsIdx);
        if (braceStart !== -1) {
          let depth = 0, braceEnd = -1;
          for (let i = braceStart; i < text.length; i++) {
            if (text[i] === "{") depth++;
            else if (text[i] === "}") { depth--; if (depth === 0) { braceEnd = i + 1; break; } }
          }
          if (braceEnd !== -1) {
            const raw = JSON.parse(text.slice(braceStart, braceEnd));
            if (raw && Array.isArray(raw.legs) && raw.legs.length > 0) results.push(mapItinerary(raw));
          }
        }
      }
    } catch { /* ignore */ }
  }

  return results;
}

function stripItineraryBlocks(text: string): string {
  let result = text;
  const markers = ["```itinerary-json", "~~~itinerary-json", "```json"];
  for (const marker of markers) {
    while (true) {
      const startIdx = result.indexOf(marker);
      if (startIdx === -1) break;
      const closingMarker = marker.startsWith("~~~") ? "~~~" : "```";
      const endIdx = result.indexOf(closingMarker, startIdx + marker.length);
      if (endIdx === -1) break;
      result = (result.slice(0, startIdx) + result.slice(endIdx + 3)).trim();
    }
  }
  return result;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [latestItinerary, setLatestItinerary] = useState<ItineraryData | null>(null);
  const [comparisonItineraries, setComparisonItineraries] = useState<ItineraryData[]>([]);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [packingList, setPackingList] = useState<string[]>([]);

  const sendMessage = useCallback(async (input: string, settings?: TripSettingsData) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input };
    const allMessages = [...messages, userMsg];
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setFollowUpSuggestions([]);

    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    try {
      const settingsPayload = settings ? {
        budget: settings.budget,
        travelers: settings.travelers,
        dateFrom: settings.dateRange ? format(settings.dateRange.from, "yyyy-MM-dd") : undefined,
        dateTo: settings.dateRange ? format(settings.dateRange.to, "yyyy-MM-dd") : undefined,
        language: settings.language,
      } : undefined;

      // Auto-detect comparison intent and add hint
      const compareKeywords = /\b(compare|alternatives|options|vs|versus|which is better|budget vs|side.by.side)\b/i;
      const apiMessages = allMessages.map(m => ({ role: m.role, content: m.content }));
      if (compareKeywords.test(input)) {
        const lastMsg = apiMessages[apiMessages.length - 1];
        lastMsg.content += "\n\n[SYSTEM HINT: User wants comparison — output 2-3 SEPARATE itinerary-json blocks, one per option]";
      }

      let resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: apiMessages,
          settings: settingsPayload,
        }),
      });

      // If request fails, log the error details
      if (!resp.ok) {
        const errText = await resp.text();
        console.error("Chat endpoint error:", { status: resp.status, statusText: resp.statusText, body: errText });
        
        let errorMsg = `Error ${resp.status}`;
        try {
          const errData = JSON.parse(errText);
          errorMsg = errData.error || errData.message || errorMsg;
        } catch (e) {
          // Text is not JSON, use as-is or generic error
          errorMsg = errText || errorMsg;
        }
        
        throw new Error(errorMsg);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              if (!assistantContent) playMessageSound();
              assistantContent += content;
              const displayContent = stripItineraryBlocks(assistantContent);
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id === assistantId) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: displayContent } : m);
                }
                return [...prev, { id: assistantId, role: "assistant", content: displayContent }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      const allItineraries = parseAllItineraryBlocks(assistantContent);
      if (allItineraries.length > 1) {
        setComparisonItineraries(allItineraries);
        setLatestItinerary(allItineraries[0]);
      } else if (allItineraries.length === 1) {
        setLatestItinerary(allItineraries[0]);
      }
      
      // Extract suggestions/packing from first itinerary
      if (allItineraries.length > 0) {
        const first = allItineraries[0];
        if (first.followUpSuggestions) setFollowUpSuggestions(first.followUpSuggestions);
        if (first.packingList) setPackingList(first.packingList);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages(prev => [
        ...prev,
        { id: assistantId, role: "assistant", content: `⚠️ ${errorMsg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setLatestItinerary(null);
    setComparisonItineraries([]);
    setFollowUpSuggestions([]);
    setPackingList([]);
  }, []);

  const loadChat = useCallback((msgs: Message[], itinerary?: ItineraryData | null) => {
    setMessages(msgs);
    setLatestItinerary(itinerary || null);
    setComparisonItineraries([]);
    setFollowUpSuggestions([]);
    setPackingList([]);
  }, []);

  const triggerComparison = useCallback((settings?: TripSettingsData) => {
    const title = latestItinerary?.title || "this trip";
    const prompt = `Compare 3 different options for "${title}" — show budget, mid-range, and premium alternatives`;
    sendMessage(prompt, settings);
  }, [latestItinerary, sendMessage]);

  return { messages, isLoading, sendMessage, clearChat, loadChat, latestItinerary, comparisonItineraries, followUpSuggestions, packingList, triggerComparison };
}

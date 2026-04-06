import { useState, useCallback, useEffect, useRef } from "react";
import { get, set } from "idb-keyval";
import type { Message } from "@/hooks/useChat";
import type { ItineraryData } from "@/types/itinerary";

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  itinerary?: ItineraryData | null;
  customTitle?: boolean;
}

const STORAGE_KEY = "tripmap-chat-history";
const LOCAL_STORAGE_KEY = "tripmap-chat-history";
const MAX_SESSIONS = 50;

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const initialized = useRef(false);

  // Load from IndexedDB on mount, migrate from localStorage if needed
  useEffect(() => {
    (async () => {
      try {
        // One-time migration from localStorage
        const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localRaw) {
          const localSessions: ChatSession[] = JSON.parse(localRaw);
          const existing = (await get<ChatSession[]>(STORAGE_KEY)) || [];
          const merged = [...localSessions, ...existing]
            .filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)
            .slice(0, MAX_SESSIONS);
          await set(STORAGE_KEY, merged);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setSessions(merged);
        } else {
          const stored = (await get<ChatSession[]>(STORAGE_KEY)) || [];
          setSessions(stored);
        }
      } catch {
        setSessions([]);
      }
      initialized.current = true;
    })();
  }, []);

  // Persist to IndexedDB whenever sessions change (debounced to avoid write races)
  useEffect(() => {
    if (!initialized.current) return;
    const timer = setTimeout(() => {
      set(STORAGE_KEY, sessions.slice(0, MAX_SESSIONS)).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [sessions]);

  const saveSession = useCallback((messages: Message[], itinerary?: ItineraryData | null) => {
    if (messages.length === 0) return;
    const firstUserMsg = messages.find(m => m.role === "user");
    const autoTitle = firstUserMsg?.content.slice(0, 60) || "Untitled chat";
    const sessionId = messages[0].id;

    setSessions(prev => {
      const existing = prev.findIndex(s => s.id === sessionId);
      const existingSession = existing >= 0 ? prev[existing] : null;
      const session: ChatSession = {
        id: sessionId,
        title: existingSession?.customTitle ? existingSession.title : autoTitle,
        customTitle: existingSession?.customTitle,
        messages,
        createdAt: existingSession?.createdAt || new Date().toISOString(),
        itinerary,
      };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = session;
        return updated;
      }
      return [session, ...prev].slice(0, MAX_SESSIONS);
    });
  }, []);

  const renameSession = useCallback((id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle, customTitle: true } : s));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setSessions([]);
  }, []);

  // Direct IndexedDB write for beforeunload (bypasses React state)
  const saveSessionDirect = useCallback(async (messages: Message[], itinerary?: ItineraryData | null) => {
    if (messages.length === 0) return;
    try {
      const firstUserMsg = messages.find(m => m.role === "user");
      const autoTitle = firstUserMsg?.content.slice(0, 60) || "Untitled chat";
      const sessionId = messages[0].id;
      const existing = (await get<ChatSession[]>(STORAGE_KEY)) || [];
      const existingSession = existing.find(s => s.id === sessionId);
      const session: ChatSession = {
        id: sessionId,
        title: existingSession?.customTitle ? existingSession.title : autoTitle,
        customTitle: existingSession?.customTitle,
        messages,
        createdAt: existingSession?.createdAt || new Date().toISOString(),
        itinerary,
      };
      const idx = existing.findIndex(s => s.id === sessionId);
      if (idx >= 0) {
        existing[idx] = session;
      } else {
        existing.unshift(session);
      }
      await set(STORAGE_KEY, existing.slice(0, MAX_SESSIONS));
    } catch {}
  }, []);

  return { sessions, saveSession, saveSessionDirect, renameSession, deleteSession, clearAll };
}

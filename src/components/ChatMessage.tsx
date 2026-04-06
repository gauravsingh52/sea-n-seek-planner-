import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MapPin, Navigation, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Message } from "@/hooks/useChat";
import { useTypingEffect } from "@/hooks/useTypingEffect";

function AssistantContent({ content }: { content: string }) {
  const { displayed, isTyping } = useTypingEffect(content);
  return (
    <div className="prose prose-sm max-w-none prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-td:text-foreground prose-th:text-foreground prose-a:text-primary overflow-x-auto">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayed}</ReactMarkdown>
      {isTyping && <span className="typing-cursor">▍</span>}
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
  hasItinerary?: boolean;
  onCompare?: () => void;
}

export function ChatMessage({ message, hasItinerary, onCompare }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      style={{
        animation: isUser
          ? "slide-in-right 0.4s ease-out forwards"
          : "slide-in-left 0.4s ease-out forwards",
      }}
    >
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-lg ring-2 ${
          isUser
            ? "earth-gradient ring-primary/30"
            : "teal-gradient ring-accent/30"
        }`}
      >
        {isUser ? (
          <MapPin className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Navigation className="w-4 h-4 text-primary-foreground" />
        )}
      </div>
      <div className={`flex flex-col gap-1.5 ${isUser ? "max-w-[75%]" : "max-w-[85%]"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "earth-gradient text-primary-foreground rounded-br-md shadow-lg shadow-primary/20"
              : "glass-strong rounded-bl-md border-l-2 border-primary/40"
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <AssistantContent content={message.content} />
          )}
        </div>
        {!isUser && hasItinerary && onCompare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCompare}
            className="self-start glass text-xs text-primary hover:text-primary-foreground hover:bg-primary/80 transition-all duration-300 gap-1.5 rounded-xl"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Compare 3 options
          </Button>
        )}
      </div>
    </div>
  );
}

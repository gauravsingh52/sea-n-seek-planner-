import { useState } from "react";
import { MessageSquare, Trash2, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ChatSession } from "@/hooks/useChatHistory";
import { formatDistanceToNow } from "date-fns";

interface ChatHistoryProps {
  sessions: ChatSession[];
  onLoad: (session: ChatSession) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onRename?: (id: string, newTitle: string) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChatHistory({ sessions, onLoad, onDelete, onClearAll, onRename, trigger, open, onOpenChange }: ChatHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const commitRename = () => {
    if (editingId && editValue.trim() && onRename) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="glass text-foreground">
            <MessageSquare className="w-4 h-4 mr-1" /> History
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b border-border/30">
          <SheetTitle className="text-foreground">Chat History</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)]">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No past conversations yet.
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="group flex items-start gap-2 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => editingId !== session.id && onLoad(session)}
                >
                  <MessageSquare className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {editingId === session.id ? (
                      <div className="flex gap-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditingId(null); }}
                          onBlur={commitRename}
                          className="h-6 text-sm px-1"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); commitRename(); }}>
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-foreground truncate font-medium">{session.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })} · {session.messages.length} messages
                        </p>
                      </>
                    )}
                  </div>
                  {editingId !== session.id && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                      {onRename && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={(e) => startRename(session, e)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {sessions.length > 0 && (
          <div className="p-3 border-t border-border/30">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClearAll}>
              Clear all history
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

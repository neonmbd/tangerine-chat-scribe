
import React from "react";
import { Link } from "react-router-dom";
import { Conversation } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
}) => {
  return (
    <Link to={`/chat/${conversation.id}`}>
      <div
        className={cn(
          "flex items-center px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors",
          isActive && "bg-sidebar-accent"
        )}
      >
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div className="ml-3 flex-1 overflow-hidden">
          <p className="font-medium text-sm truncate">{conversation.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {format(new Date(conversation.updated_at), "MMM d, h:mm a")}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ConversationItem;

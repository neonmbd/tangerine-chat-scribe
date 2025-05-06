
import React from "react";
import { Message } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface MessageItemProps {
  message: Message;
  isFirstInGroup?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isFirstInGroup = true,
  className,
  style,
}) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "group flex items-start gap-3",
        isUser ? "justify-end" : "justify-start",
        className
      )}
      style={style}
    >
      {!isUser && isFirstInGroup && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      {!isUser && !isFirstInGroup && <div className="w-8" />}

      <div
        className={cn(
          isUser ? "message-user" : "message-assistant",
          !isFirstInGroup && isUser && "mr-11",
          !isFirstInGroup && !isUser && "ml-11"
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>

      {isUser && isFirstInGroup && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
      {isUser && !isFirstInGroup && <div className="w-8" />}
    </div>
  );
};
